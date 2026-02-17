using System;
using System.IO;
using System.Threading.Tasks;
using backend.DTOs.Image;
using backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.DataModel.Response;
using Moq;
using Xunit;
using AwesomeAssertions;
using backend.Models;
using System.Collections.Generic;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using backend.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using System.Threading;
using backend.Tests.Fixtures;
using System.Linq;
using NetTopologySuite.Geometries;

namespace backend.Tests.Services
{
    [CollectionDefinition(nameof(PostgresCollectionForMinioService))]
    public class PostgresCollectionForMinioService : ICollectionFixture<PostgresFixture> { }

    [Collection(nameof(PostgresCollectionForMinioService))]
    public class MinioFileStorageServiceTests
    {
        private readonly PostgresFixture _fixture;
        private readonly Mock<IMinioClient> _minioMock;
        private readonly MinioSettings _settings;
        private readonly IConfiguration _config;

        public MinioFileStorageServiceTests(PostgresFixture fixture)
        {
            _fixture = fixture;
            _minioMock = new Mock<IMinioClient>();

            _settings = new MinioSettings
            {
                PublicBucketName = "public",
                PrivateBucketName = "private"
            };

            var myConfiguration = new Dictionary<string, string>
            {
                {"FRONTEND_URL", "http://localhost:9000"},
            };

            _config = new ConfigurationBuilder()
                .AddInMemoryCollection(myConfiguration)
                .Build();

            // Mock PutObjectAsync to return successful response
            _minioMock
                .Setup(m => m.PutObjectAsync(It.IsAny<PutObjectArgs>(), default))
                .ReturnsAsync(new PutObjectResponse(
                    System.Net.HttpStatusCode.OK,
                    "dummy-bucket",
                    new Dictionary<string, string>(),
                    123,
                    "dummy-etag"
                ));
        }

        private MinioFileStorageService CreateService()
        {
            var context = new AppDbContext(_fixture.DbOptions);
            var optionsWrapper = Options.Create(_settings);
            return new MinioFileStorageService(_minioMock.Object, optionsWrapper, context, _config, NullLogger<MinioFileStorageService>.Instance);
        }

        private async Task CleanupDatabaseAsync()
        {
            using var context = new AppDbContext(_fixture.DbOptions);
            // Remove child records first to avoid FK constraint violations
            context.ListingImages.RemoveRange(context.ListingImages);
            context.TryOnImages.RemoveRange(context.TryOnImages);
            context.GeneratedImages.RemoveRange(context.GeneratedImages);
            context.Listings.RemoveRange(context.Listings);
            await context.SaveChangesAsync();
        }

