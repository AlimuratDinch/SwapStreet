namespace backend.Contracts
{
    public interface IListingSearchService
    {
        Task<IEnumerable<Listing>> SearchListingsAsync(string query);
    }
}