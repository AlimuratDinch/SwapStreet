using backend.Services.Auth;
using Microsoft.EntityFrameworkCore;
using backend.Models.Authentication;
using Xunit;
using AwesomeAssertions;

namespace backend.Tests
{
    public class TokenServiceTests
    {
        private TokenService CreateService(out AuthDbContext dbContext)
        {
            // In-memory EF Core DB
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            dbContext = new AuthDbContext(options);

            // Seed a user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                Username = "tester",
                EncryptedPassword = "hashed",
                IsAdmin = false
            };
            dbContext.Users.Add(user);
            dbContext.SaveChanges();

            // Mock IConfiguration
            var inMemorySettings = new System.Collections.Generic.Dictionary<string, string> {
                {"Jwt:Secret", "123456789012345678901234567890123"},
                {"Jwt:AccessTokenExpirationMinutes", "15"},
                {"Jwt:RefreshTokenExpirationDays", "30"}
            };
            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var service = new TokenService(dbContext, configuration);
            return service;
        }

        [Fact]
        public async Task GenerateAccessTokenAsync_ShouldReturn_ValidJWT()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            var token = await service.GenerateAccessTokenAsync(user.Id);

            token.Should().NotBeNullOrEmpty();

            // Validate JWT structure
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            handler.CanReadToken(token).Should().BeTrue();
            var jwt = handler.ReadJwtToken(token);
            jwt.Subject.Should().Be(user.Id.ToString());
            jwt.Claims.Should().Contain(c => c.Type == "username" && c.Value == user.Username);
        }

        [Fact]
        public async Task GenerateRefreshTokenAsync_ShouldSaveTokenToDb()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            var token = await service.GenerateRefreshTokenAsync(user.Id);

            token.Should().NotBeNullOrEmpty();

            var dbToken = await db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
            dbToken.Should().NotBeNull();
            dbToken.UserId.Should().Be(user.Id);
            dbToken.Revoked.Should().BeFalse();
        }

        [Fact]
        public async Task RefreshAccessTokenAsync_ShouldReturn_NewAccessToken()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            // Create a refresh token
            var refreshToken = await service.GenerateRefreshTokenAsync(user.Id);

            // Refresh access token
            var newAccessToken = await service.RefreshAccessTokenAsync(refreshToken);

            newAccessToken.Should().NotBeNullOrEmpty();
            newAccessToken.Should().NotBe(refreshToken);
        }

        [Fact]
        public async Task InvalidateRefreshTokenAsync_ShouldSetRevoked()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            var token = await service.GenerateRefreshTokenAsync(user.Id);

            await service.InvalidateRefreshTokenAsync(token);

            var dbToken = await db.RefreshTokens.FirstAsync(t => t.Token == token);
            dbToken.Revoked.Should().BeTrue();
        }
    }
}
