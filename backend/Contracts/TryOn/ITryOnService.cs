namespace backend.Contracts;

public interface ITryOnService
{
    Task<string> ProcessTryOnRequestAsync(Guid profileId, string clothingImageUrl);

    //Task<string> ProcessTryOnFromUrlsAsync(string userImageUrl, string clothingImageUrl);
}