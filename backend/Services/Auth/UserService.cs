using backend.DbContexts.AuthDbContext;

namespace backend.Services.Auth
{
    public class UserService : IPasswordHasher, IUserService
    {
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        public async Task<User> RegisterAsync(string email, string password, string username)
        {
            var user = new User
            {
                Email = email,
                PasswordHash = HashPassword(password),
                Username = username
            };

            await authDBContext.Users.AddAsync(user);
            await authDBContext.SaveChangesAsync();
            return user;
        }

        public async Task PermanentlyDeleteUserAsync(Guid userId)
        {
            var user = await authDBContext.Users.FindAsync(userId);
            if (user != null)
            {
                authDBContext.Users.RemoveAsy(user);
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
            var hashedPassword = HashPassword(password);
            if (user == null) return false;
            return VerifyPassword(hashedPassword, user.PasswordHash);
}

    }
}