        private async Task SeedMinimalTestDataAsync(Guid profileId)
        {
            using var context = new AppDbContext(_fixture.DbOptions);

            // Check if profile already exists
            if (!await context.Profiles.AnyAsync(p => p.Id == profileId))
            {
                // Seed Province if it doesn't exist
                if (!await context.Provinces.AnyAsync(p => p.Id == 1))
                {
                    context.Provinces.Add(new Province { Id = 1, Name = "Test Province", Code = "TP" });
                    await context.SaveChangesAsync();
                }

                // Seed City if it doesn't exist
                if (!await context.Cities.AnyAsync(c => c.Id == 1))
                {
                    context.Cities.Add(new City { Id = 1, Name = "Test City", ProvinceId = 1, Latitude = 45.5f, Longitude = -73.5f });
                    await context.SaveChangesAsync();
                }

                // Seed FSA if it doesn't exist
                if (!await context.Fsas.AnyAsync(f => f.Code == "H2X"))
                {
                    context.Fsas.Add(new Fsa { Code = "H2X", CityId = 1, Centroid = new NetTopologySuite.Geometries.Point(-73.5, 45.5) });
                    await context.SaveChangesAsync();
                }

                // Seed Profile
                context.Profiles.Add(new Profile
                {
                    Id = profileId,
                    Status = ProfileStatusEnum.Online,
                    FirstName = "Test",
                    LastName = "User",
                    CityId = 1,
                    FSA = "H2X",
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }

        // Creates a valid in-memory JPEG image for tests
        private IFormFile CreateFakeFile(string fileName = "test.jpg", string contentType = "image/jpeg")
        {
            var ms = new MemoryStream();
            using (var image = new Image<Rgba32>(10, 10)) // 10x10 px blank image
            {
                image.SaveAsJpeg(ms);
            }
            ms.Position = 0;

            return new FormFile(ms, 0, ms.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }

        [Fact]
        public async Task UploadFileAsync_PublicFile_ShouldReturnPublicUrl()
        {
            // Arrange
            await CleanupDatabaseAsync();
            var service = CreateService();
            var file = CreateFakeFile();
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();

            await SeedMinimalTestDataAsync(userId);

            // Create listing to satisfy FK constraint
            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                context.Listings.Add(new Listing
                {
                    Id = listingId,
                    Title = "Test Listing",
                    Description = "Test Description",
                    Price = 10.00m,
                    ProfileId = userId,
                    FSA = "H2X",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            // Act
            // Pass required userId and listingId
            var url = await service.UploadFileAsync(file, UploadType.Listing, userId, listingId);

            // Assert
            url.Should().StartWith("http://localhost");

            // Verify DB record was created
            using var verifyContext = new AppDbContext(_fixture.DbOptions);
            var dbRecord = await verifyContext.ListingImages.FirstOrDefaultAsync();
            dbRecord.Should().NotBeNull();
            dbRecord.ListingId.Should().Be(listingId);
        }

        [Fact]
        public async Task UploadFileAsync_PrivateTryOn_ShouldReturnPresignedUrl()
        {
            // Arrange
            await CleanupDatabaseAsync();
            var service = CreateService();
            var file = CreateFakeFile();
            var userId = Guid.NewGuid();

            await SeedMinimalTestDataAsync(userId);

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/tryon/test.jpg");

            // Act
            // TryOn generally doesn't require a ListingId, but needs a UserId
            var url = await service.UploadFileAsync(file, UploadType.TryOn, userId);

            // Assert
            url.Should().StartWith("http://localhost/private/tryon/");
            url.Should().Contain("test.jpg");

            // Verify DB record was created
            using var verifyContext = new AppDbContext(_fixture.DbOptions);
            var dbRecord = await verifyContext.TryOnImages.FirstOrDefaultAsync();
            dbRecord.Should().NotBeNull();
            dbRecord.ProfileId.Should().Be(userId);
        }

        [Fact]
        public async Task UploadFileAsync_InvalidFileType_ShouldThrowArgumentException()
        {
            // Arrange
            await CleanupDatabaseAsync();
            var service = CreateService();
            var file = CreateFakeFile(contentType: "text/plain");
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();

            await SeedMinimalTestDataAsync(userId);

            // Create listing to satisfy FK constraint (even though the test will fail validation)
            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                context.Listings.Add(new Listing
                {
                    Id = listingId,
                    Title = "Test Listing",
                    Description = "Test Description",
                    Price = 10.00m,
                    ProfileId = userId,
                    FSA = "H2X",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            // Act
            Func<Task> act = async () => await service.UploadFileAsync(file, UploadType.Listing, userId, listingId);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                     .WithMessage("Invalid file type*");
        }

        [Fact]
        public async Task GetPrivateFileUrlAsync_ShouldReplaceMinioHostWithLocalhost()
        {
            // Arrange
            var service = CreateService();
            string objectName = "tryon/test.jpg";

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/tryon/test.jpg");

            // Act
            var url = await service.GetPrivateFileUrlAsync(objectName);

            // Assert
            url.Should().StartWith("http://localhost/private/tryon/");
            url.Should().Contain(objectName);
        }

        [Fact]
        public async Task UploadFileAsync_GeneratedFile_ShouldUsePrivateBucket()
        {
            // Arrange
            await CleanupDatabaseAsync();
            var service = CreateService();
            var file = CreateFakeFile();
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();

            await SeedMinimalTestDataAsync(userId);

            // Create listing to satisfy FK constraint
            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                context.Listings.Add(new Listing
                {
                    Id = listingId,
                    Title = "Test Listing",
                    Description = "Test Description",
                    Price = 10.00m,
                    ProfileId = userId,
                    FSA = "H2X",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/generated/test.jpg");

            // Act
            // Generated type requires ListingId
            var url = await service.UploadFileAsync(file, UploadType.Generated, userId, listingId);

            // Assert
            url.Should().StartWith("http://localhost/private/generated/");

            // Verify DB record
            using var verifyContext = new AppDbContext(_fixture.DbOptions);
            var dbRecord = await verifyContext.GeneratedImages.FirstOrDefaultAsync();
            dbRecord.Should().NotBeNull();
            dbRecord.ListingId.Should().Be(listingId);
        }

        [Fact]
        public async Task DeleteImagesAsync_Listing_RemovesDbRowsAndDeletesObjects()
        {
            // Arrange
            await CleanupDatabaseAsync();
            var service = CreateService();
            var listingId = Guid.NewGuid();
            var profileId = Guid.NewGuid();

            await SeedMinimalTestDataAsync(profileId);

            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                // Create listing first to satisfy FK constraint
                context.Listings.Add(new Listing
                {
                    Id = listingId,
                    Title = "Test Listing",
                    Description = "Test Description",
                    Price = 10.00m,
                    ProfileId = profileId,
                    FSA = "H2X",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                context.ListingImages.AddRange(
                    new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/one.jpg" },
                    new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/two.jpg" });
                await context.SaveChangesAsync();
            }

            _minioMock
                .Setup(m => m.RemoveObjectAsync(It.IsAny<RemoveObjectArgs>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await service.DeleteImagesAsync(UploadType.Listing, listingId: listingId, profileId: profileId);

            // Assert
            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                var remaining = await context.ListingImages
                    .Where(li => li.ListingId == listingId)
                    .ToListAsync();
                remaining.Should().BeEmpty();
            }

            _minioMock.Verify(
                m => m.RemoveObjectAsync(It.IsAny<RemoveObjectArgs>(), It.IsAny<CancellationToken>()),
                Times.Exactly(2));
        }

        [Fact]
        public async Task DeleteImagesAsync_WhenMinioDeleteFails_StillRemovesDbRows()
        {
            // Arrange
            await CleanupDatabaseAsync();
            var service = CreateService();
            var listingId = Guid.NewGuid();
            var profileId = Guid.NewGuid();

            await SeedMinimalTestDataAsync(profileId);

            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                // Create listing first to satisfy FK constraint
                context.Listings.Add(new Listing
                {
                    Id = listingId,
                    Title = "Test Listing",
                    Description = "Test Description",
                    Price = 10.00m,
                    ProfileId = profileId,
                    FSA = "H2X",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                context.ListingImages.Add(
                    new ListingImage { Id = Guid.NewGuid(), ListingId = listingId, ImagePath = "listing/fail.jpg" });
                await context.SaveChangesAsync();
            }

            _minioMock
                .Setup(m => m.RemoveObjectAsync(It.IsAny<RemoveObjectArgs>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("MinIO failure"));

            // Act
            Func<Task> act = async () => await service.DeleteImagesAsync(
                UploadType.Listing,
                listingId: listingId,
                profileId: profileId);

            // Assert
            await act.Should().NotThrowAsync();

            using (var context = new AppDbContext(_fixture.DbOptions))
            {
                var remaining = await context.ListingImages
                    .Where(li => li.ListingId == listingId)
                    .ToListAsync();
                remaining.Should().BeEmpty();
            }
        }
    }
}