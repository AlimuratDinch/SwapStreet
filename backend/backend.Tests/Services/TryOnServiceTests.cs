using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend.Contracts;
using backend.Contracts.Auth;
using backend.DbContexts;
using backend.Models;
using backend.Services.VirtualTryOn;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel;
using Minio.DataModel.Args;
using Minio.DataModel.Response;
using Moq;
using Xunit;
using AwesomeAssertions;

namespace backend.Tests.Services
{
    public class TryOnServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<ITokenService> _mockTokenService;
        private readonly Mock<IGenerativeService> _mockGeminiService;
        private readonly Mock<ILogger<TryOnService>> _mockLogger;
        private readonly Mock<IMinioClient> _mockMinioClient;
        private readonly TryOnService _service;
        private readonly MinioSettings _minioSettings;

        public TryOnServiceTests()
        {
            var options = new DbContextOptionsBuilder<TestAppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TestAppDbContext(options);
            _mockTokenService = new Mock<ITokenService>();
            _mockGeminiService = new Mock<IGenerativeService>();
            _mockLogger = new Mock<ILogger<TryOnService>>();
            _mockMinioClient = new Mock<IMinioClient>();

            _minioSettings = new MinioSettings
            {
                PrivateBucketName = "private",
                PublicBucketName = "public"
            };

            var options2 = Options.Create(_minioSettings);

            _service = new TryOnService(
                _context,
                _mockTokenService.Object,
                _mockGeminiService.Object,
                _mockLogger.Object,
                _mockMinioClient.Object,
                options2);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        #region ProcessTryOnRequestAsync Tests

        [Fact]
        public async Task ProcessTryOnRequestAsync_WithValidInputs_ReturnsGeneratedImagePath()
        {
            // Arrange
            var profileId = Guid.NewGuid();
            var clothingImageUrl = "http://localhost:9000/private/clothing/shirt.png";
            var personalImagePath = "tryon/profile_image.png";

            var tryOnImage = new TryOnImage
            {
                Id = 1,
                ProfileId = profileId,
                ImagePath = personalImagePath,
                CreatedAt = DateTime.UtcNow
            };

            await _context.TryOnImages.AddAsync(tryOnImage);
            await _context.SaveChangesAsync();

            var personalImageBytes = new byte[] { 1, 2, 3, 4, 5 };
            var clothingImageBytes = new byte[] { 6, 7, 8, 9, 10 };
            var generatedImageBytes = new byte[] { 11, 12, 13, 14, 15 };

            SetupMinioMockForGetObject(personalImageBytes, clothingImageBytes);
            SetupMinioMockForPutObject();

            _mockGeminiService
                .Setup(g => g.GenerateImageAsync(personalImageBytes, clothingImageBytes))
                .ReturnsAsync(generatedImageBytes);

            // Act
            var result = await _service.ProcessTryOnRequestAsync(profileId, clothingImageUrl);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().StartWith("generated/");
            _mockGeminiService.Verify(g => g.GenerateImageAsync(personalImageBytes, clothingImageBytes), Times.Once);
            _mockMinioClient.Verify(m => m.PutObjectAsync(It.IsAny<PutObjectArgs>(), default), Times.Once);
        }

        [Fact]
        public async Task ProcessTryOnRequestAsync_PersonalImageNotFound_ThrowsFileNotFoundException()
        {
            // Arrange
            var profileId = Guid.NewGuid();
            var clothingImageUrl = "http://localhost:9000/private/clothing/shirt.png";

            // Act & Assert
            await Assert.ThrowsAsync<FileNotFoundException>(async () =>
                await _service.ProcessTryOnRequestAsync(profileId, clothingImageUrl));
        }

        [Fact]
        public async Task ProcessTryOnRequestAsync_SavesGeneratedImageToDatabase()
        {
            // Arrange
            var profileId = Guid.NewGuid();
            var clothingImageUrl = "http://localhost:9000/private/clothing/shirt.png";
            var personalImagePath = "tryon/profile_image.png";

            var tryOnImage = new TryOnImage
            {
                Id = 1,
                ProfileId = profileId,
                ImagePath = personalImagePath,
                CreatedAt = DateTime.UtcNow
            };

            await _context.TryOnImages.AddAsync(tryOnImage);
            await _context.SaveChangesAsync();

            var personalImageBytes = new byte[] { 1, 2, 3, 4, 5 };
            var clothingImageBytes = new byte[] { 6, 7, 8, 9, 10 };
            var generatedImageBytes = new byte[] { 11, 12, 13, 14, 15 };

            SetupMinioMockForGetObject(personalImageBytes, clothingImageBytes);
            SetupMinioMockForPutObject();

            _mockGeminiService
                .Setup(g => g.GenerateImageAsync(personalImageBytes, clothingImageBytes))
                .ReturnsAsync(generatedImageBytes);

            // Act
            var result = await _service.ProcessTryOnRequestAsync(profileId, clothingImageUrl);

            // Assert
            var savedImage = await _context.TryOnImages
                .Where(t => t.ImagePath == personalImagePath)
                .FirstOrDefaultAsync();

            savedImage.Should().NotBeNull();
            savedImage!.ProfileId.Should().Be(profileId);
        }

        [Fact]
        public async Task ProcessTryOnRequestAsync_CallsMinioGetObjectForPersonalImage()
        {
            // Arrange
            var profileId = Guid.NewGuid();
            var clothingImageUrl = "http://localhost:9000/private/clothing/shirt.png";
            var personalImagePath = "tryon/profile_image.png";

            var tryOnImage = new TryOnImage
            {
                Id = 1,
                ProfileId = profileId,
                ImagePath = personalImagePath,
                CreatedAt = DateTime.UtcNow
            };

            await _context.TryOnImages.AddAsync(tryOnImage);
            await _context.SaveChangesAsync();

            var personalImageBytes = new byte[] { 1, 2, 3, 4, 5 };
            var clothingImageBytes = new byte[] { 6, 7, 8, 9, 10 };
            var generatedImageBytes = new byte[] { 11, 12, 13, 14, 15 };

            SetupMinioMockForGetObject(personalImageBytes, clothingImageBytes);
            SetupMinioMockForPutObject();

            _mockGeminiService
                .Setup(g => g.GenerateImageAsync(personalImageBytes, clothingImageBytes))
                .ReturnsAsync(generatedImageBytes);

            // Act
            await _service.ProcessTryOnRequestAsync(profileId, clothingImageUrl);

            // Assert
            _mockMinioClient.Verify(
                m => m.GetObjectAsync(It.IsAny<GetObjectArgs>(), default),
                Times.AtLeast(2));
        }

        [Fact]
        public async Task ProcessTryOnRequestAsync_CallsGeminiServiceToGenerateImage()
        {
            // Arrange
            var profileId = Guid.NewGuid();
            var clothingImageUrl = "http://localhost:9000/private/clothing/shirt.png";
            var personalImagePath = "tryon/profile_image.png";

            var tryOnImage = new TryOnImage
            {
                Id = 1,
                ProfileId = profileId,
                ImagePath = personalImagePath,
                CreatedAt = DateTime.UtcNow
            };

            await _context.TryOnImages.AddAsync(tryOnImage);
            await _context.SaveChangesAsync();

            var personalImageBytes = new byte[] { 1, 2, 3, 4, 5 };
            var clothingImageBytes = new byte[] { 6, 7, 8, 9, 10 };
            var generatedImageBytes = new byte[] { 11, 12, 13, 14, 15 };

            SetupMinioMockForGetObject(personalImageBytes, clothingImageBytes);
            SetupMinioMockForPutObject();

            _mockGeminiService
                .Setup(g => g.GenerateImageAsync(personalImageBytes, clothingImageBytes))
                .ReturnsAsync(generatedImageBytes);

            // Act
            await _service.ProcessTryOnRequestAsync(profileId, clothingImageUrl);

            // Assert
            _mockGeminiService.Verify(
                g => g.GenerateImageAsync(personalImageBytes, clothingImageBytes),
                Times.Once);
        }


        [Fact]
        public async Task AddGeneratedImage_WithValidInputs_SavesToDatabase()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();
            var fileName = "generated/uuid123/image.png";

            // Act
            await _service.AddGeneratedImage(userId, listingId, fileName);

            // Assert
            var savedImage = await _context.GeneratedImages.FirstOrDefaultAsync();
            savedImage.Should().NotBeNull();
            savedImage!.UserId.Should().Be(userId);
            savedImage.ListingId.Should().Be(listingId);
            savedImage.ImagePath.Should().Be(fileName);
        }

