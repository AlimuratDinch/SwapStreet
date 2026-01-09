using backend.DTOs.Auth;
using backend.Models.Authentication;

namespace backend.Contracts.Auth
{
    public interface IUserService
    {

        Task<User> RegisterAsync(string email, string username, string password);
        // Task<bool> MarkUserForDeletionAsync(Guid userId); TODO Later
        Task PermanentlyDeleteUserAsync(Guid userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByIdStringAsync(string guid);
        UserDto? LoginWithPassword(User user, string password);
        Task<User> UpdateUsernameAsync(Guid userId, string newUsername);
        Task<User> UpdateEmailAsync(Guid userId, string newEmail);
        Task<bool> ConfirmEmailAsync(string email, string token);
        Task<User?> ResendConfirmationEmailAsync(string email);
        Task SendConfirmationEmail(User user);
    }
}
