using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Contracts;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/wishlist")]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;
        private readonly IProfileService _profileService;

        public WishlistController(IWishlistService wishlistService, IProfileService profileService)
        {
            _wishlistService = wishlistService;
            _profileService = profileService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMyWishlist()
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized(new { error = "Invalid token" });
            }

            if (!await _profileService.ProfileExistsAsync(userId))
            {
                return NotFound(new { error = "Profile not found" });
            }

            var list = await _wishlistService.GetWishlistAsync(userId);
            return Ok(list);
        }

        [Authorize]
        [HttpPost("{listingId:guid}")]
        public async Task<IActionResult> AddToWishlist(Guid listingId)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized(new { error = "Invalid token" });
            }

            if (!await _profileService.ProfileExistsAsync(userId))
            {
                return NotFound(new { error = "Profile not found" });
            }

            var result = await _wishlistService.AddToWishlistAsync(userId, listingId);

            return result switch
            {
                WishlistAddResult.Added => Ok(new { added = true }),
                WishlistAddResult.AlreadyExists => Ok(new { added = false }),
                WishlistAddResult.ListingNotFound => NotFound(new { error = "Listing not found" }),
                _ => StatusCode(500, new { error = "Unable to add to wishlist" })
            };
        }

        [Authorize]
        [HttpDelete("{listingId:guid}")]
        public async Task<IActionResult> RemoveFromWishlist(Guid listingId)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized(new { error = "Invalid token" });
            }

            if (!await _profileService.ProfileExistsAsync(userId))
            {
                return NotFound(new { error = "Profile not found" });
            }

            var result = await _wishlistService.RemoveFromWishlistAsync(userId, listingId);

            return result switch
            {
                WishlistRemoveResult.Removed => NoContent(),
                WishlistRemoveResult.NotFound => NotFound(new { error = "Wishlist item not found" }),
                _ => StatusCode(500, new { error = "Unable to remove from wishlist" })
            };
        }

        private bool TryGetUserId(out Guid userId)
        {
            userId = Guid.Empty;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return !string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out userId);
        }
    }
}
