using System.Threading.Tasks;
using backend.DbContexts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;

namespace backend.Data.Seed
{
    public static class DatabaseSeeder
    {
        // 1. Update signature to accept IServiceProvider
        public static async Task SeedAsync(AppDbContext context, IServiceProvider serviceProvider, Microsoft.Extensions.Logging.ILogger logger)
        {
            // --- Standard Static Seeds (No dependencies) ---
            await ProvinceSeeder.SeedAsync(context, logger);
            await CitySeeder.SeedAsync(context, logger);
            await ProfileSeeder.SeedAsync(context, logger);
            await ListingSeeder.SeedAsync(context, logger);

            // --- Service-Based Seeds (Complex dependencies) ---
            try
            {
                // 2. Resolve the ImageSeeder instance from DI
                var imageSeeder = serviceProvider.GetRequiredService<ImageSeeder>();

                // 3. Resolve Environment to get the Root Path
                var env = serviceProvider.GetRequiredService<IWebHostEnvironment>();

                // 4. Call the instance method
                await imageSeeder.SeedImagesAsync(env.ContentRootPath);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to seed images.");
            }
        }
    }
}