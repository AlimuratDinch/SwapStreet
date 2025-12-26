using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/location")]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationsController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [HttpGet("lookup/{fsa}")]
        public async Task<IActionResult> GetLocationByPostal(string fsa)
        {
            var city = await _locationService.GetCityByFsaAsync(fsa);

            if (city == null)
            {
                return NotFound("Postal code not supported or invalid.");
            }

            return Ok(new LocationResponseDto
            {
                City = city.Name,
                Province = city.Province?.Name ?? string.Empty,
                ProvinceCode = city.Province?.Code ?? string.Empty,
                Lat = city.Latitude,
                Lng = city.Longitude
            });
        }

        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            var provinces = await _locationService.GetAllProvincesAsync();
            return Ok(provinces);
        }

        [HttpGet("cities")]
        public async Task<IActionResult> GetCities([FromQuery] int provinceId)
        {
            if (provinceId <= 0)
            {
                return BadRequest(new { Error = "provinceId query parameter is required and must be greater than 0" });
            }

            var cities = await _locationService.GetCitiesByProvinceIdAsync(provinceId);
            return Ok(cities);
        }
    }
}