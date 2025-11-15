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

        public async Task<string> ProcessTryOnRequestAsync(string accessToken, string pathFromUrl)
        {
            // 1. Get user ID from access token
            var userId = _tokenService.GetUserIdFromAccessToken(accessToken);
            _logger.LogInformation("Processing try-on request for user: {UserId}", userId);
            Guid actualId = userId ?? Guid.Empty;
            
            // 2. Find user's personal image
            var personalImagePath = await FindTryOnImageByUserIdAsync(actualId);
            if (string.IsNullOrEmpty(personalImagePath))
            {
                throw new FileNotFoundException("Personal image not found for user");
            }

            // 3. Get images (personal and clothing)
            var personalImageBytes = await GetImageBytesAsync(personalImagePath);
            var clothingImageBytes = await GetImageBytesAsync(pathFromUrl);

            // 4. Generate new image using Gemini
            var generatedImageBytes = await _geminiService.GenerateImageAsync(
                personalImageBytes,
                clothingImageBytes);

            // 5. Store generated image
            var generatedImagePath = await StoreImageAsync(generatedImageBytes);

            // 6. Save to database
            var tryOnImage = new TryOnImage
            {
                UserId = actualId,
                PersonalImagePath = personalImagePath,
                CreatedAt = DateTime.UtcNow
            };

            _context.TryOnImages.Add(tryOnImage);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Try-on image generated and stored: {Path}", generatedImagePath);

            return generatedImagePath;
        }

        private async Task<string> FindTryOnImageByUserIdAsync(Guid userId)
        {
            // Query MiniO/S3 or database for user's personal image
            var userImageRecord = await _context.TryOnImages
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => t.PersonalImagePath)
                .FirstOrDefaultAsync();

            return userImageRecord ?? throw new FileNotFoundException("No personal image found for user");
        }

        private async Task<byte[]> GetImageBytesAsync(string imagePath)
        {
            // Extract object name and determine bucket from path
            var (objectName, bucket) = ExtractObjectNameAndBucket(imagePath);

            // Download from MinIO
            using var memoryStream = new MemoryStream();
            await _minio.GetObjectAsync(new GetObjectArgs()
                .WithBucket(bucket)
                .WithObject(objectName)
                .WithCallbackStream(async stream => await stream.CopyToAsync(memoryStream)));

            return memoryStream.ToArray();
        }

        private async Task<string> StoreImageAsync(byte[] imageBytes)
        {
            var fileName = $"generated/{Guid.NewGuid()}.png";
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
    }
}