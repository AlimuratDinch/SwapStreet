using backend.DbContexts;
using backend.Services;
using backend.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Integration;

[CollectionDefinition(nameof(PostgresCollection))]
public class PostgresCollection : ICollectionFixture<PostgresFixture> { }

[Collection(nameof(PostgresCollection))]
public class ListingSearchServicePgTrgmTests
{
    private readonly PostgresFixture _fx;

    public ListingSearchServicePgTrgmTests(PostgresFixture fx)
    {
        _fx = fx;
    }

    private async Task SeedAsync()
    {
        await using var db = new AppDbContext(_fx.DbOptions);

        // Clean between tests (simple approach)
        await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Listings"";");

        var profileId = Guid.NewGuid();

        db.Listings.AddRange(
            new Listing
            {
                Id = Guid.NewGuid(),
                Title = "Nike Air Max shoes",
                Description = "Great running sneakers size 10",
                Price = 80m,
                ProfileId = profileId,
                CreatedAt = DateTime.UtcNow.AddMinutes(-3),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-3)
            },
            new Listing
            {
                Id = Guid.NewGuid(),
                Title = "Adidas sweatshirt",
                Description = "Cozy hoodie, like new",
                Price = 35m,
                ProfileId = profileId,
                CreatedAt = DateTime.UtcNow.AddMinutes(-2),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-2)
            },
            new Listing
            {
                Id = Guid.NewGuid(),
                Title = "Converse sneakers",
                Description = "Classic shoes, white, size 9",
                Price = 50m,
                ProfileId = profileId,
                CreatedAt = DateTime.UtcNow.AddMinutes(-1),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-1)
            }
        );

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Search_FuzzyTypo_ReturnsExpectedListings()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        // "sneakrs" typo should match listings containing "sneakers"
        var (items, nextCursor, hasNext) = await svc.SearchListingsAsync("sneakrs", pageSize: 20, cursor: null);

        Assert.NotEmpty(items);
        Assert.Contains(items, l => l.Title.Contains("Converse", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(items, l => l.Title.Contains("Nike", StringComparison.OrdinalIgnoreCase));

        Assert.False(hasNext);
        Assert.Null(nextCursor);
    }

    [Fact]
    public async Task Search_CursorPagination_ReturnsSecondPageWithoutDuplicates()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        // page 1
        var (items1, cursor1, hasNext1) = await svc.SearchListingsAsync("shoes", pageSize: 1, cursor: null);

        Assert.Single(items1);
        Assert.True(hasNext1);
        Assert.False(string.IsNullOrWhiteSpace(cursor1));

        // page 2
        var (items2, cursor2, hasNext2) = await svc.SearchListingsAsync("shoes", pageSize: 1, cursor: cursor1);

        Assert.Single(items2);

        // no duplicates across pages
        Assert.NotEqual(items1[0].Id, items2[0].Id);

        // cursor2 may be null depending on remaining matches
        _ = cursor2;
        _ = hasNext2;
    }

    [Fact]
    public async Task BlankQuery_ReturnsRecentListings()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        var (items, nextCursor, hasNext) = await svc.SearchListingsAsync("", pageSize: 2, cursor: null);

        Assert.Equal(2, items.Count);
        Assert.True(items[0].CreatedAt >= items[1].CreatedAt); // ordered by recency

        Assert.True(hasNext);          // we seeded 3
        Assert.NotNull(nextCursor);
    }
}
