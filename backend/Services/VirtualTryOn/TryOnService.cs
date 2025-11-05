namespace YourApp.Services;

public class TryOnService : ITryOnService
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IGeminiImageGenerationService _geminiService;
    private readonly ILogger<TryOnService> _logger;
    private readonly IWebHostEnvironment _environment;

    public TryOnService(
        ApplicationDbContext context,
        ITokenService tokenService,
        IGeminiImageGenerationService geminiService,
        ILogger<TryOnService> logger,
        IWebHostEnvironment environment)
    {
        _context = context;
        _tokenService = tokenService;
        _geminiService = geminiService;
        _logger = logger;
        _environment = environment;
    }

    public async Task<string> ProcessTryOnRequestAsync(string accessToken, string pathFromUrl)
    {
        // 1. Get user ID from access token
        var userId = await _tokenService.GetUserIdFromAccessTokenAsync(accessToken);
        _logger.LogInformation("Processing try-on request for user: {UserId}", userId);

        // 2. Find user's personal image
        var personalImagePath = await FindTryOnImageByUserIdAsync(userId);
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
        var generatedImagePath = await StoreImageAsync(personalImagePath, generatedImageBytes);

        // 6. Save to database
        var tryOnImage = new TryOnImage
        {
            UserId = userId,
            PersonalImagePath = personalImagePath,
            GeneratedImagePath = generatedImagePath,
            CreatedAt = DateTime.UtcNow
        };

        _context.TryOnImages.Add(tryOnImage);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Try-on image generated and stored: {Path}", generatedImagePath);
        
        return generatedImagePath;
    }

    private async Task<string> FindTryOnImageByUserIdAsync(string userId)
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
        // If using local storage
        var fullPath = Path.Combine(_environment.WebRootPath, imagePath);
        
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Image not found: {imagePath}");
        }

        return await File.ReadAllBytesAsync(fullPath);
        
        // If using S3/MinIO, implement S3 client logic here
    }

    private async Task<string> StoreImageAsync(string personalImagePath, byte[] imageBytes)
    {
        // Generate unique filename
        var fileName = $"tryon_{Guid.NewGuid()}.png";
        var imagesFolder = Path.Combine(_environment.WebRootPath, "images", "generated");
        
        Directory.CreateDirectory(imagesFolder);
        
        var filePath = Path.Combine(imagesFolder, fileName);
        await File.WriteAllBytesAsync(filePath, imageBytes);

        return $"/images/generated/{fileName}";
        
        // If using S3/MinIO, implement S3 upload logic here
    }
}