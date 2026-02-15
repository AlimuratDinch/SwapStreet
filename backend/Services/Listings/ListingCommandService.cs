using backend.Contracts;
using backend.DbContexts;
using backend.DTOs;
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

        public ListingCommandService(AppDbContext context,MeilisearchClient client)
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
