using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.Models;
using backend.Contracts;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.DTOs.Search;

[ApiController]
[Route("api/search")]
public class ListingSearchController : ControllerBase
{
    private readonly IListingSearchService _listingSearchService;
    private readonly IFileStorageService _minio;
    private readonly AppDbContext _db;

    public ListingSearchController(
        IListingSearchService listingSearchService,
        AppDbContext db,
        IFileStorageService minio)
    {
        _listingSearchService = listingSearchService;
        _db = db;
        _minio = minio;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchListings([FromQuery] SearchRequestDto request)
    {
        // 1. Sanitize input and cap the limit
        var cappedLimit = Math.Min(request.PageSize > 0 ? request.PageSize : 18, 50);
        var searchTerms = request.Query ?? string.Empty;

        // 2. Seller-scoped listing feed (Postgres) or Meilisearch search
        IReadOnlyList<ListingWithImagesDto> items;
        string? nextCursor;
        bool hasNextPage;

        if (request.SellerId.HasValue)
        {
            (items, nextCursor, hasNextPage) = await SearchListingsBySellerAsync(
                request.SellerId.Value,
                cappedLimit,
                request.Cursor);
        }
        else
        {
            (items, nextCursor, hasNextPage) = await _listingSearchService.SearchListingsAsync(
                searchTerms,
                cappedLimit,
                request.Cursor,
                request.Category,
                request.Condition,
                request.Colour,
                request.Size,
                request.Brand,
                request.MinPrice,
                request.MaxPrice,
                request.Lat,
                request.Lng,
                request.RadiusKm);
        }

        // 3. Extract IDs for batch hydration
        var listingIds = items.Select(i => i.Listing.Id).ToList();
        var profileIds = items.Select(i => i.Listing.ProfileId).Distinct().ToList();

        // 4. Batch Query Profiles and Images
        var profiles = await _db.Profiles.AsNoTracking()
            .Where(p => profileIds.Contains(p.Id))
            .ToListAsync();

        var images = await _db.ListingImages.AsNoTracking()
            .Where(li => listingIds.Contains(li.ListingId))
            .OrderBy(li => li.DisplayOrder)
            .ToListAsync();

        // 5. Group images by ListingId for O(1) lookup in the loop
        var imagesByListing = images.ToLookup(img => img.ListingId);

        // 6. Map to the final result
        var mapped = items.Select(l =>
        {
            var seller = profiles.FirstOrDefault(p => p.Id == l.Listing.ProfileId);

            var listingImages = imagesByListing[l.Listing.Id].Select(img => new
            {
                img.Id,
                imageUrl = _minio.GetPublicFileUrl(img.ImagePath),
                img.DisplayOrder,
                img.ForTryon
            }).ToList();

            return new
            {
                l.Listing.Id,
                l.Listing.Title,
                l.Listing.Description,
                l.Listing.Price,
                l.Listing.Size,
                l.Listing.Brand,
                l.Listing.Category,
                l.Listing.Colour,
                l.Listing.Condition,
                l.Listing.FSA,
                createdAt = l.Listing.CreatedAt,
                seller = seller == null ? null : new
                {
                    seller.Id,
                    seller.FirstName,
                    seller.LastName,
                    seller.VerifiedSeller,
                    seller.Rating,
                    seller.Bio,
                    profileImageUrl = _minio.GetPublicFileUrl(seller.ProfileImagePath),
                    bannerImageUrl = _minio.GetPublicFileUrl(seller.BannerImagePath),
                    seller.CreatedAt
                },
                images = listingImages
            };
        }).ToList();

        return Ok(new
        {
            items = mapped,
            limit = cappedLimit,
            nextCursor,
            hasNextPage
        });
    }

    /// <summary>
    /// Paginates listings for a seller profile from Postgres (same offset cursor semantics as Meilisearch search).
    /// </summary>
    private async Task<(IReadOnlyList<ListingWithImagesDto> Items, string? NextCursor, bool HasNextPage)> SearchListingsBySellerAsync(
        Guid sellerId,
        int pageSize,
        string? cursor)
    {
        var offset = 0;
        if (int.TryParse(cursor, out var decodedOffset))
            offset = decodedOffset;

        var query = _db.Listings
            .AsNoTracking()
            .Where(l => l.ProfileId == sellerId)
            .OrderByDescending(l => l.CreatedAt);

        var pageListings = await query
            .Skip(offset)
            .Take(pageSize + 1)
            .ToListAsync();

        var hasNextPage = pageListings.Count > pageSize;
        var pageHits = pageListings.Take(pageSize).ToList();

        // Images are hydrated in the shared mapping path via batch query on ListingImages.
        var resultDtos = pageHits
            .Select(l => new ListingWithImagesDto { Listing = l, Images = Array.Empty<ListingImageDto>() })
            .ToList();

        var nextCursor = hasNextPage ? (offset + pageSize).ToString() : null;
        return (resultDtos, nextCursor, hasNextPage);
    }

    [HttpGet("listing/{id:guid}")]
    public async Task<IActionResult> GetListing([FromRoute] Guid id)
    {
        var listing = await _db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        if (listing == null) return NotFound();

        var seller = await _db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == listing.ProfileId);
        var images = await _db.ListingImages.AsNoTracking()
            .Where(li => li.ListingId == listing.Id)
            .OrderBy(li => li.DisplayOrder)
            .ToListAsync();

        var mapped = new
        {
            listing.Id,
            listing.Title,
            listing.Description,
            listing.Price,
            listing.FSA,
            listing.Category,
            listing.Brand,
            listing.Condition,
            listing.Size,
            listing.Colour,
            createdAt = listing.CreatedAt,
            seller = seller == null ? null : new
            {
                seller.Id,
                seller.FirstName,
                seller.LastName,
                seller.Rating,
                profileImageUrl = _minio.GetPublicFileUrl(seller.ProfileImagePath),
                bannerImageUrl = _minio.GetPublicFileUrl(seller.BannerImagePath),
                seller.CreatedAt
            },
            images = images.Select(img => new
            {
                img.Id,
                imageUrl = _minio.GetPublicFileUrl(img.ImagePath),
                img.DisplayOrder
            })
        };

        return Ok(mapped);
    }
}

