using backend.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/sustainability")]
    [Authorize]
    public class SustainabilityTrackerController : ControllerBase
    {
        private readonly ISustainabilityTrackerService _sustainabilityTrackerService;

        public SustainabilityTrackerController(
            ISustainabilityTrackerService sustainabilityTrackerService)
        {
            _sustainabilityTrackerService = sustainabilityTrackerService;
        }

        /// <summary>
        /// Get sustainability metrics from authenticated user.
        /// </summary>
        [HttpGet("data")]
        public async Task<IActionResult> GetUserSustainabilityData()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Cannot fetch data using illegal Id.");
            }

            var data = await _sustainabilityTrackerService.GetSustainabilityData(userId);
            return Ok(data);
        }
        
        /// <summary>
        /// Get sustainability metrics from all users.
        /// </summary>
        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalSustainabilityData()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Cannot fetch data using illegal Id.");
            }

            var data = await _sustainabilityTrackerService.GetGlobalSustainabilityData();
            return Ok(data);
        }

        /// <summary>
        /// Get global sustainability metrics for all users.
        /// </summary>
        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalSustainabilityData()
        {
            var data = await _sustainabilityTrackerService.GetGlobalSustainabilityData();
            return Ok(data);
        }

    }
}