        [Fact]
        public async Task AddGeneratedImage_CreatesUniqueId()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();
            var fileName = "generated/uuid123/image.png";

            // Act
            await _service.AddGeneratedImage(userId, listingId, fileName);

            // Assert
            var savedImage = await _context.GeneratedImages.FirstOrDefaultAsync();
            savedImage!.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public async Task AddGeneratedImage_SetsCreatedAtToCurrentTime()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var listingId = Guid.NewGuid();
            var fileName = "generated/uuid123/image.png";
            var beforeTime = DateTime.UtcNow;

            // Act
            await _service.AddGeneratedImage(userId, listingId, fileName);

            // Assert
            var savedImage = await _context.GeneratedImages.FirstOrDefaultAsync();
            savedImage!.CreatedAt.Should().BeOnOrAfter(beforeTime);
            savedImage.CreatedAt.Should().BeOnOrBefore(DateTime.UtcNow.AddSeconds(1));
        }

        [Fact]
        public async Task AddGeneratedImage_MultipleImages_SavesAll()
        {
            // Arrange
            var userId1 = Guid.NewGuid();
            var userId2 = Guid.NewGuid();
            var listingId = Guid.NewGuid();
            var fileName1 = "generated/uuid1/image.png";
            var fileName2 = "generated/uuid2/image.png";

            // Act
            await _service.AddGeneratedImage(userId1, listingId, fileName1);
            await _service.AddGeneratedImage(userId2, listingId, fileName2);

            // Assert
            var images = await _context.GeneratedImages.ToListAsync();
            images.Should().HaveCount(2);
            images.Any(i => i.UserId == userId1 && i.ImagePath == fileName1).Should().BeTrue();
            images.Any(i => i.UserId == userId2 && i.ImagePath == fileName2).Should().BeTrue();
        }


        private void SetupMinioMockForGetObject(params byte[][] imageBytesList)
        {
            int callCount = 0;
            _mockMinioClient
                .Setup(m => m.GetObjectAsync(It.IsAny<GetObjectArgs>(), It.IsAny<System.Threading.CancellationToken>()))
                .Returns<GetObjectArgs, System.Threading.CancellationToken>(async (args, ct) =>
                {
                    // Get the callback from the args object using reflection
                    var callbackProperty = typeof(GetObjectArgs)
                        .GetProperty("CallBack", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

                    var callback = callbackProperty?.GetValue(args) as Func<Stream, System.Threading.CancellationToken, Task>;

                    if (callback != null && callCount < imageBytesList.Length)
                    {
                        var imageBytes = imageBytesList[callCount];
                        callCount++;

                        var memoryStream = new MemoryStream(imageBytes);
                        try
                        {
                            await callback(memoryStream, ct);
                        }
                        finally
                        {
                            memoryStream.Dispose();
                        }
                    }

                    // Return ObjectStat using factory method
                    var headers = new Dictionary<string, string>
                    {
                        { "content-length", "0" },
                        { "etag", "test-etag" }
                    };
                    return ObjectStat.FromResponseHeaders("test-object", headers);
                });
        }

        private void SetupMinioMockForPutObject()
        {
            _mockMinioClient
                .Setup(m => m.PutObjectAsync(It.IsAny<PutObjectArgs>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new PutObjectResponse(
                    System.Net.HttpStatusCode.OK,
                    "test-bucket",
                    new Dictionary<string, string>(),
                    0,
                    "test-etag"));
        }

        #endregion
    }
}