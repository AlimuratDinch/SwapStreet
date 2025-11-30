using System.Globalization;
using backend.DbContexts;
using backend.Models;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.Seed
{
    public static class CitySeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            string basePath = Directory.GetCurrentDirectory();
    
            // 2. Combine with the specific location
            string csvFilePath = Path.Combine(basePath,"Data", "CSVs", "cities.csv");

            Console.WriteLine($"[DEBUG] Looking for file at: {csvFilePath}");

            // 1. Pre-Checks
            if (!File.Exists(csvFilePath))
            {
                throw new FileNotFoundException($"City CSV file not found at: {csvFilePath}");
            }

            if (await context.Cities.AnyAsync())
            {
                Console.WriteLine("City data already exists. Skipping seed.");
                return;
            }

            Console.WriteLine("Reading provinces for lookup...");

            // 2. Create Lookup Dictionary
            var provinceLookup = await context.Provinces
                .AsNoTracking()
                .ToDictionaryAsync(p => p.Code, p => p.Id);

            Console.WriteLine("Starting City and FSA seed...");

            using (var reader = new StreamReader(csvFilePath))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                // Register the Mapper Class so CsvHelper knows how to match headers
                csv.Context.RegisterClassMap<CityMap>();

                // Read into the clean DTO
                var records = csv.GetRecords<CityImportDto>();

                var citiesToAdd = new List<City>();
                int skippedCount = 0;

                foreach (var r in records)
                {
                    // Use the clean PascalCase property names
                    if (!provinceLookup.TryGetValue(r.ProvinceCode, out int validProvinceId))
                    {
                        Console.WriteLine($"Warning: Skipping city '{r.Name}'. Province code '{r.ProvinceCode}' not found.");
                        skippedCount++;
                        continue;
                    }

                    var city = new City
                    {
                        Name = r.Name,
                        ProvinceId = validProvinceId,
                        Latitude = r.Latitude,
                        Longitude = r.Longitude,
                        Fsas = new List<Fsa>() 
                    };

                    // Split the clean "FsaCodes" property
                    if (!string.IsNullOrWhiteSpace(r.FsaCodes))
                    {
                        var fsaCodes = r.FsaCodes.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        
                        foreach (var code in fsaCodes)
                        {
                            city.Fsas.Add(new Fsa { Code = code });
                        }
                    }

                    citiesToAdd.Add(city);
                }

                await context.Cities.AddRangeAsync(citiesToAdd);
                await context.SaveChangesAsync();

                Console.WriteLine($"Seeding Complete. Added {citiesToAdd.Count} cities. Skipped {skippedCount}.");
            }
        }
    }

}