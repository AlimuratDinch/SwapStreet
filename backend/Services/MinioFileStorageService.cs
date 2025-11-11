using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using Minio;
using Minio.DataModel.Args;
using backend.Contracts;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using backend.DTOs.Image;

namespace backend.Services
{
    public class MinioFileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minio;
        private readonly MinioSettings _settings;

        public MinioFileStorageService(IMinioClient minio, IOptions<MinioSettings> settings)
        {
            _minio = minio;
            _settings = settings.Value;
        }


        // Upload picture 
        public async Task<string> UploadFileAsync(IFormFile file, UploadType type)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty.", nameof(file));

            // ===== Constraints per type =====
            var (maxSize, maxWidth, maxHeight) = GetConstraints(type);

            if (file.Length > maxSize)
                throw new ArgumentException($"File is too large. Maximum allowed size for {type} is {maxSize / 1024 / 1024} MB.");

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType))
                throw new ArgumentException("Invalid file type. Only JPEG, PNG, or WebP allowed.");

            // ===== Check image dimensions =====
            using var image = Image.Load(file.OpenReadStream());
            if (image.Width > maxWidth || image.Height > maxHeight)
                throw new ArgumentException($"Image dimensions exceed maximum allowed for {type}: {maxWidth}x{maxHeight}.");

            // ===== Generate file name =====
            var fileName = $"{type.ToString().ToLower()}/{Guid.NewGuid()}_{file.FileName}";

            // ===== Determine bucket =====
            var bucket = type == UploadType.TryOn || type == UploadType.Generated ? _settings.PrivateBucketName : _settings.PublicBucketName;

            using var stream = file.OpenReadStream();
            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucket)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(file.Length)
                .WithContentType(file.ContentType));

            // ===== Return URL =====
            if (type == UploadType.TryOn || type == UploadType.Generated )
                return await GetPrivateFileUrlAsync(fileName); // pre-signed URL
            else
                return GetPublicFileUrl(fileName);             // direct URL
        }


        // Generate pre-signed URL for private files
        public async Task<string> GetPrivateFileUrlAsync(string fileName, int expiryInSeconds = 3600)
        {
            // MinIO client generates a pre-signed URL
            var url = await _minio.PresignedGetObjectAsync(new PresignedGetObjectArgs()
                .WithBucket(_settings.PrivateBucketName)
                .WithObject(fileName)
                .WithExpiry(expiryInSeconds));

            // replace it with localhost so the browser can access it
            return url.Replace("minio:9000", "localhost:9000");
        }


        // Generate URL for public file (no expiry)
        public string GetPublicFileUrl(string objectName)
        {
            return $"http://localhost:9000/{_settings.PublicBucketName}/{objectName}";
        }

        // Regenerate URL for an existing private file
        public async Task<string> RegeneratePrivateFileUrlAsync(string fileName, int expiryInSeconds = 3600)
        {
            // Simply call the existing method
            return await GetPrivateFileUrlAsync(fileName, expiryInSeconds);
        }
        public (long maxSize, int maxWidth, int maxHeight) GetConstraints(UploadType type)
        {
            return type switch
            {
                UploadType.Listing => (5 * 1024 * 1024, 2000, 2000),   // 5MB, max 2000x2000
                UploadType.Banner => (3 * 1024 * 1024, 1200, 400),    // 3MB, max 1200x400
                UploadType.Profile => (2 * 1024 * 1024, 500, 500),     // 2MB, max 500x500
                UploadType.TryOn => (5 * 1024 * 1024, 2000, 2000),   // 5MB, max 2000x2000
                UploadType.Generated => (5 * 1024 * 1024, 2000, 2000),   // 5MB, max 2000x2000
                _ => throw new ArgumentOutOfRangeException(nameof(type), "Unknown upload type")
            };
        }

    }
}