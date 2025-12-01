// using Microsoft.AspNetCore.Mvc;
// using System;
// using System.Threading.Tasks;
// using backend.Services;

// namespace backend.Controllers
// {
//     [ApiController]
//     [Route("api/[controller]")]
//     public class WishlistController : ControllerBase
//     {
//         private readonly IWishlistService _wishlistService;

//         public WishlistController(IWishlistService wishlistService)
//         {
//             _wishlistService = wishlistService;
//         }

//         // GET: api/wishlist/{userId}
//         [HttpGet("{userId}")]
//         public async Task<IActionResult> GetWishlist(Guid userId)
//         {
//             var list = await _wishlistService.GetWishlistAsync(userId);
//             return Ok(list);
//         }

//         // POST: api/wishlist/{userId}/{itemId}
//         [HttpPost("{userId}/{itemId}")]
//         public async Task<IActionResult> AddToWishlist(Guid userId, int itemId)
//         {
//             await _wishlistService.AddToWishlistAsync(userId, itemId);
//             return Ok();
//         }

//         // DELETE: api/wishlist/{userId}/{itemId}
//         [HttpDelete("{userId}/{itemId}")]
//         public async Task<IActionResult> RemoveFromWishlist(Guid userId, int itemId)
//         {
//             await _wishlistService.RemoveFromWishlistAsync(userId, itemId);
//             return NoContent();
//         }
//     }
// }