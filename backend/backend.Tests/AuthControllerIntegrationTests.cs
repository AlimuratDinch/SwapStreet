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
using Microsoft.Extensions.DependencyInjection;

public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        Environment.SetEnvironmentVariable("USE_INMEMORY_DB", "true");

        _factory = factory;
        
        // Resolve the backend project folder reliably (handles different test run working dirs)
        var baseDir = AppContext.BaseDirectory ?? Directory.GetCurrentDirectory();

        // Try common relative locations (adjust the .. count if your test assembly layout differs)
        var candidates = new[]
        {
            Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "backend")),
            Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "backend")),
            Path.GetFullPath(Path.Combine(baseDir, "..", "..", "backend")),
            Path.GetFullPath(Path.Combine(baseDir, "..", "backend")),
            Path.GetFullPath(Path.Combine(baseDir, "backend"))
        };

        string? projectDir = candidates.FirstOrDefault(Directory.Exists);

        if (projectDir is null)
            throw new DirectoryNotFoundException($"Could not locate backend project folder. Tried: {string.Join(", ", candidates.Select(p => p))}");

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
    // ------------------ DELETE USER TESTS --------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task DeleteUser_ShouldReturnOk_AndRemoveCookies()
    {
        // Arrange - register user (register sets cookies)
        var email = "delete@test.com";
        var password = "Test123!";
        var signUpDto = new { Email = email, Username = "deleteUser", Password = password };

        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration must succeed before delete");

        // Extract refresh_token cookie value
        var setCookies = registerResponse.Headers.GetValues("Set-Cookie").ToArray();
        var refreshCookie = setCookies.FirstOrDefault(c => c.Contains("refresh_token"));
        refreshCookie.Should().NotBeNull("refresh_token cookie must be set on register/signin");
        var refreshToken = refreshCookie.Split(';')[0].Split('=')[1];

        // Act - send delete request with refresh token cookie
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/auth/deleteUser");
        request.Headers.Add("Cookie", $"refresh_token={refreshToken}");
        using var deleteResponse = await _client.SendAsync(request);

        // Assert - success
        deleteResponse.IsSuccessStatusCode.Should().BeTrue("delete user should return success");

        var deleteCookies = deleteResponse.Headers.GetValues("Set-Cookie");
        deleteCookies.Should().Contain(c => c.StartsWith("access_token=;"), "access_token cookie should be cleared");
        deleteCookies.Should().Contain(c => c.StartsWith("refresh_token=;"), "refresh_token cookie should be cleared");

    }

    [Fact]
    public async Task DeleteUser_WithoutToken_ReturnsUnauthorized()
    {
        // Act - call delete without cookie
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/auth/deleteUser");
        using var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteUser_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange - craft invalid refresh token
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/auth/deleteUser");
        request.Headers.Add("Cookie", "refresh_token=invalid.token.value");

        using var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ Update Email TESTS --------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
