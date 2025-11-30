using System.Threading.Tasks;
using backend.DbContexts;

namespace backend.Data.Seed
{
    // This orchestrator ensures data is seeded in the correct dependency order
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            // 1. Seed Provinces FIRST
            // Cities cannot be seeded without Provinces because they need the ProvinceId (FK)
            await ProvinceSeeder.SeedAsync(context);

            // 2. Seed Cities and FSAs NEXT
            // This relies on the Provinces table being populated
            await CitySeeder.SeedAsync(context);

        }
    }
}