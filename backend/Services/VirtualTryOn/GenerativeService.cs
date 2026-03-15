using backend.Contracts;
using Google.Cloud.AIPlatform.V1;
using Google.Protobuf;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace backend.Services;

public class GenerativeService : IGenerativeService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GenerativeService> _logger;

    public GenerativeService(
        IConfiguration configuration,
        ILogger<GenerativeService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<byte[]> GenerateImageAsync(byte[] userImage, byte[] clothingImage)
    {
        // Pulling Vertex AI specific configs instead of direct API keys
        var projectId = _configuration["VertexAI:ProjectId"];
        var location = _configuration["VertexAI:Location"] ?? "us-central1";
        var modelId = _configuration["VertexAI:ModelId"] ?? "gemini-2.5-flash-image";

        if (string.IsNullOrEmpty(projectId))
            throw new InvalidOperationException("Vertex AI ProjectId not configured");

        _logger.LogInformation("Generating image with Vertex AI. User image size: {UserSize} bytes, Clothing image size: {ClothingSize} bytes",
            userImage.Length, clothingImage.Length);

        try
        {
            // 1. Initialize the client (Auth is automatically handled via environment variables)
            var predictionServiceClient = await new PredictionServiceClientBuilder
            {
                Endpoint = $"{location}-aiplatform.googleapis.com"
            }.BuildAsync();

            var endpoint = $"projects/{projectId}/locations/{location}/publishers/google/models/{modelId}";

            const string promptText = "Create a photorealistic image of the person wearing the provided clothing item. Precisely maintain the person's facial features, hairstyle, skin tone, and original pose. Adapt the clothing to fit naturally on the person's body, respecting proper draping, shadows, and fabric textures. Preserve the original lighting conditions and background. Ensure seamless integration of the clothing while maintaining the image's original resolution and quality.";

            // 2. Build the request using the SDK's native objects
            var request = new GenerateContentRequest
            {
                Model = endpoint,
                Contents =
                {
                    new Content
                    {
                        Role = "user",
                        Parts =
                        {
                            new Part { Text = promptText },
                            new Part 
                            { 
                                InlineData = new Blob 
                                { 
                                    MimeType = "image/jpeg", 
                                    // SDK handles the byte payload directly
                                    Data = ByteString.CopyFrom(userImage) 
                                } 
                            },
                            new Part 
                            { 
                                InlineData = new Blob 
                                { 
                                    MimeType = "image/jpeg", 
                                    Data = ByteString.CopyFrom(clothingImage) 
                                } 
                            }
                        }
                    }
                },
                GenerationConfig = new GenerationConfig
                {
                    Temperature = 0.4f,
                    TopK = 32,
                    TopP = 0.8f
                },
                SafetySettings = 
                {
                    new SafetySetting { Category = HarmCategory.Harassment, Threshold = SafetySetting.Types.HarmBlockThreshold.BlockMediumAndAbove },
                    new SafetySetting { Category = HarmCategory.HateSpeech, Threshold = SafetySetting.Types.HarmBlockThreshold.BlockMediumAndAbove },
                    new SafetySetting { Category = HarmCategory.SexuallyExplicit, Threshold = SafetySetting.Types.HarmBlockThreshold.BlockMediumAndAbove },
                    new SafetySetting { Category = HarmCategory.DangerousContent, Threshold = SafetySetting.Types.HarmBlockThreshold.BlockMediumAndAbove }
                }
            };

            _logger.LogInformation("Sending request to Vertex AI: {Endpoint}", endpoint);
            
            // 3. Execute the request
            var response = await predictionServiceClient.GenerateContentAsync(request);

            // 4. Extract the generated image from the response payload
            var responsePart = response.Candidates?[0]?.Content?.Parts?[0];
            
            if (responsePart?.InlineData?.Data == null)
            {
                _logger.LogError("Vertex AI response did not contain inline image data. Raw response text: {Text}", responsePart?.Text);
                throw new InvalidOperationException("Could not find generated image data in API response.");
            }

            // Convert Protobuf ByteString back to a standard C# byte array
            var imageBytes = responsePart.InlineData.Data.ToByteArray();
            _logger.LogInformation("Successfully generated image. Size: {Size} bytes", imageBytes.Length);

            return imageBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during image generation with Vertex AI.");
            throw;
        }
    }
}