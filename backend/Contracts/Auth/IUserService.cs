using Models.Authentication;

namespace backend.Contracts.Auth
{
    public interface IUserService
    {

        Task<User> RegisterAsync(string email, string password);
        Task<bool> MarkUserForDeletionAsync(Guid userId);
        Task PermanentlyDeleteUserAsync(Guid userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<bool> SignInAsync(string email, string password);
        Task<User?> GetUserByIdAsync(Guid userId);
        Task<bool> UpdateLastSignInAsync(Guid userId);

        //TODO: Task<bool> ConfirmEmailAsync(Guid userId, string token);
    }
}
