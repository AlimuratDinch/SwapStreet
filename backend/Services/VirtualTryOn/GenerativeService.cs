using backend.Contracts;
using JsonSerializer = System.Text.Json.JsonSerializer;
using Encoding = System.Text.Encoding;
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

        var client = _httpClientFactory.CreateClient();

        // Convert images to base64
        var userImageBase64 = Convert.ToBase64String(userImage);
        var clothingImageBase64 = Convert.ToBase64String(clothingImage);

        var requestBody = new
        {
            prompt = "Create a photorealistic image of the person wearing the provided clothing item. Precisely maintain the person's facial features, hairstyle, skin tone, and original pose. Adapt the clothing to fit naturally on the person's body, respecting proper draping, shadows, and fabric textures. Preserve the original lighting conditions and background. Ensure seamless integration of the clothing while maintaining the image's original resolution and quality.",
            user_image = userImageBase64,
            clothing_image = clothingImageBase64,
            temperature = 0.4, // Controls creativity vs determinism (0.0-1.0)
            top_k = 32, // Limits vocabulary for more focused output
            top_p = 0.8, // Nucleus sampling parameter
            candidate_count = 1, // Number of images to generate
            image_quality = "hd", // Can be "standard" or "hd"
            style_preset = "photographic", // Ensures photorealistic output
            negative_prompt = "distorted features, warped clothing, inconsistent lighting, blurry, artifacts",
            safety_settings = new[]
            {
                new { category = "HARM_CATEGORY_HARASSMENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_HATE_SPEECH", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold = "BLOCK_MEDIUM_AND_ABOVE" },
                new { category = "HARM_CATEGORY_DANGEROUS_CONTENT", threshold = "BLOCK_MEDIUM_AND_ABOVE" }
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var request = new HttpRequestMessage(HttpMethod.Post, apiUrl)
        {
            Content = content
        };
        request.Headers.Add("Authorization", $"Bearer {apiKey}");

        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<GeminiResponse>(responseContent);

        // Assuming the API returns base64 encoded image
        return Convert.FromBase64String(result.GeneratedImage);
    }

    private class GeminiResponse
    {
        public required string GeneratedImage { get; set; }
    }
}