using backend.Contracts;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Services;
using backend.Contracts.Auth;
using backend.DbContexts;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Options;

namespace backend.Services.VirtualTryOn
{
    public class TryOnService : ITryOnService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IGenerativeService _geminiService;
        private readonly ILogger<TryOnService> _logger;
        private readonly IMinioClient _minio;
        private readonly MinioSettings _minioSettings;

        private readonly IFileStorageService _fileStorageService;

        public TryOnService(
            AppDbContext context,
            ITokenService tokenService,
            IGenerativeService geminiService,
            ILogger<TryOnService> logger,
            IMinioClient minio,
            IOptions<MinioSettings> minioSettings)
        {
            _context = context;
            _tokenService = tokenService;
            _geminiService = geminiService;
            _logger = logger;
            _minio = minio;
            _minioSettings = minioSettings.Value;
        }

        public async Task<string> ProcessTryOnRequestAsync(Guid profileId, string clothingImageUrl)
        {
            
            // 2. Find user's personal image
            var personalImagePath = await FindTryOnImageByProfileIdAsync(profileId);
            if (string.IsNullOrEmpty(personalImagePath))
            {
                throw new FileNotFoundException("Personal image not found for user");
            }

            // 3. Get images (personal and clothing)
            var personalImageBytes = await GetImageBytesAsync(personalImagePath);
            var clothingImageBytes = await GetImageBytesAsync(clothingImageUrl);

            // 4. Generate new image using Virtual Try-On API
            var generatedImageBytes = await _geminiService.GenerateImageAsync(
                personalImageBytes,
                clothingImageBytes);

            // 5. Store generated image
            var generatedImagePath = await StoreImageAsync(generatedImageBytes, profileId.ToString());

            // 6. Save to database
            var tryOnImage = new TryOnImage
            {
                ProfileId = profileId,
                ImagePath = personalImagePath,
                CreatedAt = DateTime.UtcNow
            };

            _context.TryOnImages.Add(tryOnImage);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Try-on image generated and stored: {Path}", generatedImagePath);

            return generatedImagePath;
        }

        private async Task<string> FindTryOnImageByProfileIdAsync(Guid profileId)
        {
            // Query MiniO/S3 or database for user's personal image
            var userImageRecord = await _context.TryOnImages
                .Where(t => t.ProfileId == profileId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => t.ImagePath)
                .FirstOrDefaultAsync();

            return userImageRecord ?? throw new FileNotFoundException("No personal image found for user");
        }

        private async Task<byte[]> GetImageBytesAsync(string imagePath)
        {
            // Extract object name and determine bucket from path
            var (objectName, bucket) = ExtractObjectNameAndBucket(imagePath);

            // Download from MinIO
            var memoryStream = new MemoryStream();
            try
            {
                await _minio.GetObjectAsync(new GetObjectArgs()
                    .WithBucket(bucket)
                    .WithObject(objectName)
                    .WithCallbackStream(async stream => await stream.CopyToAsync(memoryStream)));

                // Reset position to beginning before reading
                memoryStream.Position = 0;
                return memoryStream.ToArray();
            }
            finally
            {
                memoryStream.Dispose();
            }
        }

        private async Task<string> StoreImageAsync(byte[] imageBytes, string profileId)
        {
            var fileName = $"generated/{profileId}/{Guid.NewGuid()}.png";
            var bucket = _minioSettings.PrivateBucketName; 

            // Upload to MinIO
            using var stream = new MemoryStream(imageBytes);
            await _minio.PutObjectAsync(new PutObjectArgs()
                .WithBucket(bucket)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(imageBytes.Length)
                .WithContentType("image/png"));

            return fileName;
        }

        private (string objectName, string bucket) ExtractObjectNameAndBucket(string imagePath)
        {
            // If it's a URL, extract the object name
            if (Uri.TryCreate(imagePath, UriKind.Absolute, out var uri))
            {
                // Handle URLs like: http://localhost:9000/private/tryon/guid_filename.png
                // or pre-signed URLs
                var pathParts = uri.AbsolutePath.TrimStart('/').Split('/', 2);
                if (pathParts.Length == 2)
                {
                    var bucketName = pathParts[0];
                    // URL decode the object name to handle encoded characters (e.g., %20 for spaces)
                    var objectName = Uri.UnescapeDataString(pathParts[1]);
                    _logger.LogInformation("Extracted bucket: {Bucket}, object: {Object} from URL: {Url}", 
                        bucketName, objectName, imagePath);
                    return (objectName, bucketName);
                }
            }

            // If it's already an object name (e.g., "tryon/guid_filename.png")
            // URL decode it in case it's already encoded
            var decodedPath = Uri.UnescapeDataString(imagePath);
            if (decodedPath.StartsWith("tryon/", StringComparison.OrdinalIgnoreCase) ||
                decodedPath.StartsWith("generated/", StringComparison.OrdinalIgnoreCase))
            {
                return (decodedPath, _minioSettings.PrivateBucketName);
            }

            return (decodedPath, _minioSettings.PrivateBucketName);
        }

        public async Task AddGeneratedImage(Guid userId,Guid listingId,string fileName)
        {
             var generatedImage = new GeneratedImage
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            ListingId = listingId,
                            ImagePath = fileName,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.GeneratedImages.Add(generatedImage);
                        await _context.SaveChangesAsync();
        }


        // public async Task<string> ProcessTryOnFromUrlsAsync(string userImageUrl, string clothingImageUrl)
        // {
        //     _logger.LogInformation("Processing try-on request from URLs. User: {UserUrl}, Clothing: {ClothingUrl}", 
        //         userImageUrl, clothingImageUrl);

        //     // 1. Get images from MinIO using the URLs
        //     var userImageBytes = await GetImageBytesAsync(userImageUrl);
        //     var clothingImageBytes = await GetImageBytesAsync(clothingImageUrl);

        //     _logger.LogInformation("Downloaded images. User: {UserSize} bytes, Clothing: {ClothingSize} bytes", 
        //         userImageBytes.Length, clothingImageBytes.Length);

        //     // 2. Generate new image using GenerativeService
        //     var generatedImageBytes = await _geminiService.GenerateImageAsync(
        //         userImageBytes,
        //         clothingImageBytes);

        //     _logger.LogInformation("Image generation completed. Generated size: {Size} bytes", generatedImageBytes.Length);

        //     // 3. Store generated image
        //     var generatedImagePath = await StoreImageAsync(generatedImageBytes);

        //     _logger.LogInformation("Try-on image generated and stored: {Path}", generatedImagePath);

        //     return generatedImagePath;
        // }
    }
}