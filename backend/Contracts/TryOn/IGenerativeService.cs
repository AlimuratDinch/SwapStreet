namespace backend.Contracts;

public interface IGenerativeService
{
    Task<byte[]> GenerateImageAsync(byte[] userImage, byte[] clothingImage);
}