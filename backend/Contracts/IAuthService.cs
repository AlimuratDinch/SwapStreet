using System;
using System.Text.Json;
using System.Threading.Tasks;
using Models.Authentication;

namespace backend.Services
{
    public interface IAuthService
    {
        // User management
        Task<User> CreateUserAsync(string email, string password);
        Task<bool> ConfirmEmailAsync(Guid userId, string token);

        // Password login
        Task<Session> LoginWithPasswordAsync(string email, string password);

        // External login
        Task<Session> LoginWithProviderAsync(string provider, string providerId, JsonDocument data);

        // Session / Token management
        Task<RefreshToken> RefreshSessionAsync(string refreshToken);
        Task LogoutAsync(Guid sessionId);
    }
}
