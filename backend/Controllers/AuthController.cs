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

        public AuthController(IUserService userService, ITokenService tokenService)
        {
            _userService = userService;
            _tokenService = tokenService;
        }

        // POST api/auth/register
        [HttpPost("register")]
        public IActionResult Register()
        {
            // TODO: implement registration logic
            return Ok();
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
        [HttpPost("refresh")]
        public IActionResult Refresh()
        {
            // TODO: implement refresh token logic
            return Ok();
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
