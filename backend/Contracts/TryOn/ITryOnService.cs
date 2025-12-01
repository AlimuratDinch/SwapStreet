namespace backend.Contracts;

public interface ITryOnService
{
    Task<string> ProcessTryOnRequestAsync(Guid userId, string clothingImageUrl);

    //Task<string> ProcessTryOnFromUrlsAsync(string userImageUrl, string clothingImageUrl);
}