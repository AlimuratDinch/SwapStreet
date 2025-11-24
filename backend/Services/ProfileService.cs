using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs.Profile;

namespace backend.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _context;

        public ProfileService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ProfileResponseDto?> GetProfileByIdAsync(Guid profileId)
        {
            var profile = await _context.Profiles
                .Include(p => p.City)
                    .ThenInclude(c => c!.Province)
                .FirstOrDefaultAsync(p => p.Id == profileId);

            if (profile == null)
                return null;

            return MapToResponseDto(profile);
        }

        public async Task<ProfileResponseDto?> GetProfileByUserIdAsync(Guid userId)
        {
            // Profile.Id is the same as User.Id (Auth User PK)
            return await GetProfileByIdAsync(userId);
        }

        public async Task<ProfileResponseDto> CreateProfileAsync(Guid userId, CreateProfileDto dto)
        {
            // Check if profile already exists
            if (await ProfileExistsAsync(userId))
            {
                throw new InvalidOperationException("Profile already exists for this user");
            }

            // Validate that the city exists
            var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.LocationId);
            if (!cityExists)
            {
                throw new ArgumentException("Invalid LocationId: City does not exist");
            }

            var profile = new Profile
            {
                Id = userId, // Profile ID matches User ID
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Bio = dto.Bio,
                LocationId = dto.LocationId,
                FSA = dto.FSA.ToUpper(),
                ProfileImagePath = dto.ProfileImagePath,
                BannerImagePath = dto.BannerImagePath,
                Status = ProfileStatusEnum.Offline,
                VerifiedSeller = false,
                Rating = 0.0f,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();

            return (await GetProfileByIdAsync(profile.Id))!;
        }

        public async Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
        {
            var profile = await _context.Profiles.FindAsync(userId);
            if (profile == null)
            {
                throw new KeyNotFoundException("Profile not found");
            }

            // Update only provided fields
            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                profile.FirstName = dto.FirstName;

            if (!string.IsNullOrWhiteSpace(dto.LastName))
                profile.LastName = dto.LastName;

            if (dto.Bio != null)
                profile.Bio = dto.Bio;

            if (dto.LocationId.HasValue)
            {
                var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.LocationId.Value);
                if (!cityExists)
                {
                    throw new ArgumentException("Invalid LocationId: City does not exist");
                }
                profile.LocationId = dto.LocationId.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.FSA))
                profile.FSA = dto.FSA.ToUpper();

            if (dto.ProfileImagePath != null)
                profile.ProfileImagePath = dto.ProfileImagePath;

            if (dto.BannerImagePath != null)
                profile.BannerImagePath = dto.BannerImagePath;

            if (dto.Status.HasValue)
                profile.Status = dto.Status.Value;

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (await GetProfileByIdAsync(profile.Id))!;
        }

        public async Task<bool> DeleteProfileAsync(Guid userId)
        {
            var profile = await _context.Profiles.FindAsync(userId);
            if (profile == null)
                return false;

            _context.Profiles.Remove(profile);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ProfileExistsAsync(Guid userId)
        {
            return await _context.Profiles.AnyAsync(p => p.Id == userId);
        }

        private ProfileResponseDto MapToResponseDto(Profile profile)
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
