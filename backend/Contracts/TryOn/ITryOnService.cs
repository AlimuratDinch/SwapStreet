namespace backend.Contracts;

public interface ITryOnService
{
    Task<string> ProcessTryOnRequestAsync(string accessToken, string clothingImageUrl);

    //Task<string> ProcessTryOnFromUrlsAsync(string userImageUrl, string clothingImageUrl);
}