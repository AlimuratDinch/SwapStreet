using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.Models;
using backend.Contracts;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;

[ApiController]
[Route("api/search")]
public class ListingSearchController : ControllerBase
{
    private readonly IListingSearchService _listingSearchService;

    public ListingSearchController(IListingSearchService listingSearchService)
    {
        _listingSearchService = listingSearchService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchListings(
        [FromQuery] string? q,
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20)
    {
        var (items, nextCursor, hasNextPage) = await _listingSearchService.SearchListingsAsync(q ?? string.Empty, Math.Min(limit, 50), cursor);  // Cap at 50

        return Ok(new
        {
            items,
            limit,
            nextCursor,
            hasNextPage
        });
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
        [FromQuery] string? conditions = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        // Validate and cap pagination parameters
        page = Math.Max(1, page);
        limit = Math.Min(Math.Max(1, limit), 50); // Cap at 50 items per page

        var query = _db.Listings.AsNoTracking();

        // Price filtering in database
        if (minPrice.HasValue)
            query = query.Where(l => l.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(l => l.Price <= maxPrice.Value);

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Order and paginate in database
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Include(l => l.Profile)
            .Include(l => l.ListingImages)
            .Select(l => new
            {
                Listing = l,
                Profile = l.Profile,
                Image = l.ListingImages
                    .OrderBy(li => li.DisplayOrder)
                    .FirstOrDefault()
            })
            .ToListAsync();

        // Get MinIO configuration
        var minioEndpoint = _configuration["MINIO_ENDPOINT"] ?? "minio:9000";
        var minioBucket = _configuration["MINIO_PUBLIC_BUCKET"] ?? "public";
        var minioUrl = $"http://{minioEndpoint}/{minioBucket}";

        // Map to DTO with image information
        var result = items.Select(item =>
        {
            var imageUrl = item.Image?.ImagePath != null
                ? $"{minioUrl}/{item.Image.ImagePath}"
                : "/images/clothes_login_page.png";

            return new
            {
                item.Listing.Id,
                item.Listing.Title,
                item.Listing.Description,
                item.Listing.Price,
                imageUrl,
                item.Listing.CreatedAt,
                sellerName = item.Profile != null 
                    ? $"{item.Profile.FirstName} {item.Profile.LastName}" 
                    : "Unknown"
            };
        }).ToList();

        return Ok(new
        {
            items = result,
            pagination = new
            {
                page,
                limit,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)limit),
                hasNextPage = page < Math.Ceiling(totalCount / (double)limit)
            }
        });
    }
}
