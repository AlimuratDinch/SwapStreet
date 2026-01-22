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
        /// <param name="dto">The listing creation request with optional images</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>The created listing ID</returns>
        [Authorize]
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create(
            [FromForm] CreateListingRequestDto dto,
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

            // Ensure user is verified
            var isEmailConfirmedClaim = User.FindFirst("isEmailConfirmed")?.Value;
            bool isEmailConfirmed = bool.TryParse(isEmailConfirmedClaim, out var result) && result;
            if (!isEmailConfirmed) return BadRequest("Not Verified");

            try
            {
                var listingId = await _listingCommandService.CreateListingAsync(dto, cancellationToken);

                _logger.LogInformation(
                    "Listing created successfully: Id={ListingId}, Title={Title}, ProfileId={ProfileId}, FSA={FSA}",
                    listingId,
                    dto.Title,
                    dto.ProfileId,
                    dto.FSA
                    );

                return CreatedAtAction(
                    nameof(Create),
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
