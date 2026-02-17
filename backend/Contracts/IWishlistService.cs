using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Contracts
{
    public enum WishlistAddResult
    {
        Added,
        AlreadyExists,
        ListingNotFound
    }

    public enum WishlistRemoveResult
    {
        Removed,
        NotFound
    }

    public interface IWishlistService
    {
        Task<IReadOnlyList<Guid>> GetWishlistAsync(Guid profileId);
        Task<WishlistAddResult> AddToWishlistAsync(Guid profileId, Guid listingId);
        Task<WishlistRemoveResult> RemoveFromWishlistAsync(Guid profileId, Guid listingId);
    }
}
