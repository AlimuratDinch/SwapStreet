
namespace backend.Contracts.Auth
{
    public interface ITokenService
    {
        Task<string> GenerateAccessTokenAsync(Guid userId);
        Task<string> GenerateRefreshTokenAsync(Guid userId);
        Task<bool> ValidateTokenAsync(string token);
    }
}
