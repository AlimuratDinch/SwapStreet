using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using backend.Data;
using backend.Models;
using backend.DbContexts;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/locationFilter")]
    public class LocationFilterController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationFilterController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Listing>>> GetListingsInRadius(
            [FromQuery] double userLat,
            [FromQuery] double userLon,
            [FromQuery] double radiusKm)
        {
            var userPoint = new Point(userLon, userLat) { SRID = 4326 };

            var radiusMeters = radiusKm * 1000;

            var listings = await _context.Listings
                .Include(l => l.FSA)
                .Where(l => l.FSA != null &&
                            l.FSA.Centroid != null &&
                            l.FSA.Centroid.Distance(userPoint) <= radiusMeters)
                .ToListAsync();

            return Ok(listings);
        }
    }
}