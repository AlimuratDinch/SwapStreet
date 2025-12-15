using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.DTOs;

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
    }
}