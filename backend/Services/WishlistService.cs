// using Microsoft.EntityFrameworkCore;
// using backend.DbContexts;
// using backend.Models;

// namespace backend.Services
// {
//     public interface IWishlistService
//     {
//         Task<List<int>> GetWishlistAsync(Guid userId);
//         Task AddToWishlistAsync(Guid userId, int itemId);
//         Task RemoveFromWishlistAsync(Guid userId, int itemId);
//     }

//     public class WishlistService : IWishlistService
//     {
//         private readonly AppDbContext _context;

//         public WishlistService(AppDbContext context)
//         {
//             _context = context;
//         }

//         public async Task<List<int>> GetWishlistAsync(Guid userId)
//         {
//             return await _context.Wishlists
//                 .Where(w => w.UserId == userId)
//                 .Select(w => w.ItemId)
//                 .ToListAsync();
//         }

//         public async Task AddToWishlistAsync(Guid userId, int itemId)
//         {
//             var exists = await _context.Wishlists
//                 .AnyAsync(w => w.UserId == userId && w.ItemId == itemId);

//             if (!exists)
//             {
//                 _context.Wishlists.Add(new Wishlist
//                 {
//                     UserId = userId,
//                     ItemId = itemId
//                 });
//                 await _context.SaveChangesAsync();
//             }
//         }

//         public async Task RemoveFromWishlistAsync(Guid userId, int itemId)
//         {
//             var item = await _context.Wishlists
//                 .FirstOrDefaultAsync(w => w.UserId == userId && w.ItemId == itemId);

//             if (item != null)
//             {
//                 _context.Wishlists.Remove(item);
//                 await _context.SaveChangesAsync();
//             }
//         }
//     }
// }