// [ApiController]
// [Route("api/catalog")]
// public class CatalogController : ControllerBase
// {
//     private readonly AppDbContext _db;
//     private readonly IFileStorageService _minio;

//     public CatalogController(AppDbContext db, IFileStorageService minio)
//     {
//         _db = db;
//         _minio = minio;
//     }

//     [HttpGet("items")]
//     public async Task<IActionResult> GetItems(
//         [FromQuery] decimal? minPrice = null,
//         [FromQuery] decimal? maxPrice = null)
//     {
//         var query = _db.Listings.AsNoTracking();

//         if (minPrice.HasValue) query = query.Where(l => l.Price >= minPrice.Value);
//         if (maxPrice.HasValue) query = query.Where(l => l.Price <= maxPrice.Value);

//         var items = await query
//             .OrderByDescending(l => l.CreatedAt)
//             .Select(l => new
//             {
//                 Listing = l,
//                 Profile = _db.Profiles.AsNoTracking().FirstOrDefault(p => p.Id == l.ProfileId),
//                 Image = _db.ListingImages.AsNoTracking()
//                     .Where(li => li.ListingId == l.Id)
//                     .OrderBy(li => li.DisplayOrder)
//                     .FirstOrDefault()
//             })
//             .ToListAsync();

//         var result = items.Select(item => new
//         {
//             item.Listing.Id,
//             item.Listing.Title,
//             item.Listing.Description,
//             item.Listing.Price,
//             // Fallback to a placeholder if no image exists
//             imageUrl = _minio.GetPublicFileUrl(item.Image?.ImagePath) ?? "https://images.pexels.com/photos/29562692/pexels-photo-29562692.jpeg?_gl=1*1tn66e8*_ga*MTg0MzQ2NDU3Mi4xNzcxMTcxODUx*_ga_8JE65Q40S6*czE3NzExNzE4NTEkbzEkZzEkdDE3NzExNzE4NTgkajUzJGwwJGgw",
//             item.Listing.CreatedAt,
//             sellerName = $"{item.Profile?.FirstName} {item.Profile?.LastName}"
//         });

//         return Ok(result);
//     }
// }