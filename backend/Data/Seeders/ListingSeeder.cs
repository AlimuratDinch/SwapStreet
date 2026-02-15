using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs;

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

        public static async Task SeedAsync(AppDbContext context, IListingCommandService listingService, ILogger logger)
        {
            var existingCount = await context.Listings.CountAsync();
            if (existingCount >= 100) return;

            var profileId = ProfileSeeder.TestProfileId;
            var validFsas = await context.Fsas.Select(f => f.Code).ToListAsync();
            var random = new Random();

            logger.LogInformation("Seeding listings via Command Service to sync Meilisearch...");

            for (int i = 0; i < (100 - existingCount); i++)
            {
                var request = new CreateListingRequestDto
                {
                    Title = $"{ClothingItems[random.Next(ClothingItems.Length)]} #{existingCount + i + 1}",
                    Description = Descriptions[random.Next(Descriptions.Length)],
                    Price = Math.Round((decimal)(random.NextDouble() * 200 + 10), 2),
                    ProfileId = profileId,
                    FSA = validFsas[random.Next(validFsas.Count)]
                };

                try 
                {
                    await listingService.CreateListingAsync(request);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to seed listing {Index}", i);
                }
            }
        }
    }
}