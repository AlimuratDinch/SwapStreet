namespace backend.Services.Auth
{
    public class UserService : IUserService
    {
        private readonly IPasswordHasher _passwordHasher;
        private readonly AuthDbContext _authDBContext;


        public async Task<User> RegisterAsync(string email, string password, string username)
        {
            var user = new User
            {
                Email = email,
                PasswordHash = _passwordHasher.HashPassword(password),
                Username = username
            };

            await _authDBContext.Users.AddAsync(user);
            await _authDBContext.SaveChangesAsync();
            return user;
        }

        public async Task PermanentlyDeleteUserAsync(Guid userId)
        {
            var user = await _authDBContext.Users.FindAsync(userId);
            if (user != null)
            {
                _authDBContext.Users.Remove(user);
                await _authDBContext.SaveChangesAsync();
            }
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _authDBContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _authDBContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<string?> LoginWithPasswordAsync(string emailOrUsername, string password)
        {
            var user = await GetUserByEmailAsync(emailOrUsername) ?? await GetUserByUsernameAsync(emailOrUsername);
            var hashedPassword = _passwordHasher.HashPassword(password);
            if (user == null) return null;
            return _passwordHasher.VerifyPassword(hashedPassword, user.PasswordHash) ? user.Id.ToString() : null;
        }
        public async Task<User> RegisterAsync(string email, string password, string username)
        {
            var user = new User
            {
                Email = email,
                PasswordHash = _passwordHasher.HashPassword(password),
                Username = username
            };

            await _authDBContext.Users.AddAsync(user);
            await _authDBContext.SaveChangesAsync();
            return user;
        }

        public async Task PermanentlyDeleteUserAsync(Guid userId)
        {
            var user = await authDBContext.Users.FindAsync(userId);
            if (user != null)
            {
                authDBContext.Users.Remove(user);
                await authDBContext.SaveChangesAsync();
            }
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await authDBContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await authDBContext.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<bool> LoginWithPasswordAsync(string emailOrUsername, string password)
        {

            var user = await GetUserByEmailAsync(emailOrUsername) ?? await GetUserByUsernameAsync(emailOrUsername);
            if (user == null) return false;
            
            var hashedPassword = _passwordHasher.HashPassword(password);
            return _passwordHasher.VerifyPassword(hashedPassword, user.EncryptedPassword);
        }

    }    
}
