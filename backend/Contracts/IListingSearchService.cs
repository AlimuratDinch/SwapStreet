namespace backend.Contracts
{
    using backend.DTOs.Search;

    public interface IListingSearchService
    {
        Task<(IReadOnlyList<ListingWithImagesDto> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
                string query,
                int pageSize,
                string? cursor
            );
    }
}