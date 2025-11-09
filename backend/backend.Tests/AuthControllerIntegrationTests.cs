using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using AwesomeAssertions;
using backend.Tests;
using Xunit;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.AspNetCore.Mvc.Testing;
using backend;
using System;
using System.IO;
using Microsoft.AspNetCore.Hosting;

public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");

        var projectDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../backend"));

        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseContentRoot(projectDir);
        }).CreateClient();
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ REGISTER TESTS ----------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task Register_ShouldReturnOk_AndSetAccessTokenAndRefreshTokenCookies()
    {
        // Arrange
        var signUpDto = new
        {
            Email = "test@test.com",
            Username = "testUser",
            Password = "Test123!"
        };


        using var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");


        // Act
        using var response = await _client.PostAsync("/api/auth/register", content);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("a valid registration should return a 2xx status");

        var cookies = response.Headers.GetValues("Set-Cookie");
        cookies.Should().Contain(c => c.Contains("access_token"), "the access_token should be set as a cookie");
        cookies.Should().Contain(c => c.Contains("refresh_token"), "the refresh_token should be set as a cookie");
    }

    [Fact]
    public async Task Register_WithMissingEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var signUpDto = new
        {
            Email = "", // missing email
            Username = "user1",
            Password = "Test123!"
        };

        using var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");


        // Act
        using var response = await _client.PostAsync("/api/auth/register", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest, "registration should fail with missing email");
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var signUpDto = new
        {
            Email = "duplicate@test.com",
            Username = "user1",
            Password = "Test123!"
        };

        using var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");


        // Act - first registration
        using var firstResponse = await _client.PostAsync("/api/auth/register", content);
        firstResponse.IsSuccessStatusCode.Should().BeTrue("first registration should succeed");

        // Act - second registration with same email
        var secondResponse = await _client.PostAsync("/api/auth/register", content);

        // Assert
        secondResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest, "duplicate registration should fail");
    }

    [Fact]
    public async Task Register_WithInvalidPassword_ShouldReturnBadRequest()
    {
        // Arrange
        var signUpDto = new
        {
            Email = "test2@test.com",
            Username = "user2",
            Password = "123" // too short/weak
        };

        using var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");


        // Act
        using var response = await _client.PostAsync("/api/auth/register", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest, "registration should fail for invalid password");

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Password", "validation should indicate password requirements");
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ REFRESH TESTS -----------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    [Fact]
    public async Task Refresh_WithValidRefreshToken_ShouldReturnOk_AndSetAccessTokenCookie()
    {
        // Step 1: Register a user to generate tokens
        var signUpDto = new
        {
            Email = "refresh@test.com",
            Username = "refreshUser",
            Password = "Test123!"
        };
        using var content = new StringContent(JsonSerializer.Serialize(signUpDto), System.Text.Encoding.UTF8, "application/json");


        using var registerResponse = await _client.PostAsync("/api/auth/register", content);

        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Step 2: Extract refresh token from Set-Cookie
        var refreshCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("refresh_token"));
        refreshCookie.Should().NotBeNull("refresh token cookie should exist");

        // Extract the token value
        var refreshTokenValue = refreshCookie.Split(';')[0].Split('=')[1];

        // Step 3: Send refresh request with the cookie
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        request.Headers.Add("Cookie", $"refresh_token={refreshTokenValue}");

        var response = await _client.SendAsync(request);

        // Step 4: Assert response
        response.IsSuccessStatusCode.Should().BeTrue("refresh with valid token should succeed");

        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().Contain("Token refreshed successfully", "response should contain success message");

        // Step 5: Check new access_token cookie
        var accessCookie = response.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access_token cookie should be set on refresh");
    }

    [Fact]
    public async Task Refresh_WithMissingRefreshToken_ShouldReturnBadRequest()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        // No cookie set

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid or missing refresh token");
    }

    [Fact]
    public async Task Refresh_WithInvalidRefreshToken_ShouldReturnBadRequest()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        request.Headers.Add("Cookie", $"refresh_token=invalidtoken");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Token is invalid or expired");
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ SIGN IN TESTS -----------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task SignIn_ShouldReturnOk_AndSetAccessAndRefreshCookies_AndTokensAreValid()
    {
        // Arrange - register first so user exists
        var email = "success@test.com";
        var password = "Test123!";

        var signUpDto = new
        {
            Email = email,
            Username = "signinUser",
            Password = password
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed before signin");

        // Act - signin with same credentials
        var signInDto = new
        {
            Email = email,
            Password = password
        };
        using var signInContent = new StringContent(JsonSerializer.Serialize(signInDto), Encoding.UTF8, "application/json");
        using var response = await _client.PostAsync("/api/auth/signin", signInContent);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("signin with valid credentials should succeed");

        var cookies = response.Headers.GetValues("Set-Cookie");
        cookies.Should().Contain(c => c.Contains("access_token"), "AccessToken cookie should be set on signin");
        cookies.Should().Contain(c => c.Contains("refresh_token"), "RefreshToken cookie should be set on signin");
    }

    [Fact]
    public async Task SignIn_WithInvalidPassword_ShouldReturnBadRequest()
    {
        // Arrange - register a user
        var signUpDto = new
        {
            Email = "signin-invalid@test.com",
            Username = "signinInvalid",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed before signin");

        // Act - attempt signin with wrong password
        var signInDto = new
        {
            Email = "signin-invalid@test.com",
            Password = "WrongPassword!"
        };
        using var signInContent = new StringContent(JsonSerializer.Serialize(signInDto), Encoding.UTF8, "application/json");
        using var response = await _client.PostAsync("/api/auth/signin", signInContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
    }

    [Fact]
    public async Task SignIn_UserNotFound_ReturnsBadRequest()
    {
        // Arrange - do NOT register user

        // Act - attempt signin for non-existent user
        var signInDto = new
        {
            Email = "nonexistent@test.com",
            Password = "DoesntMatter1!"
        };
        using var signInContent = new StringContent(JsonSerializer.Serialize(signInDto), Encoding.UTF8, "application/json");
        using var response = await _client.PostAsync("/api/auth/signin", signInContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("User not found");
    }

    [Fact]
    public async Task SignIn_WithMissingPassword_ShouldReturnBadRequest()
    {
        // Arrange - register user first
        var signUpDto = new
        {
            Email = "signin-missing@test.com",
            Username = "signinMissing",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed before signin");

        // Act - attempt signin with missing password
        var signInDto = new
        {
            Email = "signin-missing@test.com",
            Password = "" // missing/empty
        };
        using var signInContent = new StringContent(JsonSerializer.Serialize(signInDto), Encoding.UTF8, "application/json");
        using var response = await _client.PostAsync("/api/auth/signin", signInContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ LOGOUT TESTS -----------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task Logout_WithValidAccessToken_ShouldReturnOk_AndDeleteCookies()
    {
        // Arrange - register a user to get tokens
        var signUpDto = new
        {
            Email = "logout@test.com",
            Username = "logoutUser",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Extract access token from Set-Cookie
        var accessCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access token cookie should exist");

        var accessTokenValue = accessCookie.Split(';')[0].Split('=')[1];

        // Act - logout with valid token
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Add("Cookie", $"access_token={accessTokenValue}");

        var response = await _client.SendAsync(request);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("logout with valid token should succeed");

        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().Contain("Logout successful", "response should contain success message");

        // Check that cookies are deleted (Set-Cookie headers should be present with expired dates)
        var setCookies = response.Headers.GetValues("Set-Cookie").ToList();
        var hasAccessTokenDeletion = setCookies.Any(c => c.Contains("access_token"));
        var hasRefreshTokenDeletion = setCookies.Any(c => c.Contains("refresh_token"));
        
        // Cookies should be deleted (Set-Cookie headers should be present to delete them)
        hasAccessTokenDeletion.Should().BeTrue("access_token cookie should be deleted via Set-Cookie header");
        hasRefreshTokenDeletion.Should().BeTrue("refresh_token cookie should be deleted via Set-Cookie header");
    }

    [Fact]
    public async Task Logout_WithMissingAccessToken_ShouldReturnUnauthorized()
    {
        // Arrange - no token provided
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        // No cookie set

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("No access token provided");
    }

    [Fact]
    public async Task Logout_WithInvalidAccessToken_ShouldReturnUnauthorized()
    {
        // Arrange - invalid token
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Add("Cookie", $"access_token=invalidtoken");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid token");
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ UPDATE USERNAME TESTS --------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task UpdateUsername_WithValidToken_ShouldReturnOk_AndUpdateUsername()
    {
        // Arrange - register a user to get tokens
        var signUpDto = new
        {
            Email = "updateuser@test.com",
            Username = "oldUsername",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Extract access token
        var accessCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access token cookie should exist");
        var accessTokenValue = accessCookie.Split(';')[0].Split('=')[1];

        // Act - update username
        var updateDto = new
        {
            NewUsername = "newUsername"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateUsername")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token={accessTokenValue}");

        var response = await _client.SendAsync(request);


        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().Contain("Username updated successfully", "response should contain success message");
        responseBody.Should().Contain("newUsername", "response should contain new username");
    }

    [Fact]
    public async Task UpdateUsername_WithEmptyUsername_ShouldReturnBadRequest()
    {
        // Arrange - register a user to get tokens
        var signUpDto = new
        {
            Email = "updateuser-empty@test.com",
            Username = "user1",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Extract access token
        var accessCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access token cookie should exist");
        var accessTokenValue = accessCookie!.Split(';')[0].Split('=')[1];

        // Act - update with empty username
        var updateDto = new
        {
            NewUsername = ""
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateUsername")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token={accessTokenValue}");

        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Username cannot be empty");
    }

    [Fact]
    public async Task UpdateUsername_WithMissingToken_ShouldReturnUnauthorized()
    {
        // Arrange - no token provided
        var updateDto = new
        {
            NewUsername = "newUsername"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateUsername")
        {
            Content = updateContent
        };
        // No cookie set

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateUsername_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange - invalid token
        var updateDto = new
        {
            NewUsername = "newUsername"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateUsername")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token=invalidtoken");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid token");
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ UPDATE EMAIL TESTS ------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task UpdateEmail_WithValidToken_ShouldReturnOk_AndUpdateEmail()
    {
        // Arrange - register a user to get tokens
        var signUpDto = new
        {
            Email = "updateemail@test.com",
            Username = "updateEmailUser",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Extract access token
        var accessCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access token cookie should exist");
        var accessTokenValue = accessCookie.Split(';')[0].Split('=')[1];

        // Act - update email
        var updateDto = new
        {
            NewEmail = "newemail@test.com"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateEmail")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token={accessTokenValue}");

        var response = await _client.SendAsync(request);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("update email with valid token should succeed");

        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().Contain("Email updated successfully", "response should contain success message");
        responseBody.Should().Contain("newemail@test.com", "response should contain new email");
    }

    [Fact]
    public async Task UpdateEmail_WithEmptyEmail_ShouldReturnBadRequest()
    {
        // Arrange - register a user to get tokens
        var signUpDto = new
        {
            Email = "updateemail-empty@test.com",
            Username = "user1",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Extract access token
        var accessCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access token cookie should exist");
        var accessTokenValue = accessCookie!.Split(';')[0].Split('=')[1];

        // Act - update with empty email
        var updateDto = new
        {
            NewEmail = ""
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateEmail")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token={accessTokenValue}");

        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Email cannot be empty");
    }

    [Fact]
    public async Task UpdateEmail_WithInvalidEmailFormat_ShouldReturnBadRequest()
    {
        // Arrange - register a user to get tokens
        var signUpDto = new
        {
            Email = "updateemail-invalid@test.com",
            Username = "user1",
            Password = "Test123!"
        };
        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration should succeed");

        // Extract access token
        var accessCookie = registerResponse.Headers.GetValues("Set-Cookie")
            .FirstOrDefault(c => c.Contains("access_token"));
        accessCookie.Should().NotBeNull("access token cookie should exist");
        var accessTokenValue = accessCookie!.Split(';')[0].Split('=')[1];

        // Act - update with invalid email format
        var updateDto = new
        {
            NewEmail = "notanemail"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateEmail")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token={accessTokenValue}");

        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid email format");
    }

    [Fact]
    public async Task UpdateEmail_WithMissingToken_ShouldReturnUnauthorized()
    {
        // Arrange - no token provided
        var updateDto = new
        {
            NewEmail = "newemail@test.com"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateEmail")
        {
            Content = updateContent
        };
        // No cookie set

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateEmail_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange - invalid token
        var updateDto = new
        {
            NewEmail = "newemail@test.com"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateEmail")
        {
            Content = updateContent
        };
        request.Headers.Add("Cookie", $"access_token=invalidtoken");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid token");
    }
}
