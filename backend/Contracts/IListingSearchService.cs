using backend.Models;
namespace backend.Contracts
{
    public interface IListingSearchService
    {
        Task<(IReadOnlyList<Listing> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
                string query,
                int pageSize,
                string? cursor
            );
    }
}