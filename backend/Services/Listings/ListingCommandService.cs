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

        public async Task<Guid> CreateListingAsync(CreateListingRequestDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating listing for ProfileId {ProfileId}", request.ProfileId);

            // 1. Validate FSA exists
            var fsa = await _context.Fsas
                .FirstOrDefaultAsync(f => f.Code == request.FSA, cancellationToken);
            if (fsa == null)
            {
                _logger.LogWarning("Invalid FSA {Fsa} for listing", request.FSA);
                throw new ArgumentException($"Invalid FSA: {request.FSA}");
            }

            // 2. Validate Profile exists (seller)
            var profile = await _context.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProfileId, cancellationToken);
            if (profile == null)
            {
                _logger.LogWarning("Profile {ProfileId} not found", request.ProfileId);
                throw new ArgumentException($"Profile {request.ProfileId} not found");
            }

            // 3. Validate Tag exists (optional)
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

            // 4. Create listing
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
            return listing.Id;
        }
    }
}
