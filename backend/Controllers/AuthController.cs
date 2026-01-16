using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Auth;
using backend.DTOs.Auth;
using System.Threading.Tasks;
using backend.Contracts.Auth;
using System.ComponentModel.DataAnnotations;
using backend.Models.Authentication;
using System.Security.Claims;

namespace backend.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IUserAccountService _userAccountService;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;
        private readonly int _refreshTokenExpirationDays;

        public AuthController(IUserService userService, IUserAccountService userAccountService, ITokenService tokenService, IConfiguration config)
        {
            _userService = userService;
            _userAccountService = userAccountService;
            _tokenService = tokenService;
            _config = config;

            _refreshTokenExpirationDays = _config.GetValue<int>("Jwt:RefreshTokenExpirationDays");

        }

        // POST api/auth/register
        //Nek
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] SignUpDto signUpDto)
        {

            // 1. Checks if required fields are present and valid
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(signUpDto.Email))
                return BadRequest(new { Error = "Email is required" });

            if (string.IsNullOrWhiteSpace(signUpDto.Username))
                return BadRequest(new { Error = "Username is required" });

            if (string.IsNullOrWhiteSpace(signUpDto.Password) || signUpDto.Password.Length < 8)
                return BadRequest(new { Error = "Password must be at least 8 characters" });

            // 2. registers new user
            User user;
            try
            {
                user = await _userService.RegisterAsync(signUpDto.Email, signUpDto.Username, signUpDto.Password);

            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            // 3. Generate tokens ( httpOnly )
            var accessToken = await _tokenService.GenerateAccessTokenAsync(user.Id);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);


            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // <- set false for localhost dev
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays)
            };

            Response.Cookies.Append("refresh_token", refreshToken, refreshCookieOptions);

            return Ok(new
            {
                Message = "User registered successfully",
                AccessToken = accessToken
            });
        }

        // POST api/auth/signin
        [HttpPost("signin")]
        public async Task<IActionResult> SignIn([FromBody] SignInDto signInDto)
        {
            // 1. Checks if required fields are present and valid
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 2. Attempts to find user by email or username
            var (email, password) = signInDto;

            bool IsValidEmail = new EmailAddressAttribute().IsValid(email);
            User? user;

            if (IsValidEmail)
            {
                user = await _userService.GetUserByEmailAsync(email);

            }
            else
            {
                user = await _userService.GetUserByUsernameAsync(email);
            }

            // 3. If user not found, return error

            if (user == null)
            {
                return BadRequest(new { Error = "User not found." });
            }

            // 4. Verify password

            var result = _userService.LoginWithPassword(user, password);

            if (result == null)
            {
                return BadRequest(new { Error = "Invalid email or password." });
            }

            var accessToken = await _tokenService.GenerateAccessTokenAsync(user.Id);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);

            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // <- set false for localhost dev
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays)
            };

            Response.Cookies.Append("refresh_token", refreshToken, refreshCookieOptions);

            // 7. Return success response

            return Ok(new
            {
                Message = "Login successful.",
                AccessToken = accessToken
            });
        }

        // POST api/auth/refresh
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            // Get the refresh token from cookies
            if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
            {
                return BadRequest(new { Error = "Invalid or missing refresh token" });
            }

            // Validate the refresh token
            if (!await _tokenService.ValidateRefreshTokenAsync(refreshToken))
            {
                return BadRequest(new { Error = "Token is invalid or expired" });
            }

            // Get the user ID from the token
            Guid? userID = await _tokenService.GetUserIdFromRefreshTokenAsync(refreshToken);
            if (!userID.HasValue)
            {
                return BadRequest(new { Error = "No user found for the provided token" });
            }

            // Generate a new access token
            var accessToken = await _tokenService.GenerateAccessTokenAsync(userID.Value);


            return Ok(new
            {
                Message = "Token refreshed successfully",
                AccessToken = accessToken
            });
        }

        // POST api/auth/logout
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // 1. Get the user ID from the JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            // 2. Invalidate all refresh tokens for this user
            await _tokenService.InvalidateAllRefreshTokensForUserAsync(userId);

            // 3. Remove the HTTP-only refresh token cookie
            Response.Cookies.Delete("refresh_token");

            return Ok(new { message = "Logout successful" });
        }


        // PATCH api/auth/updateUsername
        // call using {"newUsername": "newname" }
        [Authorize]
        [HttpPatch("updateUsername")]
        public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameDto updateUsernameDto)
        {
            if (string.IsNullOrWhiteSpace(updateUsernameDto.NewUsername))
                return BadRequest(new { Error = "Username cannot be empty" });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { Error = "Invalid token" });

            try
            {
                var updatedUser = await _userService.UpdateUsernameAsync(userId, updateUsernameDto.NewUsername);
                return Ok(new { Message = "Username updated successfully", NewUsername = updatedUser.Username });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize]
        [HttpPatch("updateEmail")]
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailDto updateEmailDto)
        {
            if (string.IsNullOrWhiteSpace(updateEmailDto.NewEmail))
                return BadRequest(new { Error = "Email cannot be empty" });

            if (!new EmailAddressAttribute().IsValid(updateEmailDto.NewEmail))
                return BadRequest(new { Error = "Invalid email format" });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { Error = "Invalid token" });

            try
            {
                var updatedUser = await _userService.UpdateEmailAsync(userId, updateEmailDto.NewEmail);
                return Ok(new { Message = "Email updated successfully", NewEmail = updatedUser.Email });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("deleteUser")]
        public async Task<IActionResult> DeleteUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { Error = "Invalid token" });

            try
            {
                await _userAccountService.DeleteUserAndTokensAsync(userId);
                Response.Cookies.Delete("refresh_token");
                return Ok(new { Message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDTO request)
        {

            var result = await _userService.ConfirmEmailAsync(request.Email, request.Token);

            if (result) return Ok(new { message = "Email confirmed successfully!" });

            return BadRequest(new { Error = "Email Not Confirmed" });
        }

        [HttpPost("resend-verification")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendVerification([FromBody] ResendRequestDTO request)
        {
            // Call the service
            User? user = await _userService.ResendConfirmationEmailAsync(request.Email);

            // SECURITY: Always return OK.
            // Never say "User not found" (prevents hackers from guessing emails).
            if (user == null)
            {
                return Ok(new { message = "If an unverified account exists, a new email has been sent." });
            }

            // Check if we actually generated a new token (by checking the time we just updated)
            // If the database time is OLDER than 10 seconds ago, we hit the cooldown.
            bool hitCooldown = user.ConfirmationEmailSentAt < DateTimeOffset.UtcNow.AddSeconds(-10);

            if (!hitCooldown && !user.EmailConfirmedAt.HasValue)
            {

            }

            return Ok(new { message = "If an unverified account exists, a new email has been sent." });
        }

    }
}