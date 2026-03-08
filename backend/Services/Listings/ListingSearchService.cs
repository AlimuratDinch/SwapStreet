using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs;
using backend.DTOs.Search;
using Meilisearch;

namespace backend.Services;

public class ListingSearchService : IListingSearchService
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _imageService;
    private readonly MeilisearchClient _meiliClient;

    public ListingSearchService(AppDbContext db, IFileStorageService imageService, MeilisearchClient meiliClient)
    {
        _db = db;
        _imageService = imageService;
        _meiliClient = meiliClient;
    }

    public async Task<(IReadOnlyList<ListingWithImagesDto> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
        string? query,
        int pageSize,
        string? cursor)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var index = _meiliClient.Index("listings");

        int offset = 0;
        if (int.TryParse(cursor, out var decodedOffset))
        {
            offset = decodedOffset;
        }

        var searchOptions = new SearchQuery
        {
            Limit = pageSize + 1,
            Offset = offset,
            // If query is null/empty, Meilisearch returns all documents based on Ranking Rules (Recent first)
            Sort = string.IsNullOrWhiteSpace(query)
                ? new[] { "createdAtTimestamp:desc" }
                : null
        };

        // 2. Execute Search in Meilisearch
        var searchResponse = await index.SearchAsync<ListingSearchDto>(query ?? "", searchOptions);

        var hits = searchResponse.Hits.ToList();
        var hasNextPage = hits.Count > pageSize;
        var pageHits = hits.Take(pageSize).ToList();

        // 3. Fetch Full Data from Postgres based on Search IDs
        var listingIds = pageHits.Select(h => Guid.Parse(h.Id)).ToList();

        // Use ToDictionary to preserve the order returned by Meilisearch
        var listingsMap = await _db.Listings
            .AsNoTracking()
            .Include(l => l.Tag)
            .Include(l => l.Profile)
            .Where(l => listingIds.Contains(l.Id))
            .ToDictionaryAsync(l => l.Id);

        // 4. Map to DTOs and attach images
        var resultDtos = new List<ListingWithImagesDto>();
        foreach (var hit in pageHits)
        {
            if (listingsMap.TryGetValue(Guid.Parse(hit.Id), out var listing))
            {
                resultDtos.Add(await MapListingWithImagesAsync(listing));
            }
        }

        // 5. Generate Next Cursor (using offset for simplicity, or stick to your encoding)
        string? nextCursor = hasNextPage ? (offset + pageSize).ToString() : null;

        return (resultDtos, nextCursor, hasNextPage);
    }

    private async Task<ListingWithImagesDto> MapListingWithImagesAsync(Listing listing)
    {
        var images = await _db.ListingImages
            .AsNoTracking()
            .Where(li => li.ListingId == listing.Id)
            .OrderBy(li => li.DisplayOrder)
            .Select(li => new ListingImageDto
            {
                ImageUrl = _imageService.GetPublicFileUrl(li.ImagePath),
                DisplayOrder = li.DisplayOrder
            })
            .ToListAsync();

        return new ListingWithImagesDto
        {
            Listing = listing,
            Images = images
        };
    }
}