using backend.Contracts.Auth;
using backend.Models.Authentication;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.DTOs.Auth;
using System.ComponentModel.DataAnnotations;


namespace backend.Services.Auth
{
    public class UserService : IUserService
    {
        private readonly IPasswordHasher _passwordHasher;
        private readonly AuthDbContext _authDBContext;

        public UserService(IPasswordHasher passwordHasher, AuthDbContext authDBContext)
        {
            _passwordHasher = passwordHasher;
            _authDBContext = authDBContext;
        }

        public async Task<User> RegisterAsync(string email, string username, string password)
        {
            var existingUser = await GetUserByEmailAsync(email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("A user with this email already exists.");
            }
            var user = new User
            {
                Email = email,
                EncryptedPassword = _passwordHasher.HashPassword(password),
                Username = username,
                Status = "authenticated"
            };

            await _authDBContext.Users.AddAsync(user);
            await _authDBContext.SaveChangesAsync();

            Console.WriteLine($"Adding new user: {user}");
            
            return user;
        }

        public async Task PermanentlyDeleteUserAsync(Guid userId)
        {
            User? user = await _authDBContext.Users.FindAsync(userId);
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

        public async Task<UserDto?> LoginWithPasswordAsync(User user, string password)
        {
            // Do NOT hash the incoming password again here. The password stored in the database
            // is already hashed (with a random salt). To verify, pass the plain password to the
            // hasher's Verify method which knows how to compare the plain password against the
            // stored hash (for example bcrypt's Verify).
            return _passwordHasher.VerifyPassword(password, user.EncryptedPassword)
                ? new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Username = user.Username
                }
                : null;
        }

        public async Task<User> UpdateUsernameAsync(Guid userId, string newUsername)
        {
            var user = await _authDBContext.Users.FindAsync(userId)
                ?? throw new Exception("User not found");

            // Check if username is already taken
            if (await _authDBContext.Users.AnyAsync(u => u.Username == newUsername && u.Id != userId))
            {
                throw new Exception("Username is already taken");
            }

            user.Username = newUsername;
            await _authDBContext.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateEmailAsync(Guid userId, string newEmail)
        {
            var user = await _authDBContext.Users.FindAsync(userId)
                ?? throw new Exception("User not found");

            // Validate email format
            if (!new EmailAddressAttribute().IsValid(newEmail))
            {
                throw new Exception("Invalid email format");
            }

            // Check if email is already taken
            if (await _authDBContext.Users.AnyAsync(u => u.Email == newEmail && u.Id != userId))
            {
                throw new Exception("Email is already taken");
            }

            user.Email = newEmail;
            await _authDBContext.SaveChangesAsync();
            return user;
        }
    }
}