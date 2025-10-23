using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Auth;
using backend.DTOs.Auth;
using System.Threading.Tasks;
using backend.Contracts.Auth;
using System.ComponentModel.DataAnnotations;
using backend.Models.Authentication;

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
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes)
            };

            Response.Cookies.Append("access_token", accessToken, cookieOptions);

            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
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
                return BadRequest(new { Error = "Invalid email or password." });
            }

            // 4. Verify password

            var result = await _userService.LoginWithPasswordAsync(user, password);

            if (result == null)
            {
                return BadRequest(new { Error = "Invalid email or password." });
            }

            // 5. Generate JWT token
            var accessToken = await _tokenService.GenerateAccessTokenAsync(user.Id);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);

            return Ok(new { AccessToken = accessToken, RefreshToken = refreshToken });
        }

        // POST api/auth/refresh
        //Nek
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(String token)
        {
            if (token == null || token.Length < 1) { return BadRequest(new { Error = "Invalid or empty token received" }); }

            if (await _tokenService.ValidateRefreshTokenAsync(token))
            {
                Guid? userID = await _tokenService.GetUserIdFromTokenAsync(token);
                if (userID.HasValue)
                {
                    var accessToken = await _tokenService.GenerateAccessTokenAsync(userID.Value);

                    var cookieOptions = new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes)
                    };

                    Response.Cookies.Append("access_token", accessToken, cookieOptions);

                    return Ok("Token Refreshed");
                } else
                {
                    return BadRequest(new { Error = "No user found for the provided token" });
                }
            }
            else
            {
                return BadRequest(new { Error = "Token is invalid or expired" });
            }
        }

        // POST api/auth/logout
        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // TODO: implement logout logic
            return Ok();
        }

        // PATCH api/auth/updateUsername
        [Authorize]
        [HttpPatch("updateUsername")]
        public IActionResult UpdateUsername()
        {
            // TODO: implement username update logic
            return Ok();
        }

        // PATCH api/auth/updateEmail
        [Authorize]
        [HttpPatch("updateEmail")]
        public IActionResult UpdateEmail()
        {
            // TODO: implement email update logic
            return Ok();
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
