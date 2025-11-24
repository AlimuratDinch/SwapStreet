using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/location")]
    public class LocationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all provinces
        /// </summary>
        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            var provinces = await _context.Provinces
                .OrderBy(p => p.Name)
                .Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    code = p.Code
                })
                .ToListAsync();

            return Ok(provinces);
        }

        /// <summary>
        /// Get all cities, optionally filtered by province
        /// </summary>
        [HttpGet("cities")]
        public async Task<IActionResult> GetCities([FromQuery] int? provinceId)
        {
            var query = _context.Cities.Include(c => c.Province).AsQueryable();

            if (provinceId.HasValue)
            {
                query = query.Where(c => c.ProvinceId == provinceId.Value);
            }

            var cities = await query
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    provinceId = c.ProvinceId,
                    province = new
                    {
                        id = c.Province!.Id,
                        name = c.Province.Name,
                        code = c.Province.Code
                    }
                })
                .ToListAsync();

            return Ok(cities);
        }

        /// <summary>
        /// Get a specific city by ID
        /// </summary>
        [HttpGet("cities/{id}")]
        public async Task<IActionResult> GetCityById(int id)
        {
            var city = await _context.Cities
                .Include(c => c.Province)
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    provinceId = c.ProvinceId,
                    province = new
                    {
                        id = c.Province!.Id,
                        name = c.Province.Name,
                        code = c.Province.Code
                    }
                })
                .FirstOrDefaultAsync();

            if (city == null)
            {
                return NotFound(new { Error = "City not found" });
            }

            return Ok(city);
        }
    }
}
