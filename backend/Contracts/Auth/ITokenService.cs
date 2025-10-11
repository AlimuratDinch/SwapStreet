
namespace backend.Contracts.Auth
{
    public interface ITokenService
    {
        Task<string> GenerateAccessTokenAsync(Guid userId);
        Task<string> GenerateRefreshTokenAsync(Guid userId);
        Task<bool> ValidateRefreshTokenAsync(string token);
        Task<string> RefreshAccessTokenAsync(string refreshToken);
        Task InvalidateRefreshTokenAsync(string refreshToken);
        Task InvalidateAllRefreshTokensForUserAsync(Guid userId);
        Task<Guid?> GetUserIdFromTokenAsync(string token);
        Task<bool> IsTokenRevokedAsync(string token);
    }
}
