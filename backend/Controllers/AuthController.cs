using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Auth;
using backend.DTOs.Auth;
using System.Threading.Tasks;
using backend.Contracts.Auth;
using System.ComponentModel.DataAnnotations;
using backend.Models.Authentication;
using System.IdentityModel.Tokens.Jwt;

namespace backend.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;
        private readonly int _accessTokenExpirationMinutes;
        private readonly int _refreshTokenExpirationDays;

        public AuthController(IUserService userService, ITokenService tokenService, IConfiguration config)
        {
            _userService = userService;
            _tokenService = tokenService;
            _config = config;

            _accessTokenExpirationMinutes = _config.GetValue<int>("Jwt:AccessTokenExpirationMinutes");
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

            // Set HttpOnly cookies
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes)
            };

            Response.Cookies.Append("access_token", accessToken, cookieOptions);

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
                User = new { user.Id, user.Username, user.Email } // TODO: Remove sensitive data (only for testing) 
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

            var result = await _userService.LoginWithPasswordAsync(user, password);

            if (result == null)
            {
                return BadRequest(new { Error = "Password incorrect." });
            }

             var accessToken = await _tokenService.GenerateAccessTokenAsync(user.Id);
             var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);

            // Set HttpOnly cookies
            var accessCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes)
            };

            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // <- set false for localhost dev
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays)
            };

            Response.Cookies.Append("access_token", accessToken, accessCookieOptions);
            Response.Cookies.Append("refresh_token", refreshToken, refreshCookieOptions);

            // 7. Return success response
            
            return Ok(new { Message = "Login successful." });
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
            Guid? userID = await _tokenService.GetUserIdFromTokenAsync(refreshToken);
            if (!userID.HasValue)
            {
                return BadRequest(new { Error = "No user found for the provided token" });
            }

            // Generate a new access token
            var accessToken = await _tokenService.GenerateAccessTokenAsync(userID.Value);

            // Set the access token as an HTTP-only cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // set to false in local dev if not using HTTPS
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes)
            };

            Response.Cookies.Append("access_token", accessToken, cookieOptions);

            return Ok(new { Message = "Token refreshed successfully" });
        }

        // POST api/auth/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // obtain access token from cookies
            var accessToken = Request.Cookies["access_token"];
            if (string.IsNullOrEmpty(accessToken))
            {
                return Unauthorized(new { Error = "No access token provided" });
            }

            // 1. Obtain user ID from access token
            var userId = await _tokenService.GetUserIdFromAccessTokenAsync(accessToken);
            if (!userId.HasValue)
            {
                return Unauthorized(new { Error = "Invalid token" });
            }
            // 2. Invalidate all refresh tokens for the user
            await _tokenService.InvalidateAllRefreshTokensForUserAsync(userId.Value);

            // 3. Remove cookies
            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("refresh_token");

            return Ok(new { message = "Logout successful" });
        }

        // PATCH api/auth/updateUsername
        // call using {"newUsername": "newname" }
        [HttpPatch("updateUsername")]
        public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameDto updateUsernameDto)
        {
            if (string.IsNullOrWhiteSpace(updateUsernameDto.NewUsername))
            {
                return BadRequest(new { Error = "Username cannot be empty" });
            }

            var userId = await _tokenService.GetUserIdFromAccessTokenAsync(Request.Cookies["access_token"]);
            if (!userId.HasValue)
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            try
            {
                var updatedUser = await _userService.UpdateUsernameAsync(userId.Value, updateUsernameDto.NewUsername);
                return Ok(new { Message = "Username updated successfully", NewUsername = updatedUser.Username });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        // PATCH api/auth/updateEmail
        // call using {"newEmail": "newemail" }
        [HttpPatch("updateEmail")]
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailDto updateEmailDto)
        {
            if (string.IsNullOrWhiteSpace(updateEmailDto.NewEmail))
            {
                return BadRequest(new { Error = "Email cannot be empty" });
            }

            if (!new EmailAddressAttribute().IsValid(updateEmailDto.NewEmail))
            {
                return BadRequest(new { Error = "Invalid email format" });
            }

            var userId = await _tokenService.GetUserIdFromAccessTokenAsync(Request.Cookies["access_token"]);
            if (!userId.HasValue)
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            try
            {
                var updatedUser = await _userService.UpdateEmailAsync(userId.Value, updateEmailDto.NewEmail);
                return Ok(new { Message = "Email updated successfully", NewEmail = updatedUser.Email });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        // DELETE api/auth/deleteUser
        [Authorize]
        [HttpDelete("deleteUser")]
        public IActionResult DeleteUser()
        {
            // TODO: implement user deletion logic
            return Ok();
        }
    }
}
