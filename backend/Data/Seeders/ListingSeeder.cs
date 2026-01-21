using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DbContexts;

namespace backend.Data.Seed
{
    // Seeds 100 test listings for testing purposes
    public static class ListingSeeder
    {
        private static readonly string[] ClothingItems = new[]
        {
            "Vintage Denim Jacket", "Classic White T-Shirt", "Black Leather Boots", "Blue Jeans",
            "Red Flannel Shirt", "Gray Hoodie", "Navy Blazer", "Tan Chinos", "Black Dress",
            "White Sneakers", "Brown Leather Belt", "Green Parka", "Striped Sweater",
            "Plaid Skirt", "Denim Shorts", "Wool Coat", "Silk Scarf", "Cotton Cardigan",
            "Leather Jacket", "Running Shoes", "Baseball Cap", "Winter Gloves",
            "Summer Dress", "Polo Shirt", "Cargo Pants", "Blazer", "Trench Coat",
            "Anorak", "Windbreaker", "Fleece Jacket", "Tank Top", "Crop Top",
            "Maxi Dress", "Midi Skirt", "High-Waisted Jeans", "Cargo Shorts",
            "Athletic Shorts", "Yoga Pants", "Leggings", "Joggers", "Sweatpants"
        };

        private static readonly string[] Descriptions = new[]
        {
            "Gently used, excellent condition. Perfect for everyday wear.",
            "Like new condition, only worn a few times. Great quality item.",
            "Vintage piece in good condition. Some minor wear but still stylish.",
            "Well-maintained item. Shows minimal signs of use.",
            "Excellent condition, barely worn. Great find!",
            "Good condition with some minor wear. Still very wearable.",
            "Classic piece that never goes out of style. Well cared for.",
            "Great quality item in excellent condition. Ready to wear.",
            "Stylish and comfortable. Shows some signs of use but still looks great.",
            "Perfect for your wardrobe. Good condition with minor wear."
        };

        private static readonly string[] FSAs =
        [
            "M5T", "M5V", "M5P", "M5S", "M5R", "M5E", "M5G", "M5A", "M5C", "M5B", "M5M", "M5N", "M5H", "M5J", "M4X", "M4Y", "M4R", "M4S", "M4P", "M4V", "M4W", "M4T", "M4J", "M4K", "M4H", "M4N", "M4L", "M4M", "M4B", "M4C", "M4A", "M4G", "M4E", "M3N", "M3M", "M3L", "M3K", "M3J", "M3H", "M3C", "M3B", "M3A", "M2P", "M2R", "M2L", "M2M", "M2N", "M2H", "M2J", "M2K", "M1C", "M1B", "M1E", "M1G", "M1H", "M1K"
        ];

        public static async Task SeedAsync(AppDbContext context, Microsoft.Extensions.Logging.ILogger logger)
        {
            // Check if we already have 100+ listings
            var existingCount = await context.Listings.CountAsync();
            if (existingCount >= 100)
            {
                logger.LogInformation($"Listings already seeded. Current count: {existingCount}");
                return;
            }

            // Get the test profile ID
            var profileId = ProfileSeeder.TestProfileId;

            // Verify profile exists
            var profileExists = await context.Profiles.AnyAsync(p => p.Id == profileId);
            if (!profileExists)
            {
                logger.LogWarning("Test profile not found. Cannot seed listings.");
                return;
            }

            // Get available FSAs - try database first, fallback to hardcoded list
            List<string> validFsas = new List<string>();

            try
            {
                var fsaCount = await context.Fsas.CountAsync();
                if (fsaCount > 0)
                {
                    validFsas = await context.Fsas
                        .AsNoTracking()
                        .Where(f => !string.IsNullOrWhiteSpace(f.Code))
                        .Select(f => f.Code)
                        .Distinct()
                        .ToListAsync();

                    logger.LogInformation($"Loaded {validFsas.Count} FSAs from database");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to load FSAs from database, will use fallback list");
                validFsas.Clear();
            }

            // Fallback to hardcoded Toronto FSAs if database query fails
            if (validFsas.Count == 0)
            {
                logger.LogInformation("Using fallback FSA list (Toronto area FSAs)");
                validFsas = new List<string>
                {
                    "M5T", "M5V", "M5P", "M5S", "M5R", "M5E", "M5G", "M5A", "M5C", "M5B",
                    "M5M", "M5N", "M5H", "M5J", "M4X", "M4Y", "M4R", "M4S", "M4P", "M4V",
                    "M4W", "M4T", "M4J", "M4K", "M4H", "M4N", "M4L", "M4M", "M4B", "M4C",
                    "M4A", "M4G", "M4E", "M3N", "M3M", "M3L", "M3K", "M3J", "M3H", "M3C",
                    "M3B", "M3A", "M2P", "M2R", "M2L", "M2M", "M2N", "M2H", "M2J", "M2K",
                    "M1C", "M1B", "M1E", "M1G", "M1H", "M1K"
                };
            }

            if (validFsas.Count == 0)
            {
                logger.LogError("No valid FSAs available. Cannot seed listings.");
                return;
            }

            // Get random number generator
            var random = new Random();

            // Calculate how many listings we need to create
            var listingsToCreate = 100 - existingCount;
            var listings = new List<Listing>();

            for (int i = 0; i < listingsToCreate; i++)
            {
                var baseItem = ClothingItems[random.Next(ClothingItems.Length)];
                var selectedFsa = validFsas[random.Next(validFsas.Count)];

                var listing = new Listing
                {
                    Id = Guid.NewGuid(),
                    Title = $"{baseItem} #{existingCount + i + 1}",
                    Description = Descriptions[random.Next(Descriptions.Length)],
                    Price = Math.Round((decimal)(random.NextDouble() * 200 + 10), 2),
                    ProfileId = profileId,
                    TagId = null,
                    FSA = selectedFsa,
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 90)),
                    UpdatedAt = DateTime.UtcNow
                };

                listings.Add(listing);
            }

            if (listings.Count == 0)
            {
                logger.LogWarning("No listings were created. All listings had invalid FSA values.");
                return;
            }

            logger.LogInformation($"Adding {listings.Count} listings to database (selected from {listingsToCreate} to create)...");

            try
            {
                // Add all listings in batches for better performance
                await context.Listings.AddRangeAsync(listings);
                await context.SaveChangesAsync();

                var finalCount = await context.Listings.CountAsync();
                logger.LogInformation($"Successfully seeded listings. Total listings now: {finalCount}");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to seed listings. Error: {ErrorMessage}", ex.Message);
                throw;
            }
        }
    }
}