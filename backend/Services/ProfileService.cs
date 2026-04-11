using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs.Profile;

namespace backend.Services
{
    public class ProfileService : IProfileService
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorage;

        public ProfileService(AppDbContext context, IFileStorageService fileStorage)
        {
            _context = context;
            _fileStorage = fileStorage;
        }

        public async Task<ProfileResponseDto?> GetProfileByIdAsync(Guid profileId)
        {
            var profile = await _context.Profiles
                .Include(p => p.City)
                    .ThenInclude(c => c!.Province)
                .FirstOrDefaultAsync(p => p.Id == profileId);

            if (profile == null)
                return null;

            return profile.ToResponseDto();
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
            var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.CityId);
            if (!cityExists)
            {
                throw new ArgumentException("Invalid CityId: City does not exist");
            }

            var profile = new Profile
            {
                Id = userId, // Profile ID matches User ID
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Bio = dto.Bio,
                CityId = dto.CityId,
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

            if (dto.CityId.HasValue)
            {
                var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.CityId.Value);
                if (!cityExists)
                {
                    throw new ArgumentException("Invalid CityId: City does not exist");
                }
                profile.CityId = dto.CityId.Value;
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

        public void DeleteProfile(Guid userId)
        {
            var profile = _context.Profiles.Find(userId);
            if (profile != null)
            {
                _context.Profiles.Remove(profile);
                _context.SaveChanges();
            }
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

        public async Task<List<ProfileReviewResponseDto>> GetProfileReviewsAsync(Guid userId)
        {
            var reviews = await _context.ChatRatings
                .AsNoTracking()
                .Where(r => r.RevieweeId == userId)
                .Include(r => r.Reviewer)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return reviews
                .Select(review => review.ToProfileReviewResponseDto(
                    ResolveReviewerProfileImageUrl(review.Reviewer?.ProfileImagePath)))
                .ToList();
        }

        public async Task DeleteProfileReviewAsync(Guid requesterId, Guid reviewId)
        {
            var review = await _context.ChatRatings.FirstOrDefaultAsync(r => r.Id == reviewId);
            if (review == null)
            {
                throw new KeyNotFoundException("Review not found");
            }

            if (review.ReviewerId != requesterId)
            {
                throw new UnauthorizedAccessException("You can only delete your own reviews");
            }

            var revieweeId = review.RevieweeId;

            _context.ChatRatings.Remove(review);
            await _context.SaveChangesAsync();

            await RecalculateProfileRatingAsync(revieweeId);
        }

        private async Task RecalculateProfileRatingAsync(Guid revieweeId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == revieweeId);
            if (profile == null)
            {
                return;
            }

            var ratings = await _context.ChatRatings
                .Where(r => r.RevieweeId == revieweeId)
                .Select(r => r.Stars)
                .ToListAsync();

            ProfileVerification.ApplyRatingsToProfile(profile, ratings);
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private string? ResolveReviewerProfileImageUrl(string? profileImagePath)
        {
            if (string.IsNullOrWhiteSpace(profileImagePath))
            {
                return null;
            }

            if (Uri.TryCreate(profileImagePath, UriKind.Absolute, out _))
            {
                return profileImagePath;
            }

            return _fileStorage.GetPublicFileUrl(profileImagePath);
        }

    }
}
