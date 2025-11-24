namespace backend.DTOs.Profile
{
    public static class ProfileMapper
    {
        public static ProfileResponseDto ToResponseDto(this global::Profile profile)
        {
            return new ProfileResponseDto
            {
                Id = profile.Id,
                Status = profile.Status.ToString(),
                VerifiedSeller = profile.VerifiedSeller,
                FirstName = profile.FirstName,
                LastName = profile.LastName,
                Rating = profile.Rating,
                Bio = profile.Bio,
                LocationId = profile.LocationId,
                CityName = profile.City?.Name,
                ProvinceName = profile.City?.Province?.Name,
                ProvinceCode = profile.City?.Province?.Code,
                FSA = profile.FSA,
                ProfileImagePath = profile.ProfileImagePath,
                BannerImagePath = profile.BannerImagePath,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            };
        }
    }
}
