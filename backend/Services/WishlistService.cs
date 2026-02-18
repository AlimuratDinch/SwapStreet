using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;

namespace backend.Services
{
    public class WishlistService : IWishlistService
    {
        private readonly AppDbContext _context;

        public WishlistService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Guid>> GetWishlistAsync(Guid profileId)
        {
            return await _context.WishLists
                .AsNoTracking()
                .Where(w => w.ProfileId == profileId)
                .OrderBy(w => w.DisplayOrder)
                .Select(w => w.ListingId)
                .ToListAsync();
        }

        public async Task<WishlistAddResult> AddToWishlistAsync(Guid profileId, Guid listingId)
        {
            var listingExists = await _context.Listings
                .AsNoTracking()
                .AnyAsync(l => l.Id == listingId);

            if (!listingExists)
            {
                return WishlistAddResult.ListingNotFound;
            }

            var exists = await _context.WishLists
                .AnyAsync(w => w.ProfileId == profileId && w.ListingId == listingId);

            if (exists)
            {
                return WishlistAddResult.AlreadyExists;
            }

            var maxDisplayOrder = await _context.WishLists
                .Where(w => w.ProfileId == profileId)
                .Select(w => (int?)w.DisplayOrder)
                .MaxAsync();

            var item = new WishList
            {
                Id = Guid.NewGuid(),
                ProfileId = profileId,
                ListingId = listingId,
                DisplayOrder = (maxDisplayOrder ?? 0) + 1
            };

            _context.WishLists.Add(item);
            await _context.SaveChangesAsync();

            return WishlistAddResult.Added;
        }

        public async Task<WishlistRemoveResult> RemoveFromWishlistAsync(Guid profileId, Guid listingId)
        {
            var item = await _context.WishLists
                .FirstOrDefaultAsync(w => w.ProfileId == profileId && w.ListingId == listingId);

            if (item == null)
            {
                return WishlistRemoveResult.NotFound;
            }

            _context.WishLists.Remove(item);
            await _context.SaveChangesAsync();

            return WishlistRemoveResult.Removed;
        }
    }
}
