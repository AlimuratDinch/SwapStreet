namespace backend.Contracts.Auth
{
    public interface IUserAccountService
    {
        Task DeleteUserAndTokensAsync(Guid userId);
    }
}
