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

        private readonly string _jwtSecret;

        //Default values are for local testing with XUnit and are not used in dev or prod
        public TokenService(AuthDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;

            _accessTokenExpirationMinutes = _config.GetValue<int>("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", 60);
            _refreshTokenExpirationDays = _config.GetValue<int>("REFRESH_TOKEN_EXPIRATION_DAYS", 30);

            _jwtSecret = _config["JWT_SECRET"] ?? "402375d38deb9c479fb043f369d1b2d2";
        }

        public async Task<string> GenerateAccessTokenAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSecret);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("username", user.Username ?? ""),
                new Claim("isAdmin", user.IsAdmin.ToString()),
                new Claim("isEmailConfirmed", user.IsEmailConfirmed.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
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

        public async Task<Guid?> GetUserIdFromRefreshTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return null;

            var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token && !t.Revoked);
            return refreshToken?.UserId;
        }

        public Guid? GetUserIdFromAccessToken(string accessToken)
        {
            if (string.IsNullOrWhiteSpace(accessToken))
                return null;

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSecret);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(accessToken, validationParameters, out _);

                var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdClaim, out var userId))
                    return userId;

                return null;
            }
            catch (SecurityTokenExpiredException)
            {
                // Token expired
                return null;
            }
            catch (SecurityTokenException)
            {
                // Invalid token
                return null;
            }
            catch
            {
                // Other errors
                return null;
            }
        }


        public async Task<bool> IsTokenRevokedAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
            return refreshToken?.Revoked ?? true;
        }
    }
}
