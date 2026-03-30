using backend.DTOs.Listings;

namespace backend.Contracts
{
    using backend.DTOs.Search;

    public interface IListingSearchService
    {
        Task<(IReadOnlyList<ListingWithImagesDto> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
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
            double? radiusKm = null
        );
    }
}