using System;
using System.Threading;
using System.Threading.Tasks;
using backend.DbContexts;
using backend.DTOs.Chat;
using backend.DTOs.Listings;
using backend.DTOs.Profile;
using backend.Models.Authentication;
using backend.Services.Auth;
using backend.Contracts;
using backend.Contracts.Auth;
using Microsoft.EntityFrameworkCore;
using Xunit;
using AwesomeAssertions;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace backend.Tests
{
    public class UserServiceTests : IDisposable
    {
        private readonly AuthDbContext _db;
        private readonly UserService _service;

        private readonly SpyEmailService _emailService;

        public UserServiceTests()
        {
            // 1. Setup In-Memory DB
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new AuthDbContext(options);

            // 2. Setup Spy Email Service (so we can check if emails were sent)
            _emailService = new SpyEmailService();

            // 3. Setup Configuration (Simulate appsettings)
            var inMemorySettings = new Dictionary<string, string> {
                {"FrontendUrl", "http://test-frontend.com"}
            };
            IConfiguration config = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            // 4. Simple fake hasher
            var hasher = new FakePasswordHasher();

            _service = new UserService(
                hasher,
                _db,
                _emailService,
                new DummyListingCommandService(),
                new DummyProfileService(),
                new DummyChatroomService(),
                config
            );
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task RegisterAsync_ShouldCreateUserWithHashedPassword()
        {
            var email = "test@example.com";
            var username = "tester";
            var password = "password123";

            var user = await _service.RegisterAsync(email, username, password);

            user.Should().NotBeNull();
            user.Email.Should().Be(email);
            user.Username.Should().Be(username);
            user.EncryptedPassword.Should().StartWith("HASHED:");

            // Ensure saved in DB
            var fromDb = await _db.Users.FindAsync(user.Id);
            fromDb.Should().NotBeNull();
            fromDb!.Email.Should().Be(email);
        }

        [Fact]
        public async Task GetUserByEmailAsync_ShouldReturnUser()
        {
            var user = new User { Email = "u1@example.com", Username = "u1", EncryptedPassword = "p" };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            var found = await _service.GetUserByEmailAsync("u1@example.com");

            found.Should().NotBeNull();
            found!.Id.Should().Be(user.Id);
        }

        [Fact]
        public async Task GetUserByUsernameAsync_ShouldReturnUser()
        {
            var user = new User { Email = "u2@example.com", Username = "u2", EncryptedPassword = "p" };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            var found = await _service.GetUserByUsernameAsync("u2");

            found.Should().NotBeNull();
            found!.Id.Should().Be(user.Id);
        }

        [Fact]
        public async Task LoginWithPasswordAsync_WithEmailAndCorrectPassword_ShouldReturnDto()
        {
            var hasher = new FakePasswordHasher();
            var password = "secret";
            var user = new User { Email = "login@example.com", Username = "login", EncryptedPassword = hasher.HashPassword(password) };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            var result = _service.LoginWithPassword(user, password);

            result.Should().NotBeNull();
            result!.Email.Should().Be(user.Email);
            result.Username.Should().Be(user.Username);
        }

        [Fact]
        public async Task LoginWithPasswordAsync_WithUsernameAndIncorrectPassword_ShouldReturnNull()
        {
            var hasher = new FakePasswordHasher();
            var user = new User { Email = "a@example.com", Username = "auser", EncryptedPassword = hasher.HashPassword("rightpass") };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            var result = _service.LoginWithPassword(user, "wrongpass");

            result.Should().BeNull();
        }

        [Fact]
        public async Task PermanentlyDeleteUserAsync_ShouldRemoveUser()
        {
            var user = new User { Email = "del@example.com", Username = "deluser", EncryptedPassword = "p" };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            await _service.PermanentlyDeleteUserAsync(user.Id);

            var found = await _db.Users.FindAsync(user.Id);
            found.Should().BeNull();
        }

        [Fact]
        public async Task ConfirmEmailAsync_WithValidToken_ShouldVerifyUser()
        {
            // Arrange
            var user = new User
            {
                Email = "verify@example.com",
                Username = "example" + Random.Shared.Next(1, 10000).ToString(),
                ConfirmationToken = "valid-token",
                ConfirmationTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(1),
                EmailConfirmedAt = null,
                EncryptedPassword = "p"
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ConfirmEmailAsync("verify@example.com", "valid-token");

            // Assert
            result.Should().BeTrue();

            var dbUser = await _db.Users.FindAsync(user.Id);
            dbUser.EmailConfirmedAt.Should().NotBeNull(); // Should be verified
            dbUser.ConfirmationToken.Should().BeNull();   // Token should be wiped
        }

        [Fact]
        public async Task ConfirmEmailAsync_WithInvalidToken_ShouldReturnFalse()
        {
            // Arrange
            var user = new User
            {
                Email = "wrongtoken@example.com",
                Username = "example" + Random.Shared.Next(1, 10000).ToString(),
                ConfirmationToken = "real-token",
                ConfirmationTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(1),
                EncryptedPassword = "p"
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ConfirmEmailAsync("wrongtoken@example.com", "bad-input-token");

            // Assert
            result.Should().BeFalse();
            var dbUser = await _db.Users.FindAsync(user.Id);
            dbUser.EmailConfirmedAt.Should().BeNull(); // Should NOT be verified
        }

        [Fact]
        public async Task ConfirmEmailAsync_WithExpiredToken_ShouldReturnFalse()
        {
            // Arrange
            var user = new User
            {
                Email = "expired@example.com",
                Username = "example" + Random.Shared.Next(1, 10000).ToString(),
                ConfirmationToken = "old-token",
                // Set expiration to the past
                ConfirmationTokenExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-10),
                EncryptedPassword = "p"
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ConfirmEmailAsync("expired@example.com", "old-token");

            // Assert
            result.Should().BeFalse();
            var dbUser = await _db.Users.FindAsync(user.Id);
            dbUser.EmailConfirmedAt.Should().BeNull();
        }


        // ==========================================
        // NEW TESTS: ResendConfirmationEmailAsync
        // ==========================================

        [Fact]
        public async Task ResendEmail_ValidRequest_ShouldUpdateToken_AndSendEmail()
        {
            // Arrange
            var user = new User
            {
                Email = "resend@example.com",
                Username = "ResendUser",
                ConfirmationToken = "old-token",
                EncryptedPassword = "p",
                EmailConfirmedAt = null
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ResendConfirmationEmailAsync("resend@example.com");

            // Assert
            result.Should().NotBeNull();
            result.ConfirmationToken.Should().NotBe("old-token"); // Must rotate token

            // Verify Email was "sent"
            _emailService.WelcomeEmailSent.Should().BeTrue();
            _emailService.LastLink.Should().Contain(result.ConfirmationToken);
        }

        [Fact]
        public async Task ResendEmail_UserAlreadyVerified_ShouldNotChangeToken_OrSendEmail()
        {
            // Arrange
            var user = new User
            {
                Email = "verified@example.com",
                Username = "example" + Random.Shared.Next(1, 10000).ToString(),
                EmailConfirmedAt = DateTimeOffset.UtcNow, // Verified!
                ConfirmationToken = "constant-token",
                EncryptedPassword = "p"
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ResendConfirmationEmailAsync("verified@example.com");

            // Assert
            result.Should().NotBeNull(); // Returns user
            result.ConfirmationToken.Should().Be("constant-token"); // Token unchanged
            _emailService.WelcomeEmailSent.Should().BeFalse(); // No email sent
        }

        [Fact]
        public async Task ResendEmail_DuringCooldown_ShouldBlock()
        {
            // Arrange
            var user = new User
            {
                Email = "spam@example.com",
                Username = "example" + Random.Shared.Next(1, 10000).ToString(),
                // Sent one 1 minute ago (Cooldown is 5 mins)
                ConfirmationEmailSentAt = DateTimeOffset.UtcNow.AddMinutes(-1),
                ConfirmationToken = "keep-this-token",
                EncryptedPassword = "p"
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ResendConfirmationEmailAsync("spam@example.com");

            // Assert
            result.Should().NotBeNull();
            result.ConfirmationToken.Should().Be("keep-this-token"); // Should NOT change
            _emailService.WelcomeEmailSent.Should().BeFalse(); // Should NOT send email
        }

        [Fact]
        public async Task ResendEmail_AfterCooldown_ShouldSend()
        {
            // Arrange
            var user = new User
            {
                Email = "patient@example.com",
                Username = "example" + Random.Shared.Next(1, 10000).ToString(),
                // Sent 10 minutes ago (Cooldown expired)
                ConfirmationEmailSentAt = DateTimeOffset.UtcNow.AddMinutes(-10),
                ConfirmationToken = "old-token",
                EncryptedPassword = "p"
            };
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.ResendConfirmationEmailAsync("patient@example.com");

            // Assert
            result.ConfirmationToken.Should().NotBe("old-token"); // Changed!
            _emailService.WelcomeEmailSent.Should().BeTrue(); // Sent!
        }


        // ==========================================
        // HELPER CLASSES 
        // ==========================================

        // Simple fake hasher used for tests
        private class FakePasswordHasher : IPasswordHasher
        {
            public string HashPassword(string password)
            {
                return "HASHED:" + password;
            }

            public bool VerifyPassword(string password, string hashedPassword)
            {
                // In UserService the code takes the unhashed provided password and then calls VerifyPassword(hashedPassword, user.EncryptedPassword)
                // So 'password' here will be the unhashed input from the service, which is then hashed and compared to the stored hash..
                var hasher = new FakePasswordHasher();
                return hasher.HashPassword(password) == hashedPassword;
            }
        }

        // Dummy implementation. The unit tests do not test 
        // this interface.
        private class DummyListingCommandService : IListingCommandService
        {
            public async Task<Guid> CreateListingAsync(CreateListingRequestDto request, CancellationToken cancellationToken = default)
            {
                var _ = request;
                var __ = cancellationToken;
                return Guid.NewGuid();
            }

            public async Task DeleteListingAsync(Guid listingId, Guid profileId, CancellationToken cancellationToken = default)
            {
                var _ = listingId;
                var __ = profileId;
                var ___ = cancellationToken;
                return;
            }

            public async Task DeleteAllFromUserAsync(Guid targetId)
            {
                var _ = targetId;
                return;
            }
        }

        // ditto, for profiles
        private class DummyProfileService : IProfileService
        {
            public async Task<ProfileResponseDto?> GetProfileByIdAsync(Guid profileId)
            {
                var _ = profileId;
                return null;
            }

            public async Task<ProfileResponseDto?> GetProfileByUserIdAsync(Guid userId)
            {
                var _ = userId;
                return null;
            }

            public async Task<ProfileResponseDto> CreateProfileAsync(Guid userId, CreateProfileDto dto)
            {
                var _ = userId;
                var __ = dto;

                return null;
            }

            public async Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
            {
                var _ = userId;
                var __ = dto;

                return null;
            }

            public async Task<bool> DeleteProfileAsync(Guid userId)
            {
                var _ = userId;

                return false;
            }

            public void DeleteProfile(Guid userId)
            {
                var _ = userId;
            }

            public async Task<bool> ProfileExistsAsync(Guid userId)
            {
                var _ = userId;

                return false;
            }
        }

        private class DummyChatroomService : IChatroomService
        {
            public async Task<ChatroomDto?> GetChatroomByIdAsync(Guid chatroomId)
            {
                var _ = chatroomId;

                return null;
            }

            public async Task<List<ChatroomDto>> GetUserChatroomsAsync(Guid userId)
            {
                var _ = userId;

                return null;
            }

            public async Task<ChatroomDto> CreateChatroomAsync(CreateChatroomDto dto)
            {
                var _ = dto;

                return null;
            }

            public async Task<ChatroomDto?> GetOrCreateChatroomAsync(Guid sellerId, Guid buyerId, Guid? listingId = null)
            {
                var _ = sellerId;
                var __ = buyerId;

                return null;
            }

            public async Task<ChatroomDto> CloseDealAsync(Guid chatroomId, Guid sellerId, int? stars = null, string? description = null)
            {
                var _ = chatroomId;
                var __ = sellerId;

                return null;
            }

            public async Task<ChatroomDto> RequestCloseDealAsync(Guid chatroomId, Guid userId)
            {
                var _ = chatroomId;
                var __ = userId;

                return null;
            }

            public async Task<ChatroomDto> RespondToCloseDealAsync(Guid chatroomId, Guid userId, bool accept)
            {
                var _ = chatroomId;
                var __ = userId;
                var ___ = accept;

                return null;
            }

            public async Task<List<ChatroomDto>> GetChatroomsByListingAsync(Guid listingId)
            {
                var _ = listingId;

                return null;
            }

            public async Task<ChatroomDto> SubmitRatingAsync(Guid chatroomId, Guid reviewerId, int stars, string? description = null)
            {
                var _ = chatroomId;
                var __ = reviewerId;
                var ___ = stars;

                return null;
            }

            public async Task<bool> UserBelongsToChatroomAsync(Guid userId, Guid chatroomId)
            {
                var _ = userId;
                var __ = chatroomId;

                return false;
            }

            public async Task DeleteChatroomAsync(Guid chatroomId)
            {
                var _ = chatroomId;

                return;
            }

            public void DeleteAllFromUser(Guid targetId)
            {
                var _ = targetId;

                return;
            }
        }
    }
    // fake email for unit tests
    class SpyEmailService : IEmailService
    {
        // Public fields so our tests can check them
        public bool WelcomeEmailSent = false;
        public string LastLink = "";
        public string LastTo = "";

        // 1. Generic Sender (Not used in these tests)
        public Task SendEmailAsync(string to, string subject, string body)
        {
            return Task.CompletedTask;
        }

        // 2. The Method We Are Testing
        public Task SendWelcomeEmailAsync(string to, string name, string link)
        {
            WelcomeEmailSent = true;
            LastLink = link;
            LastTo = to;
            return Task.CompletedTask;
        }

        // 3. Password Reset
        public Task SendPasswordResetEmailAsync(string toEmail, string firstName, string resetLink)
        {
            return Task.CompletedTask;
        }
    }
}