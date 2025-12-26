using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.DTOs.Profile;
using System.Security.Claims;
using System.Linq;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        /// <summary>
        /// Get the authenticated user's profile
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            var profile = await _profileService.GetProfileByUserIdAsync(userId);
            if (profile == null)
            {
                return NotFound(new { Error = "Profile not found" });
            }

            return Ok(profile);
        }

        /// <summary>
        /// Get any user's profile by their user ID (public endpoint)
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfileByUserId(Guid userId)
        {
            var profile = await _profileService.GetProfileByUserIdAsync(userId);
            if (profile == null)
            {
                return NotFound(new { Error = "Profile not found" });
            }

            return Ok(profile);
        }

        /// <summary>
        /// Create a profile for the authenticated user
        /// </summary>
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateProfile([FromBody] CreateProfileDto dto)
        {
            // Log received data for debugging
            Console.WriteLine($"Received CreateProfileDto: FirstName={dto?.FirstName}, LastName={dto?.LastName}, CityId={dto?.CityId}, FSA={dto?.FSA}");

            if (dto == null)
            {
                return BadRequest(new { Error = "Request body is required" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                    .ToList();

                Console.WriteLine($"ModelState validation errors: {string.Join("; ", errors)}");
                return BadRequest(new { Error = string.Join("; ", errors) });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            try
            {
                var profile = await _profileService.CreateProfileAsync(userId, dto);
                return CreatedAtAction(nameof(GetMyProfile), new { userId = profile.Id }, profile);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Update the authenticated user's profile
        /// </summary>
        [Authorize]
        [HttpPatch]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            try
            {
                var profile = await _profileService.UpdateProfileAsync(userId, dto);
                return Ok(profile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Delete the authenticated user's profile
        /// </summary>
        [Authorize]
        [HttpDelete]
        public async Task<IActionResult> DeleteProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            var result = await _profileService.DeleteProfileAsync(userId);
            if (!result)
            {
                return NotFound(new { Error = "Profile not found" });
            }

            return Ok(new { Message = "Profile deleted successfully" });
        }

        /// <summary>
        /// Check if the authenticated user has a profile
        /// </summary>
        [Authorize]
        [HttpGet("exists")]
        public async Task<IActionResult> CheckProfileExists()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            var exists = await _profileService.ProfileExistsAsync(userId);
            return Ok(new { Exists = exists });
        }
    }
}
