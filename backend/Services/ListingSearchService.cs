using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs;

namespace backend.Services;
public class ListingSearchService : IListingSearchService

{
    private readonly AppDbContext _db;

    public ListingSearchService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<Listing> Items, string? NextCursor, bool HasNextPage)> SearchListingsAsync(
        string query,
        int pageSize,
        string? cursor)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);

        // Blank query => "recent listings"
        if (string.IsNullOrWhiteSpace(query))
        {
            var rows = await _db.Listings.AsNoTracking()
                .OrderByDescending(l => l.CreatedAt)
                .ThenByDescending(l => l.Id)
                .Take(pageSize + 1)
                .ToListAsync();

            var hasNext = rows.Count > pageSize;
            var items = rows.Take(pageSize).ToList();

            string? next = null;
            if (hasNext)
            {
                var last = items[^1];
                next = new ListingCursor
                {
                    Rank = null,              // indicates "recent mode"
                    CreatedAt = last.CreatedAt,
                    Id = last.Id
                }.Encode();
            }

            return (items, next, hasNext);
        }

        query = query.Trim();

        const double threshold = 0.1; // minimum similarity to consider a match

        // Project Rank from pg_trgm similarity(SearchText, query) [0..1]
        var baseQuery = _db.Listings.AsNoTracking()
            .Select(l => new
            {
                Listing = l,
                Rank = EF.Functions.TrigramsSimilarity(
                    EF.Property<string>(l, "SearchText"),
                    query)
            })
            .Where(x => x.Rank >= threshold);

        // Cursor filter (Rank DESC, CreatedAt DESC, Id DESC)
        if (ListingCursor.TryDecode(cursor, out var c) && c != null)
        {
            // If cursor came from ranked mode it must have Rank
            if (c.Rank.HasValue)
            {
                var cr = c.Rank.Value;
                var ct = c.CreatedAt;
                var cid = c.Id;

                baseQuery = baseQuery.Where(x =>
                    x.Rank < cr ||
                    (x.Rank == cr && x.Listing.CreatedAt < ct) ||
                    (x.Rank == cr && x.Listing.CreatedAt == ct && x.Listing.Id.CompareTo(cid) < 0));
            }
            else
            {
                // Cursor from recent mode; fall back to CreatedAt/Id cut
                var ct = c.CreatedAt;
                var cid = c.Id;

                baseQuery = baseQuery.Where(x =>
                    x.Listing.CreatedAt < ct ||
                    (x.Listing.CreatedAt == ct && x.Listing.Id.CompareTo(cid) < 0));
            }
        }

        var rowsPage = await baseQuery
            .OrderByDescending(x => x.Rank)
            .ThenByDescending(x => x.Listing.CreatedAt)
            .ThenByDescending(x => x.Listing.Id)
            .Take(pageSize + 1)
            .ToListAsync();

        var hasNextPage = rowsPage.Count > pageSize;
        var page = rowsPage.Take(pageSize).ToList();

        string? nextCursor = null;
        if (hasNextPage)
        {
            var last = page[^1];
            nextCursor = new ListingCursor
            {
                Rank = last.Rank,
                CreatedAt = last.Listing.CreatedAt,
                Id = last.Listing.Id
            }.Encode();
        }

        return (page.Select(x => x.Listing).ToList(), nextCursor, hasNextPage);
    }
}
