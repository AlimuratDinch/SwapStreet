using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DbContexts;

namespace backend.Data.Seed
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            // // Ensure database exists
            // await context.Database.MigrateAsync();

            // // Seed Categories
            // if (!context.Categories.Any())
            // {
            //     await context.Categories.AddRangeAsync(SeedData.Categories);
            //     await context.SaveChangesAsync();
            // }

            // // Seed Items
            // if (!context.Items.Any())
            // {
            //     await context.Items.AddRangeAsync(SeedData.Items);
            //     await context.SaveChangesAsync();
            // }

            // // Seed Profiles
            // if (!context.Profiles.Any())
            // {
            //     await context.Profiles.AddRangeAsync(SeedData.Profiles);
            //     await context.SaveChangesAsync();
            // }

            // // Seed Wishlists
            // if (!context.Wishlists.Any())
            // {
            //     await context.Wishlists.AddRangeAsync(SeedData.Wishlists);
            //     await context.SaveChangesAsync();
            // }
        }
    }
}
