namespace backend.Contracts;

public interface ITryOnService
{
    Task<string> ProcessTryOnRequestAsync(string accessToken, string pathFromUrl);
}