using backend.Models;
using backend.Services;
using backend.DbContexts;
using Microsoft.EntityFrameworkCore;
using AwesomeAssertions;
using Xunit;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;

namespace backend.Tests.Services
{
    public class LocationServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly LocationService _service;

        public LocationServiceTests()
        {
            // 1. Setup In-Memory Database
            // We use a unique name for each test run to ensure isolation
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _service = new LocationService(_context);

            // 2. Seed Test Data
            SeedTestData();
        }

        // Cleanup after tests
        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private void SeedTestData()
        {
            var ontario = new Province { Id = 1, Name = "Ontario", Code = "ON" };
            var quebec = new Province { Id = 2, Name = "Quebec", Code = "QC" };

            var toronto = new City
            {
                Id = 1,
                Name = "Toronto",
                ProvinceId = 1,
                Province = ontario,
                Latitude = 43.7,
                Longitude = -79.3
            };

            var montreal = new City
            {
                Id = 2,
                Name = "Montreal",
                ProvinceId = 2,
                Province = quebec,
                Latitude = 45.5,
                Longitude = -73.5
            };

            // FSAs
            var fsa1 = new Fsa { Id = 1, Code = "M5V", CityId = 1 }; // Toronto
            var fsa2 = new Fsa { Id = 2, Code = "H2Y", CityId = 2 }; // Montreal

            _context.Provinces.AddRange(ontario, quebec);
            _context.Cities.AddRange(toronto, montreal);
            _context.Fsas.AddRange(fsa1, fsa2);
            _context.SaveChanges();
        }

        // ==========================================
        // TESTS
        // ==========================================

        [Fact]
        public async Task GetCityByFsaAsync_ShouldReturnCity_WhenFsaIsValid()
        {
            // Arrange
            string inputFsa = "M5V 2T6"; // Simulating messy user input

            // Act
            var result = await _service.GetCityByFsaAsync(inputFsa);

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be("Toronto");
            result.Province.Should().NotBeNull();
            result.Province!.Name.Should().Be("Ontario");
            result.Latitude.Should().Be(43.7);
        }

        [Fact]
        public async Task GetCityByFsaAsync_ShouldReturnNull_WhenFsaDoesNotExist()
        {
            // Arrange
            string inputFsa = "Z9Z"; // Invalid FSA

            // Act
            var result = await _service.GetCityByFsaAsync(inputFsa);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetCityByFsaAsync_ShouldReturnNull_WhenInputIsTooShort()
        {
            // Arrange
            string inputFsa = "M5";

            // Act
            var result = await _service.GetCityByFsaAsync(inputFsa);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetAllProvincesAsync_ShouldReturnAllProvinces_OrderedByName()
        {
            // Act
            var result = await _service.GetAllProvincesAsync();

            // Assert
            result.Should().HaveCount(2);
            result.First().Name.Should().Be("Ontario"); // "O" comes before "Q"
            result.Last().Name.Should().Be("Quebec");
        }

        [Fact]
        public async Task GetCitiesByProvinceIdAsync_ShouldReturnOnlyCitiesForThatProvince()
        {
            // Arrange
            int ontarioId = 1;

            // Act
            var result = await _service.GetCitiesByProvinceIdAsync(ontarioId);

            // Assert
            result.Should().HaveCount(1);
            result.First().Name.Should().Be("Toronto");
            result.First().ProvinceId.Should().Be(ontarioId);
        }

        [Fact]
        public async Task IsValidFsaAsync_ShouldReturnTrue_ForExistingFsa()
        {
            // Act
            var result = await _service.IsValidFsaAsync("H2Y");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task IsValidFsaAsync_ShouldReturnFalse_ForNonExistentFsa()
        {
            // Act
            var result = await _service.IsValidFsaAsync("XXX");

            // Assert
            result.Should().BeFalse();
        }
    }
}