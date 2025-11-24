using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.Location;
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

        public async Task<IEnumerable<ProvinceDto>> GetAllProvincesAsync()
        {
            return await _context.Provinces
                .OrderBy(p => p.Name)
                .Select(p => new ProvinceDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Code = p.Code
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<CityDto>> GetAllCitiesAsync()
        {
            return await _context.Cities
                .OrderBy(c => c.Name)
                .Select(c => new CityDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ProvinceId = c.ProvinceId
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<CityDto>> GetCitiesByProvinceAsync(int provinceId)
        {
            return await _context.Cities
                .Where(c => c.ProvinceId == provinceId)
                .OrderBy(c => c.Name)
                .Select(c => new CityDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ProvinceId = c.ProvinceId
                })
                .ToListAsync();
        }
    }
}
