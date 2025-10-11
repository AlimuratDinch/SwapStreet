using backend.Models.Authentication;

namespace backend.Contracts.Auth
{
    public interface ISessionService
    {

        //TO BE ADDED LATER: Task<Session> LoginWithProviderAsync(string provider, string providerId, JsonDocument data);
        Task<string> RefreshSessionAsync(string refreshToken);
        Task LogoutAsync(Guid sessionId);
        Task<Session?> GetSessionAsync(Guid sessionId);
        Task<string> RefreshAccessTokenAsync(string refreshToken);
    }
}
