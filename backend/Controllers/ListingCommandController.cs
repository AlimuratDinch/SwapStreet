using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/listings")]
    public class ListingCommandController : ControllerBase
    {
        private readonly IListingCommandService _listingCommandService;
        private readonly ILogger<ListingCommandController> _logger;

        public ListingCommandController(
            IListingCommandService listingCommandService, 
            ILogger<ListingCommandController> logger)
        {
            _listingCommandService = listingCommandService;
            _logger = logger;
        }

        /// <summary>
        /// Create a new listing
        /// </summary>
        /// <param name="dto">The listing creation request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The created listing ID</returns>
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateListing(
            [FromBody] CreateListingRequestDto dto, 
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "Received CreateListingRequestDto: Title={Title}, Price={Price}, ProfileId={ProfileId}, FSA={FSA}", 
                dto?.Title, 
                dto?.Price, 
                dto?.ProfileId, 
                dto?.FSA);

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

                _logger.LogWarning("Validation failed for CreateListing: {Errors}", string.Join(", ", errors));
                return BadRequest(new { Error = "Validation failed", Details = errors });
            }

            // Verify the authenticated user owns the profile (optional security check)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                // You might want to verify that the ProfileId belongs to the authenticated user
                // For now, we'll allow any authenticated user to create listings for any profile
                // Implement authorization logic here if needed
            }

            try
            {
                var listingId = await _listingCommandService.CreateListingAsync(dto, cancellationToken);

                _logger.LogInformation(
                    "Listing created successfully: Id={ListingId}, Title={Title}, ProfileId={ProfileId}",
                    listingId,
                    dto.Title,
                    dto.ProfileId);

                return CreatedAtAction(
                    nameof(CreateListing),
                    new { id = listingId },
                    new { Id = listingId, Message = "Listing created successfully" });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument when creating listing: {Message}", ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating listing: {Message}", ex.Message);
                return StatusCode(500, new { Error = "An error occurred while creating the listing" });
            }
        }
    }
}
