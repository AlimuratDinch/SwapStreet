using backend.Contracts;
using System.Text.Json;
using System.Text;
using System.Text.Json.Serialization;
using System.Linq;

namespace backend.Services;

public class GenerativeService : IGenerativeService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GenerativeService> _logger;

    public GenerativeService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<GenerativeService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<byte[]> GenerateImageAsync(byte[] userImage, byte[] clothingImage)
    {
        var apiKey = _configuration["Gemini:ApiKey"];
        var apiUrl = _configuration["Gemini:ApiUrl"];
        const string GeminiModel = "gemini-2.5-flash-image";
        const string GeminiMethod = "generateContent";

        if (string.IsNullOrEmpty(apiKey))
            throw new InvalidOperationException("Gemini API key not configured");

        if (string.IsNullOrEmpty(apiUrl))
            throw new InvalidOperationException("Gemini API URL not configured");

        _logger.LogInformation("Generating image with Gemini API. User image size: {UserSize} bytes, Clothing image size: {ClothingSize} bytes",
            userImage.Length, clothingImage.Length);

        // Construct URL: baseUrl/models/{model}:{method}
        // Example: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
        var baseUrl = apiUrl.TrimEnd('/');
        // Remove /models/ if it's already in the base URL to avoid duplication
        if (baseUrl.EndsWith("/models", StringComparison.OrdinalIgnoreCase))
        {
            baseUrl = baseUrl.Substring(0, baseUrl.Length - "/models".Length);
        }
        var fullApiUrl = $"{baseUrl}/models/{GeminiModel}:{GeminiMethod}";

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromMinutes(3); // Image generation can take time

        // Convert images to base64
        var userImageBase64 = Convert.ToBase64String(userImage);
        var clothingImageBase64 = Convert.ToBase64String(clothingImage);

        // Define the prompt for virtual try-on
        const string promptText = "Create a photorealistic image of the person wearing the provided clothing item. Precisely maintain the person's facial features, hairstyle, skin tone, and original pose. Adapt the clothing to fit naturally on the person's body, respecting proper draping, shadows, and fabric textures. Preserve the original lighting conditions and background. Ensure seamless integration of the clothing while maintaining the image's original resolution and quality.";

        // Determine request format based on API URL
        // If it's a Google Gemini API, use the standard format
        // Otherwise, use a simpler format that might work with custom endpoints
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        // 1. Text Prompt Part
                        new { text = promptText },
                        
                        // 2. User Image Part
                        new { inlineData = new { mimeType = "image/jpeg", data = userImageBase64 } },
                        
                        // 3. Clothing Image Part
                        new { inlineData = new { mimeType = "image/jpeg", data = clothingImageBase64 } }
                    }
                }
            },

            // Configuration sections (ensure these keys are camelCase in the final JSON)
            generationConfig = new
            {
                temperature = 0.4,
                topK = 32,
                topP = 0.8
            },

            safetySettings = new[]
            {
                new { category = "HARM_CATEGORY_HARASSMENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_HATE_SPEECH", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_DANGEROUS_CONTENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" }
            }
        };

        var jsonOptions = new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var jsonBody = JsonSerializer.Serialize(requestBody, jsonOptions);
        _logger.LogInformation("Request body (first 500 chars): {RequestBody}",
            jsonBody.Length > 500 ? jsonBody.Substring(0, 500) + "..." : jsonBody);

        var content = new StringContent(
            jsonBody,
            Encoding.UTF8,
            "application/json");

        var request = new HttpRequestMessage(HttpMethod.Post, $"{fullApiUrl}?key={apiKey}")
        {
            Content = content
        };

        // Use x-goog-api-key header for Gemini API, or Authorization Bearer if it's a custom endpoint
        // Check if URL contains googleapis.com to determine header format
        if (apiUrl.Contains("googleapis.com", StringComparison.OrdinalIgnoreCase))
        {
            request.Headers.Add("x-goog-api-key", apiKey);
        }
        else
        {
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
        }

        try
        {
            _logger.LogInformation("Sending request to Gemini API: {ApiUrl}", apiUrl);
            var response = await client.SendAsync(request);

            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini API request failed with status {StatusCode}. Response: {Response}",
                    response.StatusCode, responseContent);
                throw new HttpRequestException($"Gemini API request failed with status {response.StatusCode}: {responseContent}");
            }

            _logger.LogInformation("Received response from Gemini API. Response length: {Length} characters", responseContent.Length);
            _logger.LogInformation("Response content (first 1000 chars): {Response}",
                responseContent.Length > 1000 ? responseContent.Substring(0, 1000) + "..." : responseContent);

            // Try to parse the response - Gemini API returns images in candidates[0].content.parts[0].inlineData.data
            using var jsonDoc = JsonDocument.Parse(responseContent);
            var root = jsonDoc.RootElement;

            var generatedImageBase64 = root.GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("inlineData")
            .GetProperty("data").GetString();

            if (string.IsNullOrEmpty(generatedImageBase64))
            {
                throw new InvalidOperationException("Could not find generated image (base64 data) in API response.");
            }

            var imageBytes = Convert.FromBase64String(generatedImageBase64);
            _logger.LogInformation("Successfully generated image. Size: {Size} bytes", imageBytes.Length);

            return imageBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during image generation.");
            throw;
        }
    }

    private class GeminiResponse
    {
        [JsonPropertyName("generated_image")]
        public string? GeneratedImage { get; set; }

        [JsonPropertyName("GeneratedImage")]
        public string? GeneratedImageAlt { get; set; }

        // Property to handle both naming conventions
        public string GeneratedImageValue => GeneratedImage ?? GeneratedImageAlt ?? throw new InvalidOperationException("GeneratedImage field not found in response");
    }
}