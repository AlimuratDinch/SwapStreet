namespace backend.Contracts;

public interface ITryOnService
{
    Task<string> ProcessTryOnRequestAsync(Guid profileId, string clothingImageUrl);

    Task AddGeneratedImage(Guid userId, Guid listingId, string fileName);

    //Task<string> ProcessTryOnFromUrlsAsync(string userImageUrl, string clothingImageUrl);
}