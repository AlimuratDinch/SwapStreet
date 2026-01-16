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

            // Get random number generator
            var random = new Random();

            // Calculate how many listings we need to create
            var listingsToCreate = 100 - existingCount;
            var listings = new List<Listing>();

            for (int i = 0; i < listingsToCreate; i++)
            {
                Id = testListingId,
                Title = "Test Item for Try-On",
                Description = "Test listing",
                Price = 24.99m,
                ProfileId = ProfileSeeder.TestProfileId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
            ;

            await context.Listings.AddAsync(testListing);
            await context.SaveChangesAsync();

            logger.LogInformation($"Successfully seeded {listingsToCreate} listings. Total listings: {await context.Listings.CountAsync()}");
        }
    }
}
