namespace backend.Contracts.Auth
{
    public interface IAuthService
    {
        IUserService Users { get; }
        ITokenService Tokens { get; }
    }
}
