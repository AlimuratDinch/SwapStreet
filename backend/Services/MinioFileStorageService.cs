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

namespace backend.Services
{
    public class MinioFileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minio;
        private readonly MinioSettings _settings;

        private readonly AppDbContext _context;

        public MinioFileStorageService(IMinioClient minio, IOptions<MinioSettings> settings, AppDbContext context)
        {
            _minio = minio;
            _settings = settings.Value;
            _context = context;
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

            // ===== Return URL =====
            if (type == UploadType.TryOn || type == UploadType.Generated)
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
            var found = await _minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(_settings.PublicBucketName));
            if (!found) return false;

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
                return true;
            }

            // 5. If the loop finishes without entering, the bucket is empty
            return false;
        }

    }
}