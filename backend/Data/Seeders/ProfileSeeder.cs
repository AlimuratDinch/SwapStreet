using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;

namespace backend.Data.Seed
{
    // TEMPORARY: Test profile for virtual try-on feature
    public static class ProfileSeeder
    {
        public static readonly Guid TestProfileId = Guid.Parse("019b71a5-2eec-7d07-ae98-5de517d62015");

        public static async Task SeedAsync(AppDbContext context)
        {
            if (await context.Profiles.AnyAsync(p => p.Id == TestProfileId))
                return;

            var cityId = await context.Cities.Select(c => c.Id).FirstOrDefaultAsync();
            if (cityId == 0) cityId = 1;

            var profile = new Profile
            {
                Id = TestProfileId,
                Status = ProfileStatusEnum.Online,
                VerifiedSeller = true,
                FirstName = "Test",
                LastName = "Seller",
                Rating = 5.0f,
                CityId = cityId,
                FSA = "ABC",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await context.Profiles.AddAsync(profile);
            await context.SaveChangesAsync();
        }
    }
}
