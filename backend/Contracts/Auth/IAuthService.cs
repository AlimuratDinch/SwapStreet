namespace backend.Contracts.Auth
{
    public interface IAuthService
    {
        IUserService Users { get; }
        ISessionService Sessions { get; }
        ITokenService Tokens { get; }
    }
}
