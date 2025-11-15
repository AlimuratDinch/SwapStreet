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

        if (string.IsNullOrEmpty(apiKey))
            throw new InvalidOperationException("Gemini API key not configured");

        if (string.IsNullOrEmpty(apiUrl))
            throw new InvalidOperationException("Gemini API URL not configured");

        _logger.LogInformation("Generating image with Gemini API. User image size: {UserSize} bytes, Clothing image size: {ClothingSize} bytes", 
            userImage.Length, clothingImage.Length);

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromMinutes(3); // Image generation can take time

        // Convert images to base64
        var userImageBase64 = Convert.ToBase64String(userImage);
        var clothingImageBase64 = Convert.ToBase64String(clothingImage);

        // Determine request format based on API URL
        // If it's a Google Gemini API, use the standard format
        // Otherwise, use a simpler format that might work with custom endpoints
        object requestBody;
        
        if (apiUrl.Contains("googleapis.com", StringComparison.OrdinalIgnoreCase) || 
            apiUrl.Contains("generativelanguage.googleapis.com", StringComparison.OrdinalIgnoreCase))
        {
            // Standard Gemini API format
            // Create parts array with explicit type to avoid compilation issues
            var textPart = new { text = "Create a photorealistic image of the person wearing the provided clothing item. Precisely maintain the person's facial features, hairstyle, skin tone, and original pose. Adapt the clothing to fit naturally on the person's body, respecting proper draping, shadows, and fabric textures. Preserve the original lighting conditions and background. Ensure seamless integration of the clothing while maintaining the image's original resolution and quality." };
            var userImagePart = new { inline_data = new { mime_type = "image/jpeg", data = userImageBase64 } };
            var clothingImagePart = new { inline_data = new { mime_type = "image/jpeg", data = clothingImageBase64 } };
            
            var parts = new object[] { textPart, userImagePart, clothingImagePart };
            
            var contentItem = new { parts = parts };
            var contents = new[] { contentItem };
            
            var generationConfig = new
            {
                temperature = 0.4,
                topK = 32,
                topP = 0.8,
                maxOutputTokens = 8192
            };
            
            var safetySettings = new[]
            {
                new { category = "HARM_CATEGORY_HARASSMENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_HATE_SPEECH", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_DANGEROUS_CONTENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" }
            };
            
            requestBody = new
            {
                contents = contents,
                generationConfig = generationConfig,
                safetySettings = safetySettings
            };
        }
        else
        {
            // Custom API format - try a simpler structure
            // This might need to be adjusted based on your actual API
            requestBody = new
            {
                userImage = userImageBase64,
                clothingImage = clothingImageBase64,
                prompt = "Create a photorealistic image of the person wearing the provided clothing item. Precisely maintain the person's facial features, hairstyle, skin tone, and original pose. Adapt the clothing to fit naturally on the person's body, respecting proper draping, shadows, and fabric textures. Preserve the original lighting conditions and background. Ensure seamless integration of the clothing while maintaining the image's original resolution and quality."
            };
        }

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

        var request = new HttpRequestMessage(HttpMethod.Post, apiUrl)
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
            
            string? generatedImageBase64 = null;
            
            // Try different response formats
            // Format 1: Standard Gemini API format - candidates[0].content.parts[0].inlineData.data
            if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var candidateContent))
                {
                    if (candidateContent.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                    {
                        var firstPart = parts[0];
                        if (firstPart.TryGetProperty("inlineData", out var inlineData))
                        {
                            if (inlineData.TryGetProperty("data", out var data))
                            {
                                generatedImageBase64 = data.GetString();
                                _logger.LogInformation("Found image in candidates[0].content.parts[0].inlineData.data");
                            }
                        }
                    }
                }
            }
            
            // Format 2: Direct generated_image field
            if (string.IsNullOrEmpty(generatedImageBase64) && root.TryGetProperty("generated_image", out var generatedImage))
            {
                generatedImageBase64 = generatedImage.GetString();
                _logger.LogInformation("Found image in generated_image field");
            }
            
            // Format 3: GeneratedImage field (PascalCase)
            if (string.IsNullOrEmpty(generatedImageBase64) && root.TryGetProperty("GeneratedImage", out var generatedImageAlt))
            {
                generatedImageBase64 = generatedImageAlt.GetString();
                _logger.LogInformation("Found image in GeneratedImage field");
            }
            
            // Format 4: Try deserializing as GeminiResponse
            if (string.IsNullOrEmpty(generatedImageBase64))
            {
                var result = JsonSerializer.Deserialize<GeminiResponse>(responseContent, jsonOptions);
                if (result != null)
                {
                    try
                    {
                        generatedImageBase64 = result.GeneratedImageValue;
                        _logger.LogInformation("Found image using GeminiResponse deserialization");
                    }
                    catch
                    {
                        // Ignore and continue
                    }
                }
            }

            if (string.IsNullOrEmpty(generatedImageBase64))
            {
                _logger.LogError("Could not find generated image in response. Response structure: {Response}", responseContent);
                throw new InvalidOperationException($"Could not find generated image in API response. Response keys: {string.Join(", ", root.EnumerateObject().Select(p => p.Name))}");
            }

            // Decode base64 image
            try
            {
                var imageBytes = Convert.FromBase64String(generatedImageBase64);
                _logger.LogInformation("Successfully generated image. Size: {Size} bytes", imageBytes.Length);
                return imageBytes;
            }
            catch (FormatException ex)
            {
                _logger.LogError(ex, "Failed to decode base64 image from Gemini API response");
                throw new InvalidOperationException("Failed to decode base64 image from API response", ex);
            }
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Request to Gemini API timed out");
            throw new TimeoutException("Request to Gemini API timed out", ex);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error occurred while calling Gemini API");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred while generating image");
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