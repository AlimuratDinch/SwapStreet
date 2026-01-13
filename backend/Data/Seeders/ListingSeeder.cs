using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DbContexts;

namespace backend.Data.Seed
{
    // TEMPORARY: Test listing for virtual try-on feature (uses the seeded test profile)
    public static class ListingSeeder
    {
        public static async Task SeedAsync(AppDbContext context, Microsoft.Extensions.Logging.ILogger logger)
        {
            var testListingId = Guid.Parse("550e8400-e29b-41d4-a716-446655440000");

            if (await context.Listings.AnyAsync(l => l.Id == testListingId))
                return;

            var testListing = new Listing
            {
                Id = testListingId,
                Name = "Test Item for Try-On",
                Description = "Test listing",
                Price = 24.99m,
                ProfileId = ProfileSeeder.TestProfileId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await context.Listings.AddAsync(testListing);
            await context.SaveChangesAsync();

            logger.LogInformation("Test listing created for virtual try-on");
        }
    }
}
