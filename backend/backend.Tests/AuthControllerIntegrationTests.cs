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

namespace backend.Tests
{
    public abstract class AuthControllerIntegrationTests : IClassFixture<BackendTestFactory<Program>>
    {
        private readonly HttpClient _client;

        internal AuthControllerIntegrationTests(BackendTestFactory<Program> factory)
    {
            _client = factory.CreateClient();
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
                

                var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");

                // Act
                 var response = await _client.PostAsync("/api/auth/register", content);

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

            var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");

            
                 
                // Act
                var response = await _client.PostAsync("/api/auth/register", content);

                // Assert
                response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest, "registration should fail with missing email");

                var body = await response.Content.ReadAsStringAsync();
                body.Should().Contain("The Email field is required", "validation should report missing email");
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
              
                var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");

                // Act - first registration
                var firstResponse = await _client.PostAsync("/api/auth/register", content);
                firstResponse.IsSuccessStatusCode.Should().BeTrue("first registration should succeed");

                // Act - second registration with same email
                var secondResponse = await _client.PostAsync("/api/auth/register", content);

                // Assert
                secondResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest, "duplicate registration should fail");

                var body = await secondResponse.Content.ReadAsStringAsync();
                body.Should().Contain("already exists", "the API should return error about duplicate user/email");
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

                var content = new StringContent(JsonSerializer.Serialize(signUpDto), Encoding.UTF8, "application/json");
                
                // Act
                var response = await _client.PostAsync("/api/auth/register", content);

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
            var content = new StringContent(JsonSerializer.Serialize(signUpDto), System.Text.Encoding.UTF8, "application/json");
            var registerResponse = await _client.PostAsync("/api/auth/register", content);

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
    }
}
