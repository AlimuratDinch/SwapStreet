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

namespace backend.Tests.Services
{
    public class MinioFileStorageServiceTests
    {
        private readonly MinioFileStorageService _service;
        private readonly Mock<IMinioClient> _minioMock;
        private readonly MinioSettings _settings;

        public MinioFileStorageServiceTests()
        {
            _minioMock = new Mock<IMinioClient>();

            _settings = new MinioSettings
            {
                PublicBucketName = "public",
                PrivateBucketName = "private"
            };

            var options = Options.Create(_settings);

            _service = new MinioFileStorageService(_minioMock.Object, options);

            // Mock PutObjectAsync to return Task<PutObjectResponse>
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
            var file = CreateFakeFile();

            var url = await _service.UploadFileAsync(file, UploadType.Listing);

            url.Should().StartWith("http://localhost:9000/public/");
        }

        [Fact]
        public async Task UploadFileAsync_PrivateTryOn_ShouldReturnPresignedUrl()
        {
            var file = CreateFakeFile();

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/tryon/test.jpg");

            var url = await _service.UploadFileAsync(file, UploadType.TryOn);

            url.Should().StartWith("http://localhost:9000/private/tryon/");
            url.Should().Contain("test.jpg");
        }

        [Fact]
        public async Task UploadFileAsync_InvalidFileType_ShouldThrowArgumentException()
        {
            var file = CreateFakeFile(contentType: "text/plain");

            Func<Task> act = async () => await _service.UploadFileAsync(file, UploadType.Listing);

            await act.Should().ThrowAsync<ArgumentException>()
                     .WithMessage("Invalid file type*");
        }

        [Fact]
        public async Task GetPrivateFileUrlAsync_ShouldReplaceMinioHostWithLocalhost()
        {
            string objectName = "tryon/test.jpg";

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/tryon/test.jpg");

            var url = await _service.GetPrivateFileUrlAsync(objectName);

            url.Should().StartWith("http://localhost:9000/private/tryon/");
            url.Should().Contain(objectName);
        }

        [Fact]
        public async Task UploadFileAsync_GeneratedFile_ShouldUsePrivateBucket()
        {
            var file = CreateFakeFile();

            _minioMock
                .Setup(m => m.PresignedGetObjectAsync(It.IsAny<PresignedGetObjectArgs>()))
                .ReturnsAsync("http://minio:9000/private/generated/test.jpg");

            var url = await _service.UploadFileAsync(file, UploadType.Generated);

            url.Should().StartWith("http://localhost:9000/private/generated/");
        }
    }
}
