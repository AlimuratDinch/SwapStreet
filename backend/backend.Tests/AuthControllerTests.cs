// #nullable enable
// using System;
// using System.Threading.Tasks;
// using Microsoft.AspNetCore.Mvc;
// using backend.Controllers;
// using backend.DTOs.Auth;
// using backend.Contracts.Auth;
// using backend.Services.Auth;
// using backend.Models.Authentication;
// using Xunit;
// using AwesomeAssertions;

// namespace backend.Tests
// {
//     public class AuthControllerTests
//     {
//         private class FakeUserService : IUserService
//         {
//             public Func<string, Task<User?>>? GetByEmailAsyncFunc;
//             public Func<string, Task<User?>>? GetByUsernameAsyncFunc;
//             public Func<User, string, Task<UserDto?>>? LoginFunc;

//             public Task<User> RegisterAsync(string email, string username, string password) => throw new NotImplementedException();
//             public Task PermanentlyDeleteUserAsync(Guid userId) => throw new NotImplementedException();
//             public Task<User?> GetUserByEmailAsync(string email) => GetByEmailAsyncFunc != null ? GetByEmailAsyncFunc(email) : Task.FromResult<User?>(null);
//             public Task<User?> GetUserByUsernameAsync(string username) => GetByUsernameAsyncFunc != null ? GetByUsernameAsyncFunc(username) : Task.FromResult<User?>(null);
//             public Task<UserDto?> LoginWithPasswordAsync(User user, string password) => LoginFunc != null ? LoginFunc(user, password) : Task.FromResult<UserDto?>(null);
//         }

//         private class FakeTokenService : ITokenService
//         {
//             public Func<Guid, Task<string>>? GenerateAccessTokenAsyncFunc;
//             public Func<Guid, Task<string>>? GenerateRefreshTokenAsyncFunc;

//             public Task<string> GenerateAccessTokenAsync(Guid userId) => GenerateAccessTokenAsyncFunc != null ? GenerateAccessTokenAsyncFunc(userId) : Task.FromResult(string.Empty);
//             public Task<string> GenerateRefreshTokenAsync(Guid userId) => GenerateRefreshTokenAsyncFunc != null ? GenerateRefreshTokenAsyncFunc(userId) : Task.FromResult(string.Empty);
//             public Task InvalidateRefreshTokenAsync(string token) => Task.CompletedTask;
//             public Task<bool> ValidateRefreshTokenAsync(string token) => Task.FromResult(true);
//             public Task<string> RefreshAccessTokenAsync(string refreshToken) => Task.FromResult("new-access");
//             public Task InvalidateAllRefreshTokensForUserAsync(Guid userId) => Task.CompletedTask;
//             public Task<Guid?> GetUserIdFromTokenAsync(string token) => Task.FromResult<Guid?>(Guid.Empty);
//             public Task<bool> IsTokenRevokedAsync(string token) => Task.FromResult(false);
//         }

//         [Fact]
//         public async Task SignIn_InvalidModel_ReturnsBadRequest()
//         {
//             var userSvc = new FakeUserService();
//             var tokenSvc = new FakeTokenService();
//             var controller = new AuthController(userSvc, tokenSvc);

//             // simulate invalid model state
//             controller.ModelState.AddModelError("Email", "Required");

//             var dto = new SignInDto { Email = "", Password = "" };

//             var result = await controller.SignIn(dto);

//             result.Should().BeOfType<BadRequestObjectResult>();
//         }

//         [Fact]
//         public async Task SignIn_UserNotFound_ReturnsBadRequest()
//         {
//             var userSvc = new FakeUserService();
//             userSvc.GetByEmailAsyncFunc = email => Task.FromResult<User?>(null);
//             userSvc.GetByUsernameAsyncFunc = username => Task.FromResult<User?>(null);

//             var tokenSvc = new FakeTokenService();
//             var controller = new AuthController(userSvc, tokenSvc);

//             var dto = new SignInDto { Email = "noone@example.com", Password = "password123" };

//             var result = await controller.SignIn(dto);

//             result.Should().BeOfType<BadRequestObjectResult>();
//             var bad = result as BadRequestObjectResult;
//             bad!.Value.Should().BeOfType<object>();
//         }

//         [Fact]
//         public async Task SignIn_InvalidPassword_ReturnsBadRequest()
//         {
//             var user = new User { Id = Guid.NewGuid(), Email = "user@example.com", Username = "user", EncryptedPassword = "h" };

//             var userSvc = new FakeUserService();
//             userSvc.GetByEmailAsyncFunc = email => Task.FromResult<User?>(user);
//             userSvc.LoginFunc = (u, p) => Task.FromResult<UserDto?>(null);

//             var tokenSvc = new FakeTokenService();
//             var controller = new AuthController(userSvc, tokenSvc);

//             var dto = new SignInDto { Email = "user@example.com", Password = "wrongpassword" };

//             var result = await controller.SignIn(dto);

//             result.Should().BeOfType<BadRequestObjectResult>();
//         }

//         [Fact]
//         public async Task SignIn_ValidCredentials_ReturnsTokens()
//         {
//             var user = new User { Id = Guid.NewGuid(), Email = "good@example.com", Username = "good", EncryptedPassword = "h" };

//             var userSvc = new FakeUserService();
//             userSvc.GetByEmailAsyncFunc = email => Task.FromResult<User?>(user);
//             userSvc.LoginFunc = (u, p) => Task.FromResult<UserDto?>(new UserDto { Id = user.Id, Email = user.Email, Username = user.Username });

//             var tokenSvc = new FakeTokenService();
//             tokenSvc.GenerateAccessTokenAsyncFunc = id => Task.FromResult("access-token");
//             tokenSvc.GenerateRefreshTokenAsyncFunc = id => Task.FromResult("refresh-token");

//             var controller = new AuthController(userSvc, tokenSvc);

//             var dto = new SignInDto { Email = "good@example.com", Password = "correctpass" };

//             var result = await controller.SignIn(dto);

//             result.Should().BeOfType<OkObjectResult>();
//             var ok = result as OkObjectResult;
//             var obj = ok!.Value as dynamic;
//             ((string)obj.AccessToken).Should().Be("access-token");
//             ((string)obj.RefreshToken).Should().Be("refresh-token");
//         }
//     }
// }
