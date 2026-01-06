using Microsoft.EntityFrameworkCore;
using backend.Contracts;
using backend.Models;
using backend.DbContexts;

namespace backend.Services;
{
    public class ListingSearchService : IListingSearchService
    {
        private readonly AppDbContext _db;

        public ListingSearchService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Listing>> SearchListingsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return Enumerable.Empty<Listing>();

            string normalizedQuery = query.Trim().ToLower();

            return await _db.Listings
                .AsNoTracking()
                .Where(l => l.Title.ToLower().Contains(normalizedQuery) ||
                            l.Description.ToLower().Contains(normalizedQuery))
                .ToListAsync();
        }
    }
}