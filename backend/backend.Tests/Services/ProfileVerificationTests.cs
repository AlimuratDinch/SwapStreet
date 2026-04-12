using System;
using System.Collections.Generic;
using AwesomeAssertions;
using backend.Services;
using Xunit;

namespace backend.Tests.Services;

public class ProfileVerificationTests
{
    private static Profile CreateMinimalProfile() => new()
    {
        Id = Guid.NewGuid(),
        Status = ProfileStatusEnum.Offline,
        FirstName = "T",
        LastName = "U",
        CityId = 1,
        FSA = "M5V"
    };

    [Theory]
    [InlineData(0, 0, false)]
    [InlineData(4, 5.0, false)]
    [InlineData(5, 3.99, false)]
    [InlineData(5, 4.0, true)]
    [InlineData(5, 5.0, true)]
    [InlineData(6, 4.0, true)]
    public void IsVerifiedSeller_RespectsCountAndAverage(
        int reviewCount,
        double averageStars,
        bool expected)
    {
        ProfileVerification.IsVerifiedSeller(reviewCount, averageStars)
            .Should()
            .Be(expected);
    }

    [Fact]
    public void ApplyRatingsToProfile_EmptyStars_ZeroRatingNotVerified()
    {
        var profile = CreateMinimalProfile();
        ProfileVerification.ApplyRatingsToProfile(profile, Array.Empty<int>());
        profile.Rating.Should().Be(0f);
        profile.VerifiedSeller.Should().BeFalse();
    }

    [Fact]
    public void ApplyRatingsToProfile_FiveStarsAtFourAverage_SetsVerified()
    {
        var profile = CreateMinimalProfile();
        var stars = new List<int> { 4, 4, 4, 4, 4 };
        ProfileVerification.ApplyRatingsToProfile(profile, stars);
        profile.Rating.Should().Be(4.0f);
        profile.VerifiedSeller.Should().BeTrue();
    }

    [Fact]
    public void ApplyRatingsToProfile_FiveReviewsBelowFourAverage_NotVerified()
    {
        var profile = CreateMinimalProfile();
        var stars = new List<int> { 4, 4, 4, 4, 3 };
        ProfileVerification.ApplyRatingsToProfile(profile, stars);
        profile.Rating.Should().BeApproximately(3.8f, 0.01f);
        profile.VerifiedSeller.Should().BeFalse();
    }
}
