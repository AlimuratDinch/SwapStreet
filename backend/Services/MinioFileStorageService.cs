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
using backend.DbContexts;
using Microsoft.AspNetCore.Connections;
using System.Reactive.Linq;
using Minio.DataModel;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class MinioFileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minio;
        private readonly MinioSettings _settings;
        private readonly IConfiguration _config;
        private readonly AppDbContext _context;
        private readonly ILogger<MinioFileStorageService> _logger;

        public MinioFileStorageService(
            IMinioClient minio,
            IOptions<MinioSettings> settings,
            AppDbContext context,
            IConfiguration config,
            ILogger<MinioFileStorageService> logger)
        {
            _minio = minio ?? throw new ArgumentNullException(nameof(minio));
            _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _config = config ?? throw new ArgumentNullException(nameof(config));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _logger.LogInformation("MinioFileStorageService initialized");
            _logger.LogInformation("Public bucket: {PublicBucket}", _settings.PublicBucketName);
            _logger.LogInformation("Private bucket: {PrivateBucket}", _settings.PrivateBucketName);
        }



        private IMinioClient CreatePresignedUrlClient()
        {
            var frontendUrl = _config["FRONTEND_URL"] ?? "https://swapstreet.ca";
            var accessKey = Environment.GetEnvironmentVariable("MINIO_ACCESS_KEY") ?? "minioadmin";
            var secretKey = Environment.GetEnvironmentVariable("MINIO_SECRET_KEY") ?? "minioadmin";

            // Parse the frontend URL
            var uri = new Uri(frontendUrl);

            return new MinioClient()
                .WithEndpoint(uri.Host)  // Use swapstreet.ca
                .WithCredentials(accessKey, secretKey)
                .WithSSL(uri.Scheme == "https")  // Use HTTPS
                .Build();
        }

        // Upload picture 
        public async Task<string> UploadFileAsync(IFormFile file, UploadType type, Guid userId, Guid? listingId = null)
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

            // ===== Process DB Entities based on type =====
            switch (type)
            {
                case UploadType.Listing:
                    if (listingId == null) throw new ArgumentException("ListingId is required for Listing uploads.");

                    var listingImage = new ListingImage
                    {
                        Id = Guid.NewGuid(),
                        ListingId = listingId.Value,
                        ImagePath = fileName,
                        DisplayOrder = 0, // FIX LATER
                        ForTryon = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ListingImages.Add(listingImage);
                    break;

                case UploadType.TryOn:

                    var tryOnImage = new TryOnImage
                    {
                        ProfileId = userId,   // Use the userId passed to the method
                        ImagePath = fileName,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.TryOnImages.Add(tryOnImage);

                    break;

                case UploadType.Generated:
                    if (listingId == null) throw new ArgumentException("ListingId is required for Generated images.");

                    var generatedImage = new GeneratedImage
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        ListingId = listingId.Value,
                        ImagePath = fileName,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.GeneratedImages.Add(generatedImage);
                    break;

                default:
                    // Profile or Banner might need separate logic or their own tables
                    break;
            }

            await _context.SaveChangesAsync();


            using var stream = file.OpenReadStream();
            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucket)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(file.Length)
                .WithContentType(file.ContentType));

            // ===== Return URL ===== TODO : TEMP FIX 
            if (type == UploadType.TryOn || type == UploadType.Generated)
                return await GetPrivateFileUrlAsync(fileName); // pre-signed URL
            else
                return GetPublicFileUrl(fileName);             // direct URL
        }


        public async Task<string> GetPrivateFileUrlAsync(string fileName, int expiryInSeconds = 3600)
        {
            try
            {
                // Use special client that generates URLs for public domain
                var publicClient = CreatePresignedUrlClient();

                // Generate presigned URL - it will use swapstreet.ca as the host
                var presignedUrl = await publicClient.PresignedGetObjectAsync(
                    new PresignedGetObjectArgs()
                        .WithBucket(_settings.PrivateBucketName)
                        .WithObject(fileName)
                        .WithExpiry(expiryInSeconds)
                );

                _logger.LogInformation("Generated presigned URL: {Url}", presignedUrl);

                return presignedUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate presigned URL for {FileName}", fileName);
                throw;
            }
        }


        public string? GetPublicFileUrl(string? objectName)
        {
            if (string.IsNullOrWhiteSpace(objectName)) 
            {
                return null; // Or return a default "placeholder.png" path
            }

            var frontendUrl = _config["FRONTEND_URL"]?.TrimEnd('/');
            var bucket = _settings.PublicBucketName;

            return $"{frontendUrl}/{bucket}/{objectName.TrimStart('/')}";
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

        // Helper for seeding 
        public async Task<string> UploadImageInternalAsync(IFormFile file, UploadType type)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty.", nameof(file));

            var (maxSize, maxWidth, maxHeight) = GetConstraints(type);

            if (file.Length > maxSize)
                throw new ArgumentException($"File too large. Max: {maxSize / 1024 / 1024}MB");

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType))
                throw new ArgumentException("Invalid file type.");

            // Check dimensions
            using (var image = Image.Load(file.OpenReadStream()))
            {
                if (image.Width > maxWidth || image.Height > maxHeight)
                    throw new ArgumentException($"Dimensions exceed {maxWidth}x{maxHeight}");
            }

            // Generate Name
            var fileName = $"{type.ToString().ToLower()}/{Guid.NewGuid()}_{file.FileName}";

            // Determine Bucket
            var bucket = (type == UploadType.TryOn || type == UploadType.Generated)
                ? _settings.PrivateBucketName
                : _settings.PublicBucketName;

            // Upload to Minio
            using var stream = file.OpenReadStream();
            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucket)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(file.Length)
                .WithContentType(file.ContentType));

            return fileName;
        }


        public async Task<bool> HasImagesInPublicBucketAsync()
        {
            try
            {
                _logger.LogInformation("Checking if public bucket '{Bucket}' has images...", _settings.PublicBucketName);

                // 1. Check if bucket exists with error handling
                bool bucketExists;
                try
                {
                    bucketExists = await _minio.BucketExistsAsync(
                        new BucketExistsArgs().WithBucket(_settings.PublicBucketName)
                    );
                    _logger.LogInformation("Bucket exists check result: {Exists}", bucketExists);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to check if bucket exists. MinIO may not be accessible.");
                    _logger.LogError("Exception type: {Type}", ex.GetType().Name);
                    _logger.LogError("Exception message: {Message}", ex.Message);

                    // Return false instead of throwing - bucket check failed, assume no images
                    return false;
                }

                if (!bucketExists)
                {
                    _logger.LogWarning("Bucket '{Bucket}' does not exist", _settings.PublicBucketName);
                    return false;
                }

                // 2. Prepare arguments
                var args = new ListObjectsArgs()
                    .WithBucket(_settings.PublicBucketName)
                    .WithRecursive(true);

                // 3. Get the Async Enumerable (It does not fetch data yet)
                var asyncEnumerable = _minio.ListObjectsEnumAsync(args);

                // 4. Check if there is at least one item
                // We start the loop; if we find 1 item, we return true immediately.
                await foreach (var item in asyncEnumerable)
                {
                    _logger.LogInformation("Found at least one object in bucket: {Key}", item.Key);
                    return true;
                }

                // 5. If the loop finishes without entering, the bucket is empty
                _logger.LogInformation("Bucket '{Bucket}' exists but is empty", _settings.PublicBucketName);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in HasImagesInPublicBucketAsync");
                _logger.LogError("Exception type: {Type}", ex.GetType().Name);
                _logger.LogError("Exception message: {Message}", ex.Message);

                // Return false instead of throwing - assume no images if we can't check
                return false;
            }
        }
    }
}