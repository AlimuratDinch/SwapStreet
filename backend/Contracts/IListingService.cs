namespace backend.Contracts
{
    public interface IListingService
    {
        Task<Listing?> GetByIdAsync(Guid id);
        Task<IEnumerable<Listing>> GetAllAsync();
        Task<IEnumerable<Listing>> GetByProfileIdAsync(Guid profileId);
        Task<Listing> CreateAsync(Listing listing, List<ListingImage> images);
        Task<Listing?> UpdateAsync(Guid id, Listing listing);
        Task<bool> DeleteAsync(Guid id);
    }
}
