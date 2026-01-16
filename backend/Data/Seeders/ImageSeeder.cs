using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.Image;
using backend.Helpers;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.Seed
{
    public class ImageSeeder
    {
        private readonly IFileStorageService _fileStorage;
        private readonly AppDbContext _context;
        private readonly ILogger<ImageSeeder> _logger;
        private readonly Random _random = new Random();

        public ImageSeeder(
            IFileStorageService fileStorage,
            AppDbContext context,
            ILogger<ImageSeeder> logger)
        {
            _fileStorage = fileStorage;
            _context = context;
            _logger = logger;
        }

        public async Task SeedImagesAsync(string contentRootPath)
        {
            var seedImagesPath = Path.Combine(contentRootPath, "Data", "Seed", "Images");

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

            // 2. Get a System User to act as the "Uploader"
            var systemUser = await _context.Profiles.FirstOrDefaultAsync();
            if (systemUser == null)
            {
                _logger.LogWarning("Skipping image seeding: No users found.");
                return;
            }

            // // 3. Get all Listings that DON'T have images yet
            // // We use Include to check existing images efficiently
            // var listings = await _context.Listings
            //     .Include(l => l.Images)
            //     .Where(l => !l.Images.Any()) 
            //     .ToListAsync();

            _logger.LogInformation($"Found {listings.Count} listings needing images. Distributing {imageFiles.Length} source images among them.");

            foreach (var listing in listings)
            {
                try
                {
                    // 4. Pick a RANDOM image from your local pool
                    var randomFilePath = imageFiles[_random.Next(imageFiles.Length)];
                    
                    // 5. Wrap it as a FormFile
                    // We generate a "fake" file name so Minio doesn't overwrite if we uploaded this exact file before
                    // e.g. "House1.jpg" becomes "Listing_GUID_House1.jpg" effectively inside the service
                    var formFile = new LocalFormFile(randomFilePath, "image/jpeg");

                    // 6. Upload via Service
                    // This creates a NEW unique object in Minio and a NEW row in ListingImages
                    await _fileStorage.UploadFileAsync(
                        file: formFile,
                        type: UploadType.Listing,
                        userId: systemUser.Id,
                        listingId: listing.Id
                    );
                    
                    
                    await Task.Delay(10); 
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to seed image for Listing {listing.Id}");
                }
            }
            
            _logger.LogInformation("Random image seeding completed.");
        }
    }
}