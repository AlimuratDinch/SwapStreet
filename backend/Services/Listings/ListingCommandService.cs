using backend.Contracts;
using backend.DbContexts;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{

    public class ListingCommandService : IListingCommandService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ListingCommandService> _logger;
        private readonly IFileStorageService _fileStorageService;

        public ListingCommandService(AppDbContext context)
        {
            _context = context;
        }

        public ListingCommandService(
            AppDbContext context,
            ILogger<ListingCommandService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public ListingCommandService(
            AppDbContext context,
            ILogger<ListingCommandService> logger,
            IFileStorageService fileStorageService)
        {
            _context = context;
            _logger = logger;
            _fileStorageService = fileStorageService;
        }

        public async Task DeleteListingAsync(Guid listingId, Guid profileId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting listing {ListingId} for ProfileId {ProfileId}", listingId, profileId);

            // 1. Validate listing exists and belongs to profile

            var listing = await _context.Listings
                .FirstOrDefaultAsync(l => l.Id == listingId && l.ProfileId == profileId, cancellationToken);
            if (listing == null)
            {
                _logger.LogWarning("Listing {ListingId} not found for deletion", listingId);
                throw new ArgumentException($"Listing {listingId} not found");
            }

            // 2. Get images associated with listing
            var listingImages = await _context.ListingImages
                .Where(li => li.ListingId == listingId)
                .ToListAsync(cancellationToken);


            _context.ListingImages.RemoveRange(listingImages);
            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted listing {ListingId} successfully", listingId);
        }

        public async Task<Guid> CreateListingAsync(CreateListingRequestDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating listing for ProfileId {ProfileId}", request.ProfileId);

            // 1. Validate Images
            // if (request.Images == null || request.Images.Count == 0)
            // {
            //     _logger.LogWarning("No images provided for listing");
            //     throw new ArgumentException("At least one image is required");
            // }

            // 2. Validate FSA exists
            var fsa = await _context.Fsas
                .FirstOrDefaultAsync(f => f.Code == request.FSA, cancellationToken);
            if (fsa == null)
            {
                _logger.LogWarning("Invalid FSA {Fsa} for listing", request.FSA);
                throw new ArgumentException($"Invalid FSA: {request.FSA}");
            }

            // 3. Validate Profile exists (seller)
            var profile = await _context.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProfileId, cancellationToken);
            if (profile == null)
            {
                _logger.LogWarning("Profile {ProfileId} not found", request.ProfileId);
                throw new ArgumentException($"Profile {request.ProfileId} not found");
            }

            // 4. Validate Tag exists (optional)
            Tag? tag = null;
            if (request.TagId.HasValue)
            {
                tag = await _context.Tags
                    .FirstOrDefaultAsync(t => t.Id == request.TagId.Value, cancellationToken);
                if (tag == null)
                {
                    _logger.LogWarning("Tag {TagId} not found", request.TagId);
                    throw new ArgumentException($"Tag {request.TagId} not found");
                }
            }

            // 5. Create listing
            var listing = new Listing
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                ProfileId = request.ProfileId,
                TagId = request.TagId,
                FSA = request.FSA,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Listings.Add(listing);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created listing {ListingId} successfully", listing.Id);

            // 6. Upload images and create ListingImage records
            // int displayOrder = 0;
            // foreach (var imageFile in request.Images)
            // {
            //     try
            //     {
            //         // Create ListingImage entry directly (the file storage service will handle upload and DB entry)
            //         var listingImage = new ListingImage
            //         {
            //             Id = Guid.NewGuid(),
            //             ListingId = listing.Id,
            //             ImagePath = $"listing/{Guid.NewGuid()}_{imageFile.FileName}",
            //             DisplayOrder = displayOrder++,
            //             ForTryon = false,
            //             CreatedAt = DateTime.UtcNow
            //         };
            //         _context.ListingImages.Add(listingImage);

            //         _logger.LogInformation("Added image {ImageId} for listing {ListingId}", listingImage.Id, listing.Id);
            //     }
            //     catch (Exception ex)
            //     {
            //         _logger.LogError(ex, "Failed to process image for listing {ListingId}", listing.Id);
            //         throw;
            //     }
            // }

            await _context.SaveChangesAsync(cancellationToken);

            // _logger.LogInformation("Listing {ListingId} created successfully with {ImageCount} images", listing.Id, request.Images.Count);
            return listing.Id;
        }
    }
}
