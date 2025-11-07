using backend.Contracts.Auth;
using Microsoft.EntityFrameworkCore;
using backend.Models.Authentication;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace backend.Services.Auth
{
    public class TokenService : ITokenService
    {
        private readonly AuthDbContext _db;
        private readonly IConfiguration _config;

        private readonly int _accessTokenExpirationMinutes;
        private readonly int _refreshTokenExpirationDays;

        public TokenService(AuthDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;

            _accessTokenExpirationMinutes = _config.GetValue<int>("Jwt:AccessTokenExpirationMinutes");
            _refreshTokenExpirationDays = _config.GetValue<int>("Jwt:RefreshTokenExpirationDays");
        }

        public async Task<string> GenerateAccessTokenAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Secret"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                [
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email),
                    new Claim("username", user.Username ?? ""),
                    new Claim("isAdmin", user.IsAdmin.ToString())
                ]),
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<string> GenerateRefreshTokenAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found");

            var refreshToken = new RefreshToken
            {
                UserId = userId,
                User = user,
                Token = Guid.NewGuid().ToString("N"),
                CreatedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshTokenExpirationDays)
            };

            _db.RefreshTokens.Add(refreshToken);
            await _db.SaveChangesAsync();

            return refreshToken.Token;
        }

        public async Task<bool> ValidateRefreshTokenAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
            if (refreshToken == null || refreshToken.Revoked) return false;

            return true;
        }

        public async Task<string> RefreshAccessTokenAsync(string refreshToken)
        {
            var tokenEntry = await _db.RefreshTokens.Include(t => t.User)
             .FirstOrDefaultAsync(t => t.Token == refreshToken && !t.Revoked);

            if (tokenEntry == null) throw new Exception("Invalid refresh token");

            var newAccessToken = await GenerateAccessTokenAsync(tokenEntry.UserId);

            return newAccessToken;
        }


        public async Task InvalidateRefreshTokenAsync(string refreshToken)
        {
            var tokenEntry = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == refreshToken);
            if (tokenEntry != null)
            {
                tokenEntry.Revoked = true;
                tokenEntry.UpdatedAt = DateTimeOffset.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public async Task InvalidateAllRefreshTokensForUserAsync(Guid userId)
        {
            var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId && !t.Revoked).ToListAsync();
            foreach (var token in tokens)
            {
                token.Revoked = true;
                token.UpdatedAt = DateTimeOffset.UtcNow;
            }
            await _db.SaveChangesAsync();
        }

        public async Task<Guid?> GetUserIdFromTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return null;

            // Check if it's a JWT access token (starts with "eyJ" which is base64 for "{"")
            if (token.StartsWith("eyJ"))
            {
                try
                {
                    var tokenHandler = new JwtSecurityTokenHandler();
                    var key = Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? "");
                    
                    var validationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(key),
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = false
                    };

                    var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                    var jwtToken = (JwtSecurityToken)validatedToken;
                    
                    var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
                    if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                    {
                        return userId;
                    }
                }
                catch{/* no operation */}
            }
            var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token && !t.Revoked);
            return refreshToken?.UserId;
        }

        public async Task<bool> IsTokenRevokedAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
            return refreshToken?.Revoked ?? true;
        }
    }
}
