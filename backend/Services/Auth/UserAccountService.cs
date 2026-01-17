using backend.Contracts.Auth;
public class UserAccountService : IUserAccountService
{
    private readonly AuthDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly IUserService _userService;

    public UserAccountService(AuthDbContext dbContext, ITokenService tokenService, IUserService userService, IEmailService emailService)
    {
        _dbContext = dbContext;
        _userService = userService;
        _tokenService = tokenService;
    }

    public async Task DeleteUserAndTokensAsync(Guid userId)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            await _tokenService.InvalidateAllRefreshTokensForUserAsync(userId);
            await _userService.PermanentlyDeleteUserAsync(userId);
            await transaction.CommitAsync();

        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new Exception("Error deleting user and tokens", ex);
        }
    }

}