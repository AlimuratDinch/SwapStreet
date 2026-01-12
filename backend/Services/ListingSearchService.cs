using Microsoft.EntityFrameworkCore;
using backend.Contracts;
using backend.Models;
using backend.DbContexts;
using backend.DTOs.CatalogDTOs;
using NpgsqlTypes;
using Npgsql.EntityFrameworkCore.PostgreSQL;


namespace backend.Services
{
    public sealed class ListingSearchService : IListingSearchService
    {
        private readonly AppDbContext _db;

        public ListingSearchService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(IReadOnlyList<Listing> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
                string query,
                int pageSize,
                string? cursor
            )
        {
            if (string.IsNullOrWhiteSpace(query))
                return (Array.Empty<Listing>(), null, false);

            // Decode cursor if present
            ListingCursor? decodedCursor = null;
            ListingCursor.TryDecode(cursor, out decodedCursor);

            // Build tsquery (light fuzzy)
            var tsQuery = EF.Functions.PlainToTsQuery("english", query);

            // Base query with ranking
            var baseQuery =
                _db.Listings
                .AsNoTracking()
                .Select(l => new
                {
                    Listing = l,
                    Rank = l.SearchVector.RankCoverDensity(tsQuery)
                })
                .Where(x => x.Rank > 0)
                .OrderByDescending(x => x.Rank)
                .ThenByDescending(x => x.Listing.CreatedAt)
                .ThenByDescending(x => x.Listing.Id);

            // Cursor pagination filter
            if (decodedCursor != null)
            {
                baseQuery = baseQuery.Where(x =>
                    x.Rank < decodedCursor.Rank
                    || (x.Rank == decodedCursor.Rank &&
                        x.Listing.CreatedAt < decodedCursor.CreatedAt)
                    || (x.Rank == decodedCursor.Rank &&
                        x.Listing.CreatedAt == decodedCursor.CreatedAt &&
                        x.Listing.Id.CompareTo(decodedCursor.Id) < 0)
                )
                .OrderByDescending(x => x.Rank)
                .ThenByDescending(x => x.Listing.CreatedAt)
                .ThenByDescending(x => x.Listing.Id);
            }

            // Fetch one extra row to determine HasNextPage
            var results = await baseQuery
                .Take(pageSize + 1)
                .ToListAsync();

            var hasNextPage = results.Count > pageSize;
            var items = results.Take(pageSize).ToList();

            string? nextCursor = null;

            if (hasNextPage)
            {
                var last = items[^1];
                nextCursor = new ListingCursor
                {
                    Rank = last.Rank,
                    CreatedAt = last.Listing.CreatedAt,
                    Id = last.Listing.Id
                }.Encode();
            }

            return (
                Items: items.Select(x => x.Listing).ToList(),
                NextCursor: nextCursor,
                HasNextPage: hasNextPage
            );
        }
    }
}
