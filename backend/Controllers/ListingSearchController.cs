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
        var cappedLimit = Math.Min(limit, 50); // Cap at 50
        var (items, nextCursor, hasNextPage) = await _listingSearchService.SearchListingsAsync(q ?? string.Empty, cappedLimit, cursor);

        var response = new SearchResponseDto
        {
            Items = items,
            NextCursor = nextCursor,
            HasNextPage = hasNextPage
        };

        return Ok(response);
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
            .ToListAsync();

        // Get MinIO configuration
        var minioEndpoint = _configuration["MINIO_ENDPOINT"] ?? "minio:9000";
        var minioBucket = _configuration["MINIO_PUBLIC_BUCKET"] ?? "public";
        var minioUrl = $"http://{minioEndpoint}/{minioBucket}";

        // Map -> DTO with image information
        var result = new List<object>();
        foreach (var item in items)
        {
            var profile = await _db.Profiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == item.ProfileId);

            var image = await _db.ListingImages
                .AsNoTracking()
                .Where(li => li.ListingId == item.Id)
                .OrderBy(li => li.DisplayOrder)
                .FirstOrDefaultAsync();

            var imageUrl = image?.ImagePath != null
                ? $"{minioUrl}/{image.ImagePath}"
                : "/images/clothes_login_page.png";

            result.Add(new
            {
                item.Id,
                item.Title,
                item.Description,
                item.Price,
                imageUrl,
                item.CreatedAt,
                sellerName = profile?.FirstName + " " + profile?.LastName
            });
        }

        return Ok(result);
    }
}
