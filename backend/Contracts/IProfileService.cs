using backend.DTOs.Profile;

namespace backend.Contracts
{
    public interface IProfileService
    {
        Task<ProfileResponseDto?> GetProfileByIdAsync(Guid profileId);
        Task<ProfileResponseDto?> GetProfileByUserIdAsync(Guid userId);
        Task<ProfileResponseDto> CreateProfileAsync(Guid userId, CreateProfileDto dto);
        Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
        Task<bool> DeleteProfileAsync(Guid userId);
        Task<bool> ProfileExistsAsync(Guid userId);
    }
}
