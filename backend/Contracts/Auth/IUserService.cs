using Models.Authentication;

namespace backend.Contracts.Auth
{
    public interface IUserService
    {
        Task<User> CreateUserAsync(string email, string password);
        Task<bool> ConfirmEmailAsync(Guid userId, string token);
        Task<bool> MarkUserForDeletionAsync(Guid userId);
        Task PermanentlyDeleteUserAsync(Guid userId);
        Task<User?> GetUserByEmailAsync(string email);
    }
}
