namespace backend.Contracts
{
    public interface ITagService
    {
        Task<Tag?> GetByIdAsync(Guid id);
        Task<IEnumerable<Tag>> GetAllAsync();
        Task<Tag> CreateAsync(Tag tag);
        Task<Tag?> UpdateAsync(Guid id, Tag tag);
        Task<bool> DeleteAsync(Guid id);
    }
}
