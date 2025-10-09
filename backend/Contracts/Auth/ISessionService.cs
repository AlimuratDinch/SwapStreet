using System.Text.Json;
using Models.Authentication;

namespace backend.Contracts.Auth
{
    public interface ISessionService
    {
        Task<Session> LoginWithPasswordAsync(string email, string password);
        
        //TO BE ADDED LATER: Task<Session> LoginWithProviderAsync(string provider, string providerId, JsonDocument data);
        Task<RefreshToken> RefreshSessionAsync(string refreshToken);
        Task LogoutAsync(Guid sessionId);
        Task<Session?> GetSessionAsync(Guid sessionId);
    }
}
