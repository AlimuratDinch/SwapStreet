using backend.DTOs.Auth;
using backend.Models.Authentication;

namespace backend.Contracts.Auth
{
    public interface IUserService
    {

        Task<User> RegisterAsync(string email, string username, string password);
        //Task<bool> ConfirmEmailAsync(Guid userId, string token);  TODO Later no TFA rn
        // Task<bool> MarkUserForDeletionAsync(Guid userId); TODO Later
        Task PermanentlyDeleteUserAsync(Guid userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<UserDto?> LoginWithPasswordAsync(User user, string password);
        Task<User> UpdateUsernameAsync(Guid userId, string newUsername);
        Task<User> UpdateEmailAsync(Guid userId, string newEmail);
    }
}
