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
using AwesomeAssertions; // Replaced AwesomeAssertions with standard FluentAssertions
using backend.Models;
using System.Collections.Generic;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using backend.DbContexts;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests.Services
{
    public class MinioFileStorageServiceTests
    {
        private readonly MinioFileStorageService _service;
        private readonly Mock<IMinioClient> _minioMock;
        private readonly MinioSettings _settings;
        private readonly AppDbContext _context; // Add Context for DB operations

        public MinioFileStorageServiceTests()
        {
            _minioMock = new Mock<IMinioClient>();

            _settings = new MinioSettings
            {
                PublicBucketName = "public",
                PrivateBucketName = "private"
            };

            var optionsWrapper = Options.Create(_settings);

            // --- 1. Setup In-Memory Database for testing ---
            var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique DB per test
                .Options;

            _context = new AppDbContext(dbOptions);

            // --- 2. Inject Context into Service ---
            _service = new MinioFileStorageService(_minioMock.Object, optionsWrapper, _context);

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
            var file = CreateFakeFile();
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();

            // Act
            // Pass required userId and listingId
            var url = await _service.UploadFileAsync(file, UploadType.Listing, userId, listingId);

            // Assert
            url.Should().StartWith("http://localhost:9000/public/");

            // Verify DB record was created
            var dbRecord = await _context.ListingImages.FirstOrDefaultAsync();
            dbRecord.Should().NotBeNull();
            dbRecord.ListingId.Should().Be(listingId);
        }

        [Fact]
        public async Task UploadFileAsync_PrivateTryOn_ShouldReturnPresignedUrl()
        {
            // Arrange
            var file = CreateFakeFile();
            var userId = Guid.NewGuid();

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/tryon/test.jpg");

            // Act
            // TryOn generally doesn't require a ListingId, but needs a UserId
            var url = await _service.UploadFileAsync(file, UploadType.TryOn, userId);

            // Assert
            url.Should().StartWith("http://localhost:9000/private/tryon/");
            url.Should().Contain("test.jpg");

            // Verify DB record was created
            var dbRecord = await _context.TryOnImages.FirstOrDefaultAsync();
            dbRecord.Should().NotBeNull();
            dbRecord.ProfileId.Should().Be(userId);
        }

        [Fact]
        public async Task UploadFileAsync_InvalidFileType_ShouldThrowArgumentException()
        {
            // Arrange
            var file = CreateFakeFile(contentType: "text/plain");
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();

            // Act
            Func<Task> act = async () => await _service.UploadFileAsync(file, UploadType.Listing, userId, listingId);

            // Assert
            await act.Should().ThrowAsync<ArgumentException>()
                     .WithMessage("Invalid file type*");
        }

        [Fact]
        public async Task GetPrivateFileUrlAsync_ShouldReplaceMinioHostWithLocalhost()
        {
            // Arrange
            string objectName = "tryon/test.jpg";

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/tryon/test.jpg");

            // Act
            var url = await _service.GetPrivateFileUrlAsync(objectName);

            // Assert
            url.Should().StartWith("http://localhost:9000/private/tryon/");
            url.Should().Contain(objectName);
        }

        [Fact]
        public async Task UploadFileAsync_GeneratedFile_ShouldUsePrivateBucket()
        {
            // Arrange
            var file = CreateFakeFile();
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/generated/test.jpg");

            // Act
            // Generated type requires ListingId
            var url = await _service.UploadFileAsync(file, UploadType.Generated, userId, listingId);

            // Assert
            url.Should().StartWith("http://localhost:9000/private/generated/");

            // Verify DB record
            var dbRecord = await _context.GeneratedImages.FirstOrDefaultAsync();
            dbRecord.Should().NotBeNull();
            dbRecord.ListingId.Should().Be(listingId);
        }
    }
}