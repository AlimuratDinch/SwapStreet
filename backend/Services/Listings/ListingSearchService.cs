using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs;
using backend.DTOs.Search;
using backend.Models;
using Meilisearch;
using System.Globalization;

namespace backend.Services;

public class ListingSearchService : IListingSearchService
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _imageService;
    private readonly MeilisearchClient _meiliClient;
    private readonly ILocationService _locationService;

    public ListingSearchService(AppDbContext db, IFileStorageService imageService, MeilisearchClient meiliClient, ILocationService locationService)
    {
        _db = db;
        _imageService = imageService;
        _meiliClient = meiliClient;
        _locationService = locationService;
    }

    public async Task<(IReadOnlyList<ListingWithImagesDto> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
        string? query,
        int pageSize,
        string? cursor,
        string? category = null,
        string? condition = null,
        string? colour = null,
        string? size = null,
        string? brand = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        double? lat = null,
        double? lng = null,
        double? radiusKm = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var index = _meiliClient.Index("listings");

        int offset = 0;
        if (int.TryParse(cursor, out var decodedOffset))
            offset = decodedOffset;

        // Build filter string for Meilisearch
        var filters = new List<string>();

        if (!string.IsNullOrWhiteSpace(colour))
            filters.Add($"colour = \"{colour}\"");

        if (!string.IsNullOrWhiteSpace(category))
            filters.Add($"category = \"{category}\"");

        if (!string.IsNullOrWhiteSpace(condition))
            filters.Add($"condition = \"{condition}\"");

        if (!string.IsNullOrWhiteSpace(size))
            filters.Add($"size = \"{size}\"");

        if (!string.IsNullOrWhiteSpace(brand))
            filters.Add($"brand = \"{brand}\"");

        if (minPrice.HasValue && maxPrice.HasValue && minPrice > maxPrice)
            (minPrice, maxPrice) = (maxPrice, minPrice);

        if (minPrice.HasValue)
            filters.Add($"price >= {minPrice.Value.ToString(CultureInfo.InvariantCulture)}");

        if (maxPrice.HasValue)
            filters.Add($"price <= {maxPrice.Value.ToString(CultureInfo.InvariantCulture)}");

        // Location filter using Meilisearch geo filtering
        if (lat.HasValue && lng.HasValue && radiusKm.HasValue)
            filters.Add($"_geoRadius({lat.Value}, {lng.Value}, {radiusKm.Value * 1000})");

        var searchOptions = new SearchQuery
        {
            Limit = offset + pageSize + 1,
            Offset = 0,
            Filter = filters.Count > 0 ? string.Join(" AND ", filters) : null,
            Sort = string.IsNullOrWhiteSpace(query)
                ? new[] { "createdAtTimestamp:desc" }
                : null
        };



        var searchResponse = await index.SearchAsync<ListingSearchDto>(query ?? "", searchOptions);

        var listingHits = searchResponse.Hits.ToList();

        // Get listing IDs from Meilisearch results
        var meilisearchListingIds = listingHits.Select(h => Guid.Parse(h.Id)).ToHashSet();

        // Search for users matching the query (FirstName, LastName, or Full Name)
        var userListingIds = new HashSet<Guid>();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalizedQuery = query.Trim().ToLower();
            var matchingProfiles = await _db.Profiles
                .AsNoTracking()
                .Where(p => p.FirstName.ToLower().Contains(normalizedQuery) || 
                            p.LastName.ToLower().Contains(normalizedQuery) ||
                            (p.FirstName.ToLower() + " " + p.LastName.ToLower()).Contains(normalizedQuery))
                .Select(p => p.Id)
                .ToListAsync();

            // Get all listings from matching profiles, applying price and other filters
            if (matchingProfiles.Any())
            {
                var userListingsQuery = _db.Listings
                    .AsNoTracking()
                    .Where(l => matchingProfiles.Contains(l.ProfileId));

                // Apply price filters
                if (minPrice.HasValue)
                    userListingsQuery = userListingsQuery.Where(l => l.Price >= minPrice.Value);
                if (maxPrice.HasValue)
                    userListingsQuery = userListingsQuery.Where(l => l.Price <= maxPrice.Value);

                // Apply category filters
                if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<ListingCategory>(category, out var categoryEnum))
                    userListingsQuery = userListingsQuery.Where(l => l.Category == categoryEnum);
                if (!string.IsNullOrWhiteSpace(condition) && Enum.TryParse<ListingCondition>(condition, out var conditionEnum))
                    userListingsQuery = userListingsQuery.Where(l => l.Condition == conditionEnum);
                if (!string.IsNullOrWhiteSpace(colour) && Enum.TryParse<ListingColour>(colour, out var colourEnum))
                    userListingsQuery = userListingsQuery.Where(l => l.Colour == colourEnum);
                if (!string.IsNullOrWhiteSpace(size) && Enum.TryParse<ListingSize>(size, out var sizeEnum))
                    userListingsQuery = userListingsQuery.Where(l => l.Size == sizeEnum);
                if (!string.IsNullOrWhiteSpace(brand) && Enum.TryParse<ListingBrand>(brand, out var brandEnum))
                    userListingsQuery = userListingsQuery.Where(l => l.Brand == brandEnum);

                var userListings = await userListingsQuery.ToListAsync();

                // Apply location filter if provided
                if (lat.HasValue && lng.HasValue && radiusKm.HasValue)
                {
                    userListingIds = await FilterListingsByLocationAsync(userListings, lat.Value, lng.Value, radiusKm.Value);
                }
                else
                {
                    userListingIds = userListings.Select(l => l.Id).ToHashSet();
                }
            }
        }

        // Merge results: combine Meilisearch results with user listings
        var allMatchingListingIds = meilisearchListingIds.Union(userListingIds).ToList();

        // Apply pagination to merged results
        var pagedListingIds = allMatchingListingIds
            .Skip(offset)
            .Take(pageSize + 1)
            .ToList();

        var hasNextPage = pagedListingIds.Count > pageSize;
        var pageListingIds = pagedListingIds.Take(pageSize).ToList();

        // Fetch Full Data from Postgres based on Search IDs
        var listingsMap = await _db.Listings
            .AsNoTracking()
            .Include(l => l.Profile)
            .Where(l => pageListingIds.Contains(l.Id))
            .ToDictionaryAsync(l => l.Id);

        // Map to DTOs and attach images
        var resultDtos = new List<ListingWithImagesDto>();
        foreach (var listingId in pageListingIds)
        {
            if (listingsMap.TryGetValue(listingId, out var listing))
            {
                resultDtos.Add(await MapListingWithImagesAsync(listing));
            }
        }

        // Generate Next Cursor
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

    private async Task<HashSet<Guid>> FilterListingsByLocationAsync(List<Listing> listings, double centerLat, double centerLng, double radiusKm)
    {
        var filteredListingIds = new HashSet<Guid>();

        foreach (var listing in listings)
        {
            // Get coordinates for this listing's FSA
            var coords = await _locationService.getLatLongFromFSAAsync(listing.FSA);
            if (coords == null)
                continue;

            // Calculate distance using Haversine formula
            var distance = CalculateDistance(centerLat, centerLng, coords.lat, coords.lng);

            // If within radius, include the listing
            if (distance <= radiusKm)
            {
                filteredListingIds.Add(listing.Id);
            }
        }

        return filteredListingIds;
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadiusKm = 6371;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    private double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
