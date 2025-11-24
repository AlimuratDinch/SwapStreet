using backend.Contracts;
using backend.DbContexts;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ListingService : IListingService
    {
        private readonly AppDbContext _db;

        public ListingService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Listing?> GetByIdAsync(Guid id)
        {
            return await _db.Listings
                .Include(l => l.Profile)
                .Include(l => l.Tag)
                .FirstOrDefaultAsync(l => l.Id == id);
        }

        public async Task<IEnumerable<Listing>> GetAllAsync()
        {
            return await _db.Listings
                .Include(l => l.Profile)
                .Include(l => l.Tag)
                .ToListAsync();
        }

        public async Task<IEnumerable<Listing>> GetByProfileIdAsync(Guid profileId)
        {
            return await _db.Listings
                .Include(l => l.Profile)
                .Include(l => l.Tag)
                .Where(l => l.ProfileId == profileId)
                .ToListAsync();
        }

        public async Task<Listing> CreateAsync(Listing listing, List<ListingImage> images)
        {
            listing.Id = Guid.NewGuid();
            listing.CreatedAt = DateTime.UtcNow;
            listing.UpdatedAt = DateTime.UtcNow;

            _db.Listings.Add(listing);

            // Add associated images
            foreach (var image in images)
            {
                image.Id = Guid.NewGuid();
                image.ListingId = listing.Id;
                image.CreatedAt = DateTime.UtcNow;
                _db.ListingImages.Add(image);
            }

            await _db.SaveChangesAsync();
            return listing;
        }

        public async Task<Listing?> UpdateAsync(Guid id, Listing listing)
        {
            var existingListing = await _db.Listings.FindAsync(id);
            if (existingListing == null) return null;

            existingListing.Name = listing.Name;
            existingListing.Price = listing.Price;
            existingListing.Description = listing.Description;
            existingListing.TagId = listing.TagId;
            existingListing.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return existingListing;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var listing = await _db.Listings
                .Include(l => l.Images)
                .FirstOrDefaultAsync(l => l.Id == id);
            
            if (listing == null) return false;

            // Remove associated images
            _db.ListingImages.RemoveRange(listing.Images);
            
            _db.Listings.Remove(listing);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
