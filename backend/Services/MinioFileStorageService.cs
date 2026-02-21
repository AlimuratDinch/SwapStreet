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
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Threading;

namespace backend.Services
{
    public class MinioFileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minio;
        private readonly MinioSettings _settings;
        private readonly IConfiguration _config;
        private readonly AppDbContext _context;
        private readonly ILogger<MinioFileStorageService> _logger;
        private static readonly ConcurrentDictionary<UploadType, byte> _cleanupPending = new();
        private static int _cleanupRunning = 0;

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
        public async Task<string> UploadFileAsync(IFormFile file, UploadType type, Guid userId, Guid? listingId = null, int displayOrder = 0)
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

            // ===== Save to database in transaction =====
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
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
                            DisplayOrder = displayOrder,
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
                await transaction.CommitAsync();
                _logger.LogInformation("Database record created for {Type} image: {FileName}", type, fileName);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to save {Type} image record to database: {FileName}", type, fileName);
                throw;
            }

            // ===== Upload to MinIO after database transaction commits =====
            try
            {
                using var stream = file.OpenReadStream();
                await _minio.PutObjectAsync(new PutObjectArgs()
                    .WithBucket(bucket)
                    .WithObject(fileName)
                    .WithStreamData(stream)
                    .WithObjectSize(file.Length)
                    .WithContentType(file.ContentType));

                _logger.LogInformation("Uploaded {Type} image to MinIO: {FileName}", type, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload {Type} image to MinIO: {FileName}. Database record exists - file may be orphaned.", type, fileName);
                throw;
            }

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


        // Generate URL for public file (no expiry)
        public string GetPublicFileUrl(string objectName)
        {
            var frontendUrl = _config["FRONTEND_URL"];
            return $"{frontendUrl}/{_settings.PublicBucketName}/{objectName}";
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
                UploadType.Banner => (5 * 1024 * 1024, 4096, 4096),     // 5MB, no dimension limit (frontend crop)
                UploadType.Profile => (5 * 1024 * 1024, 4096, 4096),   // 5MB, no dimension limit (frontend crop)
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

        /// <summary>
        /// Deletes images from MinIO and the appropriate database table based on type and ID.
        /// Deletes database first (transactional), then MinIO. Logs orphaned files for cleanup.
        /// </summary>
        public async Task DeleteImagesAsync(UploadType type, Guid? listingId = null, Guid? profileId = null, CancellationToken cancellationToken = default)
        {
            try
            {
                // Validate required IDs based on type
                switch (type)
                {
                    case UploadType.Listing:
                    case UploadType.Generated:
                        if (!listingId.HasValue || listingId == Guid.Empty)
                            throw new ArgumentException($"ListingId is required for {type} image deletion", nameof(listingId));
                        break;

                    case UploadType.TryOn:
                        if (!profileId.HasValue || profileId == Guid.Empty)
                            throw new ArgumentException($"ProfileId is required for TryOn image deletion", nameof(profileId));
                        break;

                    case UploadType.Profile:
                    case UploadType.Banner:
                        if (!profileId.HasValue || profileId == Guid.Empty)
                            throw new ArgumentException($"ProfileId is required for {type} image deletion", nameof(profileId));
                        break;

                    default:
                        throw new ArgumentException($"Unknown image type: {type}", nameof(type));
                }

                var bucket = type == UploadType.TryOn || type == UploadType.Generated
                    ? _settings.PrivateBucketName
                    : _settings.PublicBucketName;

                List<string> imagePaths = [];

                if (!listingId.HasValue) throw new ArgumentException("ListingId is required for Listing image deletion.");
                if (!profileId.HasValue) throw new ArgumentException("ProfileId is required for TryOn image deletion.");

                // ===== STEP 1: Retrieve image paths from database =====
                switch (type)
                {
                    case UploadType.Listing:
                        imagePaths = await _context.ListingImages
                            .Where(li => li.ListingId == listingId.Value)
                            .Select(li => li.ImagePath)
                            .ToListAsync(cancellationToken);
                        break;

                    case UploadType.TryOn:
                        imagePaths = await _context.TryOnImages
                            .Where(ti => ti.ProfileId == profileId.Value)
                            .Select(ti => ti.ImagePath)
                            .ToListAsync(cancellationToken);
                        break;

                    case UploadType.Generated:
                        imagePaths = await _context.GeneratedImages
                            .Where(gi => gi.ListingId == listingId.Value)
                            .Select(gi => gi.ImagePath)
                            .ToListAsync(cancellationToken);
                        break;

                    case UploadType.Profile:
                    case UploadType.Banner:
                        // Profile and Banner images are not tracked in database (yet)
                        _logger.LogInformation("Image type {Type} does not have database entries for deletion", type);
                        return;
                }

                if (imagePaths.Count == 0)
                {
                    _logger.LogInformation("No images found for {Type} with ID {Id}", type, listingId ?? profileId);
                    return;
                }

                // ===== STEP 2: Delete from database FIRST (in transaction) =====
                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    switch (type)
                    {
                        case UploadType.Listing:
                            var listingImagesToDelete = await _context.ListingImages
                                .Where(li => li.ListingId == listingId.Value)
                                .ToListAsync(cancellationToken);

                            if (listingImagesToDelete.Any())
                            {
                                _context.ListingImages.RemoveRange(listingImagesToDelete);
                            }
                            break;

                        case UploadType.TryOn:
                            var tryOnImagesToDelete = await _context.TryOnImages
                                .Where(ti => ti.ProfileId == profileId.Value)
                                .ToListAsync(cancellationToken);

                            if (tryOnImagesToDelete.Any())
                            {
                                _context.TryOnImages.RemoveRange(tryOnImagesToDelete);
                            }
                            break;

                        case UploadType.Generated:
                            var generatedImagesToDelete = await _context.GeneratedImages
                                .Where(gi => gi.ListingId == listingId.Value)
                                .ToListAsync(cancellationToken);

                            if (generatedImagesToDelete.Any())
                            {
                                _context.GeneratedImages.RemoveRange(generatedImagesToDelete);
                            }
                            break;
                    }

                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    _logger.LogInformation("Deleted {Count} {Type} image records from database", imagePaths.Count, type);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    _logger.LogError(ex, "Failed to delete images from database for type {Type}", type);
                    throw;
                }

                // ===== STEP 3: Delete from MinIO AFTER database transaction commits =====
                // This is outside the transaction - orphaned files will be logged for cleanup
                var orphanedFiles = new List<string>();
                foreach (var imagePath in imagePaths)
                {
                    try
                    {
                        await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                            .WithBucket(bucket)
                            .WithObject(imagePath));

                        _logger.LogInformation("Deleted image from MinIO: {ImagePath}", imagePath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to delete image from MinIO: {ImagePath}. File is ORPHANED - schedule cleanup.", imagePath);
                        orphanedFiles.Add(imagePath);
                        // Continue with next file
                    }
                }

                if (orphanedFiles.Count != 0)
                {
                    _logger.LogWarning("Total orphaned files in MinIO for {Type}: {Count}. Bucket: {Bucket}", type, orphanedFiles.Count, bucket);
                    _cleanupPending[type] = 1;
                    TrySchedulePendingCleanup();
                }

                _logger.LogInformation("Successfully deleted {Count} images of type {Type}", imagePaths.Count, type);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error during image deletion for type {Type}", type);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting images of type {Type}", type);
                throw;
            }
        }

        public async Task<IReadOnlyCollection<string>> DeleteFilesAsync(
            UploadType type,
            IEnumerable<string> filePaths,
            CancellationToken cancellationToken = default)
        {
            if (filePaths == null)
            {
                throw new ArgumentNullException(nameof(filePaths));
            }

            var bucket = type == UploadType.TryOn || type == UploadType.Generated
                ? _settings.PrivateBucketName
                : _settings.PublicBucketName;

            var failedDeletes = new List<string>();

            foreach (var filePath in filePaths)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                try
                {
                    await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                        .WithBucket(bucket)
                        .WithObject(filePath));
                }
                catch (Exception ex)
                {
                    failedDeletes.Add(filePath);
                    _logger.LogError(ex, "Failed to delete object {ObjectKey} from bucket {Bucket}", filePath, bucket);
                }
            }

            if (failedDeletes.Count != 0)
            {
                _logger.LogWarning("Failed to delete {Count} objects from bucket {Bucket}", failedDeletes.Count, bucket);
            }

            return failedDeletes;
        }

        public async Task<int> CleanupOrphanedFilesAsync(UploadType type, CancellationToken cancellationToken = default)
        {
            var prefix = $"{type.ToString().ToLower()}/";
            var bucket = type == UploadType.TryOn || type == UploadType.Generated
                ? _settings.PrivateBucketName
                : _settings.PublicBucketName;

            HashSet<string> validPaths;

            switch (type)
            {
                case UploadType.Listing:
                    validPaths = (await _context.ListingImages
                        .Select(li => li.ImagePath)
                        .ToListAsync(cancellationToken))
                        .ToHashSet(StringComparer.Ordinal);
                    break;

                case UploadType.TryOn:
                    validPaths = (await _context.TryOnImages
                        .Select(ti => ti.ImagePath)
                        .ToListAsync(cancellationToken))
                        .ToHashSet(StringComparer.Ordinal);
                    break;

                case UploadType.Generated:
                    validPaths = (await _context.GeneratedImages
                        .Select(gi => gi.ImagePath)
                        .ToListAsync(cancellationToken))
                        .ToHashSet(StringComparer.Ordinal);
                    break;

                case UploadType.Profile:
                    validPaths = (await _context.Profiles
                        .Where(p => p.ProfileImagePath != null)
                        .Select(p => p.ProfileImagePath!)
                        .ToListAsync(cancellationToken))
                        .ToHashSet(StringComparer.Ordinal);
                    break;

                case UploadType.Banner:
                    validPaths = (await _context.Profiles
                        .Where(p => p.BannerImagePath != null)
                        .Select(p => p.BannerImagePath!)
                        .ToListAsync(cancellationToken))
                        .ToHashSet(StringComparer.Ordinal);
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(type), "Unknown upload type");
            }

            var args = new ListObjectsArgs()
                .WithBucket(bucket)
                .WithPrefix(prefix)
                .WithRecursive(true);

            var deletedCount = 0;
            var failedDeletes = new List<string>();

            await foreach (var item in _minio.ListObjectsEnumAsync(args))
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                if (validPaths.Contains(item.Key))
                {
                    continue;
                }

                try
                {
                    await _minio.RemoveObjectAsync(new RemoveObjectArgs()
                        .WithBucket(bucket)
                        .WithObject(item.Key));

                    deletedCount++;
                }
                catch (Exception ex)
                {
                    failedDeletes.Add(item.Key);
                    _logger.LogError(ex, "Failed to delete orphaned object {ObjectKey} from bucket {Bucket}", item.Key, bucket);
                }
            }

            if (failedDeletes.Count != 0)
            {
                _logger.LogWarning("Failed to delete {Count} orphaned objects from bucket {Bucket}", failedDeletes.Count, bucket);
            }

            _logger.LogInformation("Deleted {Count} orphaned objects for type {Type} from bucket {Bucket}", deletedCount, type, bucket);
            return deletedCount;
        }

        private void TrySchedulePendingCleanup()
        {
            // If there’s nothing to clean, don’t schedule any background work.
            if (_cleanupPending.IsEmpty)
            {
                return;
            }

            // If a cleanup runner is already active, don’t start another.
            if (Interlocked.CompareExchange(ref _cleanupRunning, 1, 0) != 0)
            {
                return;
            }

            // Fire-and-forget cleanup so request path stays fast.
            _ = Task.Run(async () =>
            {
                try
                {
                    foreach (var entry in _cleanupPending.Keys.ToList())
                    {
                        var bucket = entry == UploadType.TryOn || entry == UploadType.Generated
                            ? _settings.PrivateBucketName
                            : _settings.PublicBucketName;

                        if (!await IsMinioAvailableAsync(bucket))
                        {
                            continue;
                        }

                        try
                        {
                            var deletedCount = await CleanupOrphanedFilesAsync(entry);
                            _logger.LogInformation("Auto-cleanup deleted {Count} orphaned files for type {Type}", deletedCount, entry);
                            _cleanupPending.TryRemove(entry, out _);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Auto-cleanup failed for type {Type}", entry);
                        }
                    }
                }
                finally
                {
                    // Allow future cleanups after this run ends.
                    Interlocked.Exchange(ref _cleanupRunning, 0);
                }
            });
        }

        private async Task<bool> IsMinioAvailableAsync(string bucket)
        {
            try
            {
                return await _minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "MinIO availability check failed for bucket {Bucket}", bucket);
                return false;
            }
        }
    }
}