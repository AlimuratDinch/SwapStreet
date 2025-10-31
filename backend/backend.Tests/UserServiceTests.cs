using System;
using System.Threading.Tasks;
using backend.DbContexts;
using backend.Models.Authentication;
using backend.Services.Auth;
using backend.Contracts.Auth;
using Microsoft.EntityFrameworkCore;
using Xunit;
using AwesomeAssertions;

namespace backend.Tests
{
    public class UserServiceTests : IDisposable
    {
        private readonly AuthDbContext _db;
        private readonly UserService _service;

        public UserServiceTests()
        {
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new AuthDbContext(options);

            // simple fake password hasher: hash = "HASHED:" + password
            var hasher = new FakePasswordHasher();

            _service = new UserService(hasher, _db);
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

            var result = await _service.LoginWithPasswordAsync(user, password);

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

            var result = await _service.LoginWithPasswordAsync(user, "wrongpass");

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

        // Simple fake hasher used for tests
        private class FakePasswordHasher : IPasswordHasher
        {
            public string HashPassword(string password)
            {
                return "HASHED:" + password;
            }

            public bool VerifyPassword(string password, string hashedPassword)
            {
                // In UserService the code hashes the provided password and then calls VerifyPassword(hashedPassword, user.EncryptedPassword)
                // So 'password' here will be the hashed input from the service.
                return password == hashedPassword;
            }
        }
    }
}
