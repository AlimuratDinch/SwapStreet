using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Auth;
using backend.DTOs.Auth;
using System.Threading.Tasks;
using backend.Contracts.Auth;

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
        public IActionResult SignIn()
        {
            // TODO: implement signin logic
            return Ok();
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
