using backend.Contracts;
using backend.DbContexts;
using backend.Models;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class LocationService : ILocationService
    {
        private readonly AppDbContext _context;

        public LocationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<City?> GetCityByFsaAsync(string fsaCode)
        {
            if (string.IsNullOrWhiteSpace(fsaCode) || fsaCode.Length < 3)
                return null;

            // Normalize input: "m5v 1a1" -> "M5V"
            string cleanFsa = fsaCode.Substring(0, 3).ToUpper();

            // 1. Find the FSA record
            // We use the Index on 'Code' here for speed
            var fsaRecord = await _context.Fsas
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Code == cleanFsa);

            if (fsaRecord == null) return null;

            // 2. Fetch the City and Include the Province details
            var city = await _context.Cities
                .AsNoTracking()
                .Include(c => c.Province) // Join Province table
                .FirstOrDefaultAsync(c => c.Id == fsaRecord.CityId);

            return city;
        }

        public async Task<IEnumerable<Province>> GetAllProvincesAsync()
        {
            return await _context.Provinces
                .AsNoTracking()
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<City>> GetCitiesByProvinceIdAsync(int provinceId)
        {
            return await _context.Cities
                .AsNoTracking()
                .Where(c => c.ProvinceId == provinceId)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<bool> IsValidFsaAsync(string fsaCode)
        {
            if (string.IsNullOrWhiteSpace(fsaCode) || fsaCode.Length < 3)
                return false;

            string cleanFsa = fsaCode.Substring(0, 3).ToUpper();

            return await _context.Fsas
                .AnyAsync(f => f.Code == cleanFsa);
        }
        public async Task<LatLng?> getLatLongFromFSAAsync(string fsaCode)
        {
            if (await IsValidFsaAsync(fsaCode) == false) return null;

            var city = await GetCityByFsaAsync(fsaCode);

            return new LatLng(city.Latitude, city.Longitude);
        }
    }
}