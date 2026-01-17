using System;
using System.Threading.Tasks;
using backend.Services.Auth;
using Microsoft.EntityFrameworkCore;
using backend.Models.Authentication;
using Xunit;
using AwesomeAssertions;
using Microsoft.Extensions.Configuration;

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
                {"Jwt:Secret", "402375d38deb9c479fb043f369d1b2d2"},
                {"Jwt:RefreshTokenExpirationDays", "30"},
                {"Jwt:AccessTokenExpirationMinutes", "60"}
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
        [Fact]
        public async Task GenerateAccessTokenAsync_UserNotFound_Throws()
        {
            var service = CreateService(out var db);

            await Assert.ThrowsAsync<Exception>(() => service.GenerateAccessTokenAsync(Guid.NewGuid()));
        }

        [Fact]
        public async Task GenerateRefreshTokenAsync_UserNotFound_Throws()
        {
            var service = CreateService(out var db);

            await Assert.ThrowsAsync<Exception>(() => service.GenerateRefreshTokenAsync(Guid.NewGuid()));
        }

        [Fact]
        public async Task ValidateRefreshTokenAsync_ReturnsFalse_ForMissingOrRevoked()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            // missing token -> false
            (await service.ValidateRefreshTokenAsync("no-such-token")).Should().BeFalse();

            // generate then revoke
            var token = await service.GenerateRefreshTokenAsync(user.Id);
            var entry = await db.RefreshTokens.FirstAsync(t => t.Token == token);
            entry.Revoked = true;
            await db.SaveChangesAsync();

            (await service.ValidateRefreshTokenAsync(token)).Should().BeFalse();
        }

        [Fact]
        public async Task RefreshAccessTokenAsync_InvalidToken_Throws()
        {
            var service = CreateService(out var db);

            await Assert.ThrowsAsync<Exception>(() => service.RefreshAccessTokenAsync("invalid-token"));
        }

        [Fact]
        public async Task InvalidateRefreshTokenAsync_NoThrow_WhenMissing_And_IsTokenRevokedAsync_Behaves()
        {
            var service = CreateService(out var db);

            // No throw for missing token
            await service.InvalidateRefreshTokenAsync("does-not-exist");

            // Missing token -> IsTokenRevokedAsync returns true (per implementation)
            (await service.IsTokenRevokedAsync("does-not-exist")).Should().BeTrue();
        }

        [Fact]
        public async Task InvalidateAllRefreshTokensForUserAsync_RevokesAllTokens()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            // create multiple tokens
            var t1 = await service.GenerateRefreshTokenAsync(user.Id);
            var t2 = await service.GenerateRefreshTokenAsync(user.Id);

            // sanity check not revoked
            (await service.IsTokenRevokedAsync(t1)).Should().BeFalse();
            (await service.IsTokenRevokedAsync(t2)).Should().BeFalse();

            await service.InvalidateAllRefreshTokensForUserAsync(user.Id);

            // both should be revoked in DB
            (await service.IsTokenRevokedAsync(t1)).Should().BeTrue();
            (await service.IsTokenRevokedAsync(t2)).Should().BeTrue();
        }

        [Fact]
        public async Task GetUserIdFromTokenAsync_ReturnsNull_WhenRevokedOrMissing()
        {
            var service = CreateService(out var db);
            var user = await db.Users.FirstAsync();

            var token = await service.GenerateRefreshTokenAsync(user.Id);

            // revoke token
            var entry = await db.RefreshTokens.FirstAsync(t => t.Token == token);
            entry.Revoked = true;
            await db.SaveChangesAsync();

            // revoked -> null
            (await service.GetUserIdFromRefreshTokenAsync(token)).Should().BeNull();

            // missing -> null
            (await service.GetUserIdFromRefreshTokenAsync("nope")).Should().BeNull();
        }
    }
}
