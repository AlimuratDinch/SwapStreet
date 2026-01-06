using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DbContexts;
using System.IO;
using System.Globalization;
using CsvHelper;

namespace backend.Data.Seed
{
    public static class ProvinceSeeder
    {
        public static async Task SeedAsync(AppDbContext context, Microsoft.Extensions.Logging.ILogger logger)
        {
            string basePath = Directory.GetCurrentDirectory();

            // Build the full absolute path
            string csvFilePath = Path.Combine(basePath, "Data", "CSVs", "provinces.csv");

            // Optional: Log it so you can see exactly where it's looking in the console output
            logger.LogDebug("Looking for Province CSV at: {Path}", csvFilePath);

            // --- Province Seeding Logic ---

            // 1. Check if the table already has data
            if (await context.Provinces.AnyAsync())
            {
                logger.LogInformation("Province data already exists. Skipping province seed.");
                return;
            }

            // 2. Read and Parse the CSV File
            if (!File.Exists(csvFilePath))
            {
                throw new FileNotFoundException($"Province CSV file not found at: {csvFilePath}");
            }

            logger.LogInformation("Starting province data seed...");

            try
            {
                using (var reader = new StreamReader(csvFilePath))
                using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
                {
                    // Register the custom mapping
                    csv.Context.RegisterClassMap<ProvinceMap>();

                    // Get all records, converting them to a list of Province objects
                    var provinces = csv.GetRecords<Province>().ToList();

                    // 3. Insert records efficiently
                    await context.Provinces.AddRangeAsync(provinces);

                    // 4. Commit changes
                    await context.SaveChangesAsync();

                    logger.LogInformation("Successfully seeded {Count} province records.", provinces.Count);
                }
            }
            catch (Exception ex)
            {
                // Handle exceptions during file reading or database insertion
                logger.LogError(ex, "An error occurred during province seeding");
                // Depending on the context, you might rethrow or log the error.
            }
        }
    }
}