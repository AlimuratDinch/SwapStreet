namespace YourApp.Contracts;

public interface IGeminiImageGenerationService
{
    Task<byte[]> GenerateImageAsync(byte[] userImage, byte[] clothingImage);
}