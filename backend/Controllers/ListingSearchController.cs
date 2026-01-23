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
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public ListingSearchController(IListingSearchService listingSearchService, AppDbContext db, IConfiguration configuration)
    {
        _listingSearchService = listingSearchService;
        _db = db;
        _configuration = configuration;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchListings(
        [FromQuery] string? q,
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 18)
    {
        var cappedLimit = Math.Min(limit, 50); // Cap at 50
        var (items, nextCursor, hasNextPage) = await _listingSearchService.SearchListingsAsync(q ?? string.Empty, cappedLimit, cursor);

        // Build MinIO base URL from configuration
        var minioEndpoint = _configuration["MINIO_ENDPOINT"] ?? "minio:9000";
        var minioBucket = _configuration["MINIO_PUBLIC_BUCKET"] ?? "public";
        var minioUrl = $"http://{minioEndpoint}/{minioBucket}";

        var listingIds = items.Select(i => i.Listing.Id).ToList();
        var profileIds = items.Select(i => i.Listing.ProfileId).Distinct().ToList();

        var profiles = await _db.Profiles.AsNoTracking()
            .Where(p => profileIds.Contains(p.Id))
            .ToListAsync();

        var images = await _db.ListingImages.AsNoTracking()
            .Where(li => listingIds.Contains(li.ListingId))
            .OrderBy(li => li.DisplayOrder)
            .ToListAsync();

        // Group images by listing id
        var imagesByListing = images.GroupBy(i => i.ListingId)
            .ToDictionary(g => g.Key, g => g.Select(img => new
            {
                img.Id,
                imageUrl = img.ImagePath != null ? $"{minioUrl}/{img.ImagePath}" : null,
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
                    seller.CityId,
                    seller.FSA,
                    profileImageUrl = seller.ProfileImagePath != null ? $"{minioUrl}/{seller.ProfileImagePath}" : null,
                    bannerImageUrl = seller.BannerImagePath != null ? $"{minioUrl}/{seller.BannerImagePath}" : null,
                    seller.CreatedAt,
                    seller.UpdatedAt
                },
                images = imgs?.Cast<object>().ToList() ?? new List<object>()
            };
        }).ToList();

        return Ok(new
        {
            items = mapped,
            limit,
            nextCursor,
            hasNextPage
        });
    }

    [HttpGet("listing/{id:guid}")]
    public async Task<IActionResult> GetListing([FromRoute] Guid id)
    {
        // Build MinIO base URL from configuration
        var minioEndpoint = _configuration["MINIO_ENDPOINT"] ?? "minio:9000";
        var minioBucket = _configuration["MINIO_PUBLIC_BUCKET"] ?? "public";
        var minioUrl = $"http://{minioEndpoint}/{minioBucket}";

        var listing = await _db.Listings.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null) return NotFound();

        var seller = await _db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == listing.ProfileId);

        var images = await _db.ListingImages.AsNoTracking()
            .Where(li => li.ListingId == listing.Id)
            .OrderBy(li => li.DisplayOrder)
            .Select(img => new
            {
                img.Id,
                imageUrl = img.ImagePath != null ? $"{minioUrl}/{img.ImagePath}" : null,
                img.DisplayOrder,
                img.ForTryon
            })
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
                seller.VerifiedSeller,
                seller.Rating,
                seller.Bio,
                seller.CityId,
                seller.FSA,
                profileImageUrl = seller.ProfileImagePath != null ? $"{minioUrl}/{seller.ProfileImagePath}" : null,
                bannerImageUrl = seller.BannerImagePath != null ? $"{minioUrl}/{seller.BannerImagePath}" : null,
                seller.CreatedAt,
                seller.UpdatedAt
            },
            images = images.Cast<object>().ToList()
        };

        return Ok(mapped);
    }
}

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public CatalogController(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems(
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] string? conditions = null)
    {
        var query = _db.Listings.AsNoTracking();

        // Price filtering
        if (minPrice.HasValue)
            query = query.Where(l => l.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(l => l.Price <= maxPrice.Value);

        // Order by most recent and take all
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                Listing = l,
                Profile = _db.Profiles.AsNoTracking()
                    .FirstOrDefault(p => p.Id == l.ProfileId),
                Image = _db.ListingImages.AsNoTracking()
                    .Where(li => li.ListingId == l.Id)
                    .OrderBy(li => li.DisplayOrder)
                    .FirstOrDefault()
            })
            .ToListAsync();

        // Get MinIO configuration
        var minioEndpoint = _configuration["MINIO_ENDPOINT"] ?? "minio:9000";
        var minioBucket = _configuration["MINIO_PUBLIC_BUCKET"] ?? "public";
        var minioUrl = $"http://{minioEndpoint}/{minioBucket}";

        // Map -> DTO with image information
        var result = new List<object>();
        foreach (var item in items)
        {
            var profile = item.Profile;

            var image = item.Image;

            var imageUrl = image?.ImagePath != null
                ? $"{minioUrl}/{image.ImagePath}"
                : "/images/clothes_login_page.png";

            result.Add(new
            {
                item.Listing.Id,
                item.Listing.Title,
                item.Listing.Description,
                item.Listing.Price,
                imageUrl,
                item.Listing.CreatedAt,
                sellerName = profile?.FirstName + " " + profile?.LastName
            });
        }

        return Ok(result);
    }
}
