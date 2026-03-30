using backend.Contracts;
using backend.DbContexts;
using backend.DTOs.Image;
using backend.DTOs.Listings;
using Microsoft.EntityFrameworkCore;
using Meilisearch;
using backend.Infrastructure.LogQueue;
using System.Text.Json;

namespace backend.Services
{

    public class ListingCommandService : IListingCommandService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ListingCommandService> _logger;
        private readonly IFileStorageService _fileStorageService;

        private readonly ILocationService _locationService;
        private readonly MeilisearchClient _meiliClient;
        private readonly ITopicManager _topicManager;

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

        public ListingCommandService(
            AppDbContext context,
            ILogger<ListingCommandService> logger,
            IFileStorageService fileStorageService,
            ILocationService locationService,
            MeilisearchClient client,
            ITopicManager topicManager)
        {
            _context = context;
            _logger = logger;
            _fileStorageService = fileStorageService;
            _locationService = locationService;
            _meiliClient = client;
            _topicManager = topicManager;
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

            var retainedPaths = await _context.Chatrooms
                .AsNoTracking()
                .Where(c => c.ListingId == listingId && c.ListingImageSnapshotPath != null)
                .Select(c => c.ListingImageSnapshotPath!)
                .Distinct()
                .ToListAsync(cancellationToken);

            var imagePaths = listingImages
                .Select(li => li.ImagePath)
                .Where(path => !string.IsNullOrWhiteSpace(path))
                .Where(path => !retainedPaths.Contains(path))
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

            // 4. Remove from Meilisearch index (best effort)
            try
            {
                var index = _meiliClient.Index("listings");
                await index.DeleteOneDocumentAsync(listingId.ToString(), cancellationToken: cancellationToken);
                _logger.LogInformation("Removed listing {ListingId} from Meilisearch", listingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove listing {ListingId} from Meilisearch", listingId);
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
                Size = request.Size,
                Brand = request.Brand,
                Category = request.Category,
                Condition = request.Condition,
                Colour = request.Colour,
                ProfileId = request.ProfileId,
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

                var searchDoc = new ListingSearchDto
                {
                    Id = listing.Id.ToString(),
                    Title = listing.Title,
                    Description = listing.Description,
                    Price = listing.Price,
                    Size = listing.Size,
                    Brand = listing.Brand,
                    Category = listing.Category,
                    Condition = listing.Condition,
                    Colour = listing.Colour,
                    FSA = listing.FSA,
                    CreatedAtTimestamp = new DateTimeOffset(listing.CreatedAt).ToUnixTimeSeconds(),
                    _geo = latlong
                };


                // We simply create the searchDoc and append it to the log to be handled by a Meillisearch worker
                await AppendToListingLog(listing.Id, searchDoc, ListingAction.Create);


                _logger.LogInformation("Appended Create listing {ListingId} log to LogQueue", listing.Id);
            }
            catch (Exception ex)
            {
                // We log the error but don't fail the request because the DB record is already saved.
                _logger.LogError(ex, "Failed to sync listing {ListingId} to Meilisearch", listing.Id);
            }



            return listing.Id;
        }

        public async Task DeleteAllFromUserAsync(Guid targetId)
        {
            var listingData = _context.Listings.AsNoTracking()
                .Where(l => l.ProfileId == targetId).ToList();

            foreach (Listing listing in listingData)
            {
                await DeleteListingAsync(listing.Id, listing.ProfileId);
                // The listing must exist if the query returned these 
                // to begin with. As such, this function call cannot 
                // throw an exception.
            }
        }

        // Method to add log to queue to be handled by workers
        private async Task AppendToListingLog(Guid listingID, ListingSearchDto searchData, ListingAction action)
        {
            try
            {
                var taskData = new ListingTaskData
                {
                    TaskId = Guid.NewGuid(),
                    Action = action,
                    SearchData = searchData,
                    ListingId = listingID,
                    CreatedAt = DateTime.UtcNow
                };

                // Serialize to JSON bytes
                byte[] logBytes = JsonSerializer.SerializeToUtf8Bytes(taskData);

                // Append to partition 0 of the "listings" topic, one day we may scale to multiple partitions if needed
                var partition = _topicManager.GetTopic("listings", 0);
                if (partition != null)
                {
                    await partition.AppendAsync(logBytes);
                    _logger.LogInformation("Listing task {TaskId} logged to 'listings' topic", taskData.TaskId);
                }
            }
            catch (Exception ex)
            {
                // missing retry logic 
                _logger.LogError(ex, "Failed to append listing task to log for {ListingId}", listingID);
            }
        }

    }
}
