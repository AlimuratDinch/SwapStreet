using Xunit;
using backend.Services.Auth;
using AwesomeAssertions;

namespace backend.Tests.Services.Auth
{
    public class BcryptPasswordHasherTests
    {
        private readonly BcryptPasswordHasher _sut;

        public BcryptPasswordHasherTests()
        {
            _sut = new BcryptPasswordHasher();
        }

        [Fact]
        public void HashPassword_ShouldReturnAHashedString()
        {
            // Arrange
            var password = "SuperSecret123!";

            // Act
            var hash = _sut.HashPassword(password);

            // Assert
            hash.Should().NotBeNull();
            hash.Should().NotBeEmpty();
            hash.Should().NotBe(password);
            (hash.StartsWith("$2a$") || hash.StartsWith("$2b$"))
                .Should().BeTrue("bcrypt hash prefix should be either $2a$ or $2b$");
        }


        [Fact]
        public void VerifyPassword_ShouldReturnTrue_WhenPasswordMatchesHash()
        {
            // Arrange
            var password = "MyPassword!";
            var hash = _sut.HashPassword(password);

            // Act
            var result = _sut.VerifyPassword(password, hash);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void VerifyPassword_ShouldReturnFalse_WhenPasswordDoesNotMatch()
        {
            // Arrange
            var password = "CorrectPassword";
            var wrongPassword = "IncorrectPassword";
            var hash = _sut.HashPassword(password);

            // Act
            var result = _sut.VerifyPassword(wrongPassword, hash);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HashPassword_ShouldGenerateDifferentHashes_ForSamePassword()
        {
            // Arrange
            var password = "RepeatablePassword";

            // Act
            var hash1 = _sut.HashPassword(password);
            var hash2 = _sut.HashPassword(password);

            // Assert
            hash1.Should().NotBe(hash2);
            _sut.VerifyPassword(password, hash1).Should().BeTrue();
            _sut.VerifyPassword(password, hash2).Should().BeTrue();
        }
    }
}
