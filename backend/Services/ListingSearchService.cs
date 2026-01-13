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


            // Decode cursor if present
            ListingCursor? decodedCursor = null;
            ListingCursor.TryDecode(cursor, out decodedCursor);

            IQueryable<(Listing Listing, float Rank)> baseQuery; // the base query will contain the sql query plan/logic

            if (string.IsNullOrWhiteSpace(query))
            {
                // Recent first
                baseQuery = _db.Listings.AsNoTracking()
                .Select(l => new ValueTuple<Listing, float>(l, 0f))
                .OrderByDescending(x => x.Item1.CreatedAt)
                .ThenByDescending(x => x.Item1.Id);
                
            }
            else{
                // Build tsquery (light fuzzy)
                var tsQuery = EF.Functions.PlainToTsQuery("english", query);

                // Base query with ranking
                baseQuery =
                    _db.Listings
                    .AsNoTracking()
                    .Select(l => new ValueTuple<Listing, float>(l, l.SearchVector.RankCoverDensity(tsQuery)))
                    .Where(x => x.Item2 > 0)
                    .OrderByDescending(x => x.Item2)
                    .ThenByDescending(x => x.Item1.CreatedAt)
                    .ThenByDescending(x => x.Item1.Id);
            }

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
                .Take(pageSize + 1) // this limits the query to pageSize + 1 results
                .ToListAsync(); // execute the query

            var hasNextPage = results.Count > pageSize;
            var items = results.Take(pageSize).ToList();

            string? nextCursor = null;

            if (hasNextPage)
            {
                var last = items[^1]; // same as doing items[items.Count - 1]
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
