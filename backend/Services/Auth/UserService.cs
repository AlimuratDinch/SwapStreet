using backend.Contracts.Auth;
using backend.Models.Authentication;
using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.DTOs.Auth;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;


namespace backend.Services.Auth
{
    public class UserService : IUserService
    {
        private readonly IPasswordHasher _passwordHasher;
        private readonly AuthDbContext _authDBContext;

        private readonly IEmailService _emailService;

        private readonly IConfiguration _config;

        public UserService(IPasswordHasher passwordHasher, AuthDbContext authDBContext, IEmailService emailService, IConfiguration config)
        {
            _passwordHasher = passwordHasher;
            _authDBContext = authDBContext;
            _emailService = emailService;
            _config = config;
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
                ConfirmationToken = Guid.NewGuid().ToString("N"),
                ConfirmationTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(24),
                Status = "pending"
            };

            await _authDBContext.Users.AddAsync(user);
            await _authDBContext.SaveChangesAsync();

            await SendConfirmationEmail(user);

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

        public async Task<User?> GetUserByIdStringAsync(string guid)
        {
            if (!Guid.TryParse(guid, out var userId))
                return null;

            return await _authDBContext.Users.FindAsync(userId);
        }


        public UserDto? LoginWithPassword(User user, string password)
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


        public async Task<User?> ResendConfirmationEmailAsync(string email)
        {
            User user = await GetUserByEmailAsync(email);

            // 1. User doesn't exist? Return null.
            if (user is null) return null;

            // 2. Already verified? Return user (but Controller won't email).
            if (user.EmailConfirmedAt.HasValue) return user;

            // 3. --- SECURITY FIX: The Cooldown ---
            // If we sent one in the last 5 minutes, BLOCK IT.
            if (user.ConfirmationEmailSentAt.HasValue &&
                user.ConfirmationEmailSentAt.Value.AddMinutes(5) > DateTimeOffset.UtcNow)
            {
                // Return the user so the controller thinks it succeeded, 
                // but DO NOT generate a new token.
                return user;
            }

            // 4. Generate new token only if cooldown passed
            user.ConfirmationToken = Guid.NewGuid().ToString("N");
            user.ConfirmationTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(24);
            user.ConfirmationEmailSentAt = DateTimeOffset.UtcNow; // Reset the timer
            user.Status = "Pending";

            await _authDBContext.SaveChangesAsync();

            await SendConfirmationEmail(user);

            return user;
        }


        // Email verification
        public async Task<bool> ConfirmEmailAsync(string email, string token)
        {
            // 1. Look up by Email
            User user = await GetUserByEmailAsync(email);

            if (user is null) return false;

            // Check if Token Matches
            if (user.ConfirmationToken != token) return false;

            // Chekc if expired
            if (user.ConfirmationTokenExpiresAt < DateTimeOffset.UtcNow)
            {
                return false;
            }

            // 4. Success Logic
            user.EmailConfirmedAt = DateTimeOffset.UtcNow;

            // Clean up used token so it cannot be used a second time
            user.ConfirmationToken = null;
            user.ConfirmationTokenExpiresAt = null;

            await _authDBContext.SaveChangesAsync();

            return true;
        }


        public async Task SendConfirmationEmail(User user)
        {

            var frontendUrl = _config["FrontendUrl"];

            if (string.IsNullOrEmpty(frontendUrl))
            {
                frontendUrl = "http://localhost:3000";
            }
            var link = $"{frontendUrl}/verify-email?token={user.ConfirmationToken}&email={user.Email}";

            await _emailService.SendWelcomeEmailAsync(user.Email, user.Username, link);
        }
    }
}