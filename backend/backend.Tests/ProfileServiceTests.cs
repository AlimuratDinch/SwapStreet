using System;
using System.Threading.Tasks;
using backend.DbContexts;
using backend.Services;
using backend.DTOs.Profile;
using Microsoft.EntityFrameworkCore;
using Xunit;
using AwesomeAssertions;

namespace backend.Tests
{
    public class ProfileServiceTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly ProfileService _service;
        private readonly Guid _testUserId;
        private readonly int _testCityId;
        private readonly int _testProvinceId;

        public ProfileServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);
            _service = new ProfileService(_db);

            _testUserId = Guid.NewGuid();
            _testProvinceId = 1;
            _testCityId = 1;

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            // Add test province
            var province = new Province
            {
                Id = _testProvinceId,
                Name = "Ontario",
                Code = "ON"
            };
            _db.Provinces.Add(province);

            // Add test city
            var city = new City
            {
                Id = _testCityId,
                Name = "Toronto",
                ProvinceId = _testProvinceId
            };
            _db.Cities.Add(city);

            _db.SaveChanges();
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task CreateProfileAsync_ShouldCreateProfileSuccessfully()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "John",
                LastName = "Doe",
                Bio = "Test bio",
                CityId = _testCityId,
                FSA = "m5v",
                ProfileImagePath = "/images/profile.jpg",
                BannerImagePath = "/images/banner.jpg"
            };

            // Act
            var result = await _service.CreateProfileAsync(_testUserId, dto);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(_testUserId);
            result.FirstName.Should().Be("John");
            result.LastName.Should().Be("Doe");
            result.Bio.Should().Be("Test bio");
            result.CityId.Should().Be(_testCityId);
            result.FSA.Should().Be("M5V"); // Should be uppercased
            result.ProfileImagePath.Should().Be("/images/profile.jpg");
            result.BannerImagePath.Should().Be("/images/banner.jpg");
            result.Status.Should().Be("Offline");
            result.VerifiedSeller.Should().BeFalse();
            result.Rating.Should().Be(0.0f);
            result.CityName.Should().Be("Toronto");
            result.ProvinceName.Should().Be("Ontario");
            result.ProvinceCode.Should().Be("ON");
        }

        [Fact]
        public async Task CreateProfileAsync_ShouldThrowException_WhenProfileAlreadyExists()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "John",
                LastName = "Doe",
                CityId = _testCityId,
                FSA = "M5V"
            };

            await _service.CreateProfileAsync(_testUserId, dto);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateProfileAsync(_testUserId, dto)
            );

            exception.Message.Should().Be("Profile already exists for this user");
        }

        [Fact]
        public async Task CreateProfileAsync_ShouldThrowException_WhenCityDoesNotExist()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "John",
                LastName = "Doe",
                CityId = 9999, // Non-existent city
                FSA = "M5V"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateProfileAsync(_testUserId, dto)
            );

            exception.Message.Should().Be("Invalid CityId: City does not exist");
        }

        [Fact]
        public async Task GetProfileByIdAsync_ShouldReturnProfile_WhenExists()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "Jane",
                LastName = "Smith",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, dto);

            // Act
            var result = await _service.GetProfileByIdAsync(_testUserId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(_testUserId);
            result.FirstName.Should().Be("Jane");
            result.LastName.Should().Be("Smith");
        }

        [Fact]
        public async Task GetProfileByIdAsync_ShouldReturnNull_WhenNotExists()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var result = await _service.GetProfileByIdAsync(nonExistentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetProfileByUserIdAsync_ShouldReturnProfile_WhenExists()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "Bob",
                LastName = "Johnson",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, dto);

            // Act
            var result = await _service.GetProfileByUserIdAsync(_testUserId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(_testUserId);
            result.FirstName.Should().Be("Bob");
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldUpdateAllFields_WhenProvided()
        {
            // Arrange
            var createDto = new CreateProfileDto
            {
                FirstName = "Original",
                LastName = "Name",
                Bio = "Original bio",
                CityId = _testCityId,
                FSA = "M5V",
                ProfileImagePath = "/old/profile.jpg",
                BannerImagePath = "/old/banner.jpg"
            };
            await _service.CreateProfileAsync(_testUserId, createDto);

            var updateDto = new UpdateProfileDto
            {
                FirstName = "Updated",
                LastName = "Person",
                Bio = "Updated bio",
                CityId = _testCityId,
                FSA = "K1A",
                ProfileImagePath = "/new/profile.jpg",
                BannerImagePath = "/new/banner.jpg",
                Status = ProfileStatusEnum.Online
            };

            // Act
            var result = await _service.UpdateProfileAsync(_testUserId, updateDto);

            // Assert
            result.Should().NotBeNull();
            result.FirstName.Should().Be("Updated");
            result.LastName.Should().Be("Person");
            result.Bio.Should().Be("Updated bio");
            result.FSA.Should().Be("K1A");
            result.ProfileImagePath.Should().Be("/new/profile.jpg");
            result.BannerImagePath.Should().Be("/new/banner.jpg");
            result.Status.Should().Be("Online");
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldUpdateOnlyProvidedFields()
        {
            // Arrange
            var createDto = new CreateProfileDto
            {
                FirstName = "Original",
                LastName = "Name",
                Bio = "Original bio",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, createDto);

            var updateDto = new UpdateProfileDto
            {
                FirstName = "Updated"
                // Only updating first name
            };

            // Act
            var result = await _service.UpdateProfileAsync(_testUserId, updateDto);

            // Assert
            result.FirstName.Should().Be("Updated");
            result.LastName.Should().Be("Name"); // Should remain unchanged
            result.Bio.Should().Be("Original bio"); // Should remain unchanged
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldThrowException_WhenProfileNotFound()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            var updateDto = new UpdateProfileDto
            {
                FirstName = "Test"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateProfileAsync(nonExistentId, updateDto)
            );

            exception.Message.Should().Be("Profile not found");
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldThrowException_WhenCityDoesNotExist()
        {
            // Arrange
            var createDto = new CreateProfileDto
            {
                FirstName = "Test",
                LastName = "User",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, createDto);

            var updateDto = new UpdateProfileDto
            {
                CityId = 9999 // Non-existent city
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.UpdateProfileAsync(_testUserId, updateDto)
            );

            exception.Message.Should().Be("Invalid CityId: City does not exist");
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldUppercaseFSA()
        {
            // Arrange
            var createDto = new CreateProfileDto
            {
                FirstName = "Test",
                LastName = "User",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, createDto);

            var updateDto = new UpdateProfileDto
            {
                FSA = "k1a" // Lowercase
            };

            // Act
            var result = await _service.UpdateProfileAsync(_testUserId, updateDto);

            // Assert
            result.FSA.Should().Be("K1A"); // Should be uppercased
        }

        [Fact]
        public async Task DeleteProfileAsync_ShouldReturnTrue_WhenProfileExists()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "Delete",
                LastName = "Me",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, dto);

            // Act
            var result = await _service.DeleteProfileAsync(_testUserId);

            // Assert
            result.Should().BeTrue();

            // Verify profile is deleted
            var profile = await _service.GetProfileByIdAsync(_testUserId);
            profile.Should().BeNull();
        }

        [Fact]
        public async Task DeleteProfileAsync_ShouldReturnFalse_WhenProfileNotExists()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var result = await _service.DeleteProfileAsync(nonExistentId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task ProfileExistsAsync_ShouldReturnTrue_WhenProfileExists()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "Exists",
                LastName = "Test",
                CityId = _testCityId,
                FSA = "M5V"
            };
            await _service.CreateProfileAsync(_testUserId, dto);

            // Act
            var result = await _service.ProfileExistsAsync(_testUserId);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task ProfileExistsAsync_ShouldReturnFalse_WhenProfileNotExists()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var result = await _service.ProfileExistsAsync(nonExistentId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task CreateProfileAsync_ShouldSetDefaultValues()
        {
            // Arrange
            var dto = new CreateProfileDto
            {
                FirstName = "Default",
                LastName = "Values",
                CityId = _testCityId,
                FSA = "M5V"
            };

            // Act
            var result = await _service.CreateProfileAsync(_testUserId, dto);

            // Assert
            result.Status.Should().Be("Offline");
            result.VerifiedSeller.Should().BeFalse();
            result.Rating.Should().Be(0.0f);
            result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
            result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldUpdateTimestamp()
        {
            // Arrange
            var createDto = new CreateProfileDto
            {
                FirstName = "Timestamp",
                LastName = "Test",
                CityId = _testCityId,
                FSA = "M5V"
            };
            var created = await _service.CreateProfileAsync(_testUserId, createDto);
            var originalUpdatedAt = created.UpdatedAt;

            // Wait a bit to ensure timestamp difference
            await Task.Delay(100);

            var updateDto = new UpdateProfileDto
            {
                FirstName = "Updated"
            };

            // Act
            var result = await _service.UpdateProfileAsync(_testUserId, updateDto);

            // Assert
            result.UpdatedAt.Should().BeAfter(originalUpdatedAt);
        }
    }
}
