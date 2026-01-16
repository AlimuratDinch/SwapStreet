using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.Image;
using backend.Helpers;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.Seed
{
    public class ImageSeeder
    {
        private readonly MinioFileStorageService _minioFileStorage;
        private readonly AppDbContext _context;

        private int roundRobinCounter = 0;

        private List<Guid> _listings;

        private readonly List<string> _pathList;
        private readonly ILogger<ImageSeeder> _logger;

        private readonly Random _random = new Random();

        public ImageSeeder(
            MinioFileStorageService minioFileStorage,
            AppDbContext context,
            ILogger<ImageSeeder> logger)
        {
            _minioFileStorage = minioFileStorage;
            _context = context;
            _logger = logger;
            _pathList = new List<string>();
        }

        public async Task SeedImagesAsync(string contentRootPath)
        {
            if (await _minioFileStorage.HasImagesInPublicBucketAsync()) return;

            var seedImagesPath = Path.Combine(contentRootPath, "Data", "TestImages");

            if (!Directory.Exists(seedImagesPath))
            {
                _logger.LogWarning($"Image seed directory not found at: {seedImagesPath}");
                return;
            }

            // 1. Get all available image files from the folder
            var imageFiles = Directory.GetFiles(seedImagesPath);
            if (imageFiles.Length == 0)
            {
                _logger.LogWarning("No images found to seed.");
                return;
            }

            foreach (var file in imageFiles)
            {
                var formFile = new LocalFormFile(file, "image/jpeg");
                var newPath = await _minioFileStorage.UploadImageInternalAsync(formFile, UploadType.Listing);
                _pathList.Add(newPath);
                _logger.LogInformation($"New Path Added: {newPath}");
            }

            // Get all listingsIds
            _listings = await _context.Listings
                    .AsNoTracking()
                    .Select(l => l.Id)
                    .ToListAsync();

            await BatchInsertImagesAsync(_pathList);

        }


        private async Task BatchInsertImagesAsync(List<string> uploadedImagePaths)
        {
            var imagesToInsert = new List<ListingImage>();

            foreach (var listingId in _listings)
            {
                int imagesCount = _random.Next(1, 4);

                for (int i = 0; i < imagesCount; i++)
                {
                    // 2. Pick an image using Round Robin
                    var pathIndex = roundRobinCounter % uploadedImagePaths.Count;
                    var selectedPath = uploadedImagePaths[pathIndex];

                    // Increment so the next image/listing gets a different one
                    roundRobinCounter++;

                    var newImage = new ListingImage
                    {
                        Id = Guid.NewGuid(),
                        ListingId = listingId,
                        ImagePath = selectedPath,

                        // 3. Set DisplayOrder correctly (0, 1, 2)
                        DisplayOrder = i,

                        ForTryon = false, // Set to false if these are standard listing photos
                        CreatedAt = DateTime.UtcNow
                    };

                    imagesToInsert.Add(newImage);
                }
            }

            // Batch Add & Save
            await _context.ListingImages.AddRangeAsync(imagesToInsert);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Successfully inserted {imagesToInsert.Count} images across {_listings.Count} listings.");
        }
    }
}