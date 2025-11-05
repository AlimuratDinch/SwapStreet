namespace YourApp.Services;

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
            prompt = "Generate a realistic image showing the person wearing the provided clothing item. Maintain the person's features and pose while naturally fitting the clothing.",
            user_image = userImageBase64,
            clothing_image = clothingImageBase64,
            // Add other parameters as needed by Gemini/Stable Diffusion API
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
        public string GeneratedImage { get; set; }
    }
}