using backend.Contracts;
using backend.DbContexts;
using backend.DTOs;
using backend.DTOs.Image;
using Microsoft.EntityFrameworkCore;
using Meilisearch;

namespace backend.Services
{

    public class ListingCommandService : IListingCommandService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ListingCommandService> _logger;
        private readonly IFileStorageService _fileStorageService;

        private readonly ILocationService _locationService;
        private readonly MeilisearchClient _meiliClient;

        public ListingCommandService(AppDbContext context, MeilisearchClient client)
        {
            _context = context;
            _meiliClient = client;

        }

        public ListingCommandService(
            AppDbContext context,
            ILogger<ListingCommandService> logger,
            ILocationService locationService,
            MeilisearchClient client)
        {
            _context = context;
            _logger = logger;
            _locationService = locationService;
            _meiliClient = client;
        }

        public ListingCommandService(
            AppDbContext context,
            ILogger<ListingCommandService> logger,
            IFileStorageService fileStorageService,
            ILocationService locationService,
            MeilisearchClient client)
        {
            _context = context;
            _logger = logger;
            _fileStorageService = fileStorageService;
            _locationService = locationService;
            _meiliClient = client;
        }

        public async Task DeleteListingAsync(Guid listingId, Guid profileId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting listing {ListingId} for ProfileId {ProfileId}", listingId, profileId);

            // 1. Validate listing exists and belongs to profile
            var listing = await _context.Listings
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == listingId && l.ProfileId == profileId, cancellationToken);
            if (listing == null)
            {
                _logger.LogWarning("Listing {ListingId} not found for deletion", listingId);
                throw new ArgumentException($"Listing {listingId} not found");
            }

            // Fetch image paths up front so storage cleanup can happen before DB changes
            var listingImages = await _context.ListingImages
                .AsNoTracking()
                .Where(li => li.ListingId == listingId)
                .ToListAsync(cancellationToken);

            var imagePaths = listingImages
                .Select(li => li.ImagePath)
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .ToList();

            // 2. Delete images from MinIO first to avoid DB deletes if storage fails
            if (imagePaths.Count != 0)
            {
                if (_fileStorageService == null)
                {
                    _logger.LogError("File storage service not available for listing deletion {ListingId}", listingId);
                    throw new InvalidOperationException("File storage service not available for listing deletion.");
                }

                var failedDeletes = await _fileStorageService.DeleteFilesAsync(UploadType.Listing, imagePaths, cancellationToken);
                if (failedDeletes.Count != 0)
                {
                    throw new InvalidOperationException($"Failed to delete {failedDeletes.Count} image(s) for listing {listingId}");
                }
            }

            // 3. Delete listing and image rows in a single DB transaction
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if (listingImages.Count != 0)
                {
                    _context.ListingImages.RemoveRange(listingImages);
                }

                _context.Listings.Remove(listing);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Deleted listing {ListingId} and {ImageCount} images from database", listingId, listingImages.Count);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Failed to delete listing {ListingId}", listingId);
                throw;
            }
        }

        public async Task<Guid> CreateListingAsync(CreateListingRequestDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating listing for ProfileId {ProfileId}", request.ProfileId);

            // 1. Validate FSA (and get coordinates for proximity search)
            var fsa = await _context.Fsas
                .FirstOrDefaultAsync(f => f.Code == request.FSA, cancellationToken);
            if (fsa == null) throw new ArgumentException($"Invalid FSA: {request.FSA}");

            // 2. Validate Profile
            var profileExists = await _context.Profiles.AnyAsync(p => p.Id == request.ProfileId, cancellationToken);
            if (!profileExists) throw new ArgumentException($"Profile {request.ProfileId} not found");

            // 3. Create listing entity
            var listing = new Listing
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                ProfileId = request.ProfileId,
                TagId = null,
                FSA = request.FSA,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Listings.Add(listing);
            await _context.SaveChangesAsync(cancellationToken);


            var latlong = await _locationService.getLatLongFromFSAAsync(request.FSA);

            // 4. Sync to Meilisearch
            try
            {
                var index = _meiliClient.Index("listings");

                var searchDoc = new ListingSearchDto
                {
                    Id = listing.Id.ToString(),
                    Title = listing.Title,
                    Description = listing.Description,
                    FSA = listing.FSA,
                    CreatedAtTimestamp = new DateTimeOffset(listing.CreatedAt).ToUnixTimeSeconds(),
                    _geo = latlong
                };


                await index.AddDocumentsAsync(new[] { searchDoc }, cancellationToken: cancellationToken);

                _logger.LogInformation("Synced listing {ListingId} to Meilisearch", listing.Id);
            }
            catch (Exception ex)
            {
                // We log the error but don't fail the request because the DB record is already saved.
                _logger.LogError(ex, "Failed to sync listing {ListingId} to Meilisearch", listing.Id);
            }

            return listing.Id;
        }
    }
}
