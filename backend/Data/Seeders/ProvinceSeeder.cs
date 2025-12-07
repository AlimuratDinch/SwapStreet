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
        public static async Task SeedAsync(AppDbContext context)
        {
            string basePath = Directory.GetCurrentDirectory();

            // Build the full absolute path
            string csvFilePath = Path.Combine(basePath, "Data", "CSVs", "provinces.csv");

            // Optional: Log it so you can see exactly where it's looking in the console output
            Console.WriteLine($"[DEBUG] Looking for Province CSV at: {csvFilePath}");

            // --- Province Seeding Logic ---

            // 1. Check if the table already has data
            if (await context.Provinces.AnyAsync())
            {
                Console.WriteLine("Province data already exists. Skipping province seed.");
                return;
            }

            // 2. Read and Parse the CSV File
            if (!File.Exists(csvFilePath))
            {
                throw new FileNotFoundException($"Province CSV file not found at: {csvFilePath}");
            }

            Console.WriteLine("Starting province data seed...");

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

                    Console.WriteLine($"Successfully seeded {provinces.Count} province records.");
                }
            }
            catch (Exception ex)
            {
                // Handle exceptions during file reading or database insertion
                Console.WriteLine($"An error occurred during province seeding: {ex.Message}");
                // Depending on the context, you might rethrow or log the error.
            }
        }
    }
}