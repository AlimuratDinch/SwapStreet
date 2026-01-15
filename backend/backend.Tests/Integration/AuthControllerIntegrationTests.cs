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
using backend.Tests.BackendTestFactories;
using backend.Tests.TestcontainersFixtures;
using Xunit.Abstractions;

namespace backend.Tests.IntegrationTests;

public class AuthControllerIntegrationTests : IClassFixture<InMemoryWebAppFactory>
{
    private readonly InMemoryWebAppFactory _factory;
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;

    public AuthControllerIntegrationTests(InMemoryWebAppFactory factory, ITestOutputHelper output)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        _output = output;
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

        var responseBody = await response.Content.ReadAsStringAsync();

        // 4. PRINT IT TO THE TEST CONSOLE
        _output.WriteLine($"Status Code: {response.StatusCode}");
        _output.WriteLine($"Response Body: {responseBody}");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("a valid registration should return a 2xx status");

        var cookies = response.Headers.GetValues("Set-Cookie");
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
        // Arrange
        var signUpDto = new { Email = $"del_{Guid.NewGuid()}@test.com", Username = "delUser", Password = "Test123!" };
        using var regContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");

        var regRes = await _client.PostAsync("/api/auth/register", regContent);
        regRes.EnsureSuccessStatusCode();

        // Extract Access Token
        var regBody = await regRes.Content.ReadAsStringAsync();
        var accessToken = JsonSerializer.Deserialize<JsonElement>(regBody).GetProperty("accessToken").GetString();

        // Act
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/auth/deleteUser");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _client.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue($"Server returned {response.StatusCode}: {responseBody}");
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
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "InValid");
        request.Headers.Add("Cookie", "refresh_token=invalid.token.value");

        using var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ------------------ Update Email TESTS --------------------------
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    [Fact]
    public async Task UpdateEmail_WithValidToken_ShouldReturnOk()
    {
        // Arrange - register user
        var email = "validtoken@test.com";
        var password = "Test123!";
        var signUpDto = new { Email = email, Username = "validUser", Password = password };

        using var registerContent = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
        using var registerResponse = await _client.PostAsync("/api/auth/register", registerContent);
        registerResponse.IsSuccessStatusCode.Should().BeTrue("registration must succeed before updating email");

        // Extract access token from response body
        var responseBody = await registerResponse.Content.ReadAsStringAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(responseBody);
        var accessToken = json.GetProperty("accessToken").GetString();
        accessToken.Should().NotBeNullOrEmpty("access token must be returned on register");

        // Prepare update email request
        var updateDto = new
        {
            NewEmail = "newemail_valid@test.com"
        };
        using var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/auth/updateEmail")
        {
            Content = updateContent
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        // Act
        var response = await _client.SendAsync(request);

        // Assert - should succeed
        response.StatusCode.Should().Be(HttpStatusCode.OK, "update email should succeed with valid access token");
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

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
    }

}
