using Microsoft.AspNetCore.Mvc;
using backend.Contracts;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/location")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        /// <summary>
        /// Get all provinces
        /// </summary>
        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            var provinces = await _locationService.GetAllProvincesAsync();
            return Ok(provinces);
        }

        /// <summary>
        /// Get cities filtered by province (required for performance and security)
        /// </summary>
        [HttpGet("cities")]
        public async Task<IActionResult> GetCities([FromQuery] int? provinceId)
        {
            if (!provinceId.HasValue)
            {
                return BadRequest(new { Error = "provinceId query parameter is required" });
            }

            var cities = await _locationService.GetCitiesByProvinceAsync(provinceId.Value);
            return Ok(cities);
        }
    }
}
