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
            string? size = null,
            string? brand = null,
            double? lat = null,
            double? lng = null,
            double? radiusKm = null
        );
    }
}