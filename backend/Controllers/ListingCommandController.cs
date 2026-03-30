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
        /// Delete a listing
        /// </summary>
        /// <param name="listingId">The ID of the listing to delete</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>No content on success</returns>
        [Authorize]
        [HttpDelete("{listingId}")]
        public async Task<IActionResult> Delete(
            Guid listingId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Attempting to delete listing with ID {ListingId}", listingId);

            try
            {
                // Get the profile ID from the authenticated user's claims
                var profileIdClaim = User.FindFirst("ProfileId")?.Value;
                if (string.IsNullOrEmpty(profileIdClaim))
                {
                    _logger.LogWarning("Profile ID not found in claims for user deleting listing {ListingId}", listingId);
                    return BadRequest(new { Error = "Profile ID not found in claims" });
                }

                if (!Guid.TryParse(profileIdClaim, out var profileId))
                {
                    _logger.LogWarning("Invalid Profile ID format in claims for user deleting listing {ListingId}", listingId);
                    return BadRequest(new { Error = "Invalid Profile ID format" });
                }

                await _listingCommandService.DeleteListingAsync(listingId, profileId, cancellationToken);

                _logger.LogInformation("Successfully deleted listing with ID {ListingId}", listingId);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to delete listing with ID {ListingId}: {Message}", listingId, ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting listing with ID {ListingId}: {Message}", listingId, ex.Message);
                return StatusCode(500, new { Error = "An error occurred while deleting the listing. Please try again." });
            }
        }

        /// <summary>
        /// Delete a single image from a listing
        /// </summary>
        /// <param name="listingId">listing ID</param>
        /// <param name="imageId">image ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>No content on success</returns>
        [Authorize]
        [HttpDelete("{listingId}/images/{imageId}")]
        public async Task<IActionResult> DeleteImage(
            Guid listingId,
            Guid imageId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Attempting to delete image {ImageId} from listing {ListingId}", imageId, listingId);

            try
            {
                var profileIdClaim = User.FindFirst("ProfileId")?.Value;
                if (string.IsNullOrEmpty(profileIdClaim))
                {
                    _logger.LogWarning("Profile ID not found in claims for image delete on listing {ListingId}", listingId);
                    return BadRequest(new { Error = "Profile ID not found in claims" });
                }

                if (!Guid.TryParse(profileIdClaim, out var profileId))
                {
                    _logger.LogWarning("Invalid Profile ID format in claims for image delete on listing {ListingId}", listingId);
                    return BadRequest(new { Error = "Invalid Profile ID format" });
                }

                await _listingCommandService.DeleteListingImageAsync(listingId, imageId, profileId, cancellationToken);

                _logger.LogInformation("Successfully deleted image {ImageId} from listing {ListingId}", imageId, listingId);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to delete image {ImageId} from listing {ListingId}: {Message}", imageId, listingId, ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image {ImageId} from listing {ListingId}: {Message}", imageId, listingId, ex.Message);
                return StatusCode(500, new { Error = "An error occurred while deleting the image. Please try again." });
            }
        }

        /// <summary>
        /// Create a new listing with optional images
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
                "Received CreateListingRequestDto: Title={Title}, Price={Price}, Size={Size}, Brand={Brand}, Category={Category}, Condition={Condition}, Colour={Colour}, ProfileId={ProfileId}, FSA={FSA}",
                dto?.Title,
                dto?.Price,
                dto?.Size,
                dto?.Brand,
                dto?.Category,
                dto?.Condition,
                dto?.Colour,
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
                    "Listing created successfully: Id={ListingId}, Title={Title}, Size={Size}, Brand={Brand}, Category={Category}, Condition={Condition}, Colour={Colour}, ProfileId={ProfileId}, FSA={FSA}",
                    listingId,
                    dto.Title,
                    dto.ProfileId,
                    dto.Size,
                    dto.Brand,
                    dto.Category,
                    dto.Colour,
                    dto.Condition,
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

        /// <summary>
        /// Update existing listing
        /// </summary>
        /// <param name="listingId">The ID of listing to update</param>
        /// <param name="dto">listing update request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>No content on success</returns>
        [Authorize]
        [HttpPut("{listingId}")]
        [Consumes("application/json")]
        public async Task<IActionResult> Update(
            Guid listingId,
            [FromBody] UpdateListingRequestDto dto,
            CancellationToken cancellationToken = default)
        {
            _logger.LogDebug(
                "Attempting to update listing with ID {ListingId}: Title={Title}, Price={Price}",
                listingId,
                dto?.Title,
                dto?.Price);

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

                _logger.LogWarning("Validation failed for UpdateListing: {Errors}", string.Join(", ", errors));
                return BadRequest(new { Error = "Validation failed", Details = errors });
            }

            try
            {
                // Get profile ID from the authenticated user
                var profileIdClaim = User.FindFirst("ProfileId")?.Value;
                if (string.IsNullOrEmpty(profileIdClaim))
                {
                    _logger.LogWarning("Profile ID not found in claims for user updating listing {ListingId}", listingId);
                    return BadRequest(new { Error = "Profile ID not found in claims" });
                }

                if (!Guid.TryParse(profileIdClaim, out var profileId))
                {
                    _logger.LogWarning("Invalid Profile ID format in claims for user updating listing {ListingId}", listingId);
                    return BadRequest(new { Error = "Invalid Profile ID format" });
                }

                await _listingCommandService.UpdateListingAsync(listingId, profileId, dto, cancellationToken);

                _logger.LogInformation("Successfully updated listing with ID {ListingId}", listingId);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to update listing with ID {ListingId}: {Message}", listingId, ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating listing with ID {ListingId}: {Message}", listingId, ex.Message);
                return StatusCode(500, new { Error = "An error occurred while updating the listing. Please try again." });
            }
        }
    }
}
