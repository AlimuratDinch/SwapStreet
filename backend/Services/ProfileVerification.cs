namespace backend.Services;

/// <summary>
/// Derives seller verification from aggregated chat ratings (same source as profile rating).
/// </summary>
public static class ProfileVerification
{
    public const int MinReviewsForVerification = 5;
    public const double MinAverageStarsForVerification = 4.0;

    public static bool IsVerifiedSeller(int reviewCount, double averageStars) =>
        reviewCount >= MinReviewsForVerification
        && averageStars >= MinAverageStarsForVerification;

    public static void ApplyRatingsToProfile(Profile profile, IReadOnlyList<int> stars)
    {
        var count = stars.Count;
        var average = count == 0 ? 0d : stars.Average();
        profile.Rating = count == 0 ? 0f : (float)average;
        profile.VerifiedSeller = IsVerifiedSeller(count, average);
    }
}
