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
    public async Task<IActionResult> SearchListings(
        [FromQuery] string? q,
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 18)
    {
        var cappedLimit = Math.Min(limit, 50);
        var (items, nextCursor, hasNextPage) = await _listingSearchService.SearchListingsAsync(q ?? string.Empty, cappedLimit, cursor);

        var listingIds = items.Select(i => i.Listing.Id).ToList();
        var profileIds = items.Select(i => i.Listing.ProfileId).Distinct().ToList();

        var profiles = await _db.Profiles.AsNoTracking()
            .Where(p => profileIds.Contains(p.Id))
            .ToListAsync();

        var images = await _db.ListingImages.AsNoTracking()
            .Where(li => listingIds.Contains(li.ListingId))
            .OrderBy(li => li.DisplayOrder)
            .ToListAsync();

        // Group images and use _minio service for URLs
        var imagesByListing = images.GroupBy(i => i.ListingId)
            .ToDictionary(g => g.Key, g => g.Select(img => new
            {
                img.Id,
                imageUrl = _minio.GetPublicFileUrl(img.ImagePath),
                img.DisplayOrder,
                img.ForTryon
            }).ToList());

        var mapped = items.Select(l =>
        {
            var seller = profiles.FirstOrDefault(p => p.Id == l.Listing.ProfileId);
            imagesByListing.TryGetValue(l.Listing.Id, out var imgs);

            return new
            {
                l.Listing.Id,
                l.Listing.Title,
                l.Listing.Description,
                l.Listing.Price,
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
                images = imgs?.Cast<object>().ToList() ?? new List<object>()
            };
        }).ToList();

        return Ok(new { items = mapped, limit, nextCursor, hasNextPage });
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
            createdAt = listing.CreatedAt,
            seller = seller == null ? null : new
            {
                seller.Id,
                seller.FirstName,
                seller.LastName,
                profileImageUrl = _minio.GetPublicFileUrl(seller.ProfileImagePath),
                bannerImageUrl = _minio.GetPublicFileUrl(seller.BannerImagePath)
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

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _minio;

    public CatalogController(AppDbContext db, IFileStorageService minio)
    {
        _db = db;
        _minio = minio;
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems(
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null)
    {
        var query = _db.Listings.AsNoTracking();

        if (minPrice.HasValue) query = query.Where(l => l.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(l => l.Price <= maxPrice.Value);

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                Listing = l,
                Profile = _db.Profiles.AsNoTracking().FirstOrDefault(p => p.Id == l.ProfileId),
                Image = _db.ListingImages.AsNoTracking()
                    .Where(li => li.ListingId == l.Id)
                    .OrderBy(li => li.DisplayOrder)
                    .FirstOrDefault()
            })
            .ToListAsync();

        var result = items.Select(item => new
        {
            item.Listing.Id,
            item.Listing.Title,
            item.Listing.Description,
            item.Listing.Price,
            // Fallback to a placeholder if no image exists
            imageUrl = _minio.GetPublicFileUrl(item.Image?.ImagePath) ?? "https://images.pexels.com/photos/29562692/pexels-photo-29562692.jpeg?_gl=1*1tn66e8*_ga*MTg0MzQ2NDU3Mi4xNzcxMTcxODUx*_ga_8JE65Q40S6*czE3NzExNzE4NTEkbzEkZzEkdDE3NzExNzE4NTgkajUzJGwwJGgw",
            item.Listing.CreatedAt,
            sellerName = $"{item.Profile?.FirstName} {item.Profile?.LastName}"
        });

        return Ok(result);
    }
}