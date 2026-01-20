using backend.DbContexts;
using backend.Services;
using backend.Tests.Fixtures;
using backend.Models;
using backend.Models.Authentication;
using backend.DTOs.Search;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Collections.Generic;

namespace backend.Tests.Integration;

[CollectionDefinition(nameof(PostgresCollection))]
public class PostgresCollection : ICollectionFixture<PostgresFixture> { }

[Collection(nameof(PostgresCollection))]
public class SearchServiceIntegrationTests
{
    private readonly PostgresFixture _fx;

    public SearchServiceIntegrationTests(PostgresFixture fx)
    {
        _fx = fx;
    }

    /// <summary>
    /// Helper method to create a valid User and Profile required for inserting Listings.
    /// Uses in-memory databases for auth and profile data to avoid PostgreSQL dependency.
    /// </summary>
    private async Task<(Guid ProfileId, AppDbContext AppDb, AuthDbContext AuthDb)> CreateUserAndProfileAsync()
    {
        // Create in-memory databases for auth and profile setup
        var appOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var authOptions = new DbContextOptionsBuilder<AuthDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(appOptions);
        var authDb = new AuthDbContext(authOptions);

        // 1. Create a City (required by Profile)
        var province = new Province { Name = "Ontario", Code = "ON" };
        db.Provinces.Add(province);
        await db.SaveChangesAsync();

        var city = new City { Name = "Toronto", ProvinceId = province.Id };
        db.Cities.Add(city);
        await db.SaveChangesAsync();

        // 2. Create a User
        var userId = Guid.NewGuid();
        var email = $"testuser_{Guid.NewGuid().ToString().Substring(0, 8)}@test.com";
        var user = new User
        {
            Id = userId,
            Email = email,
            Username = email.Split('@')[0],
            EncryptedPassword = "hashed_password",
            Status = "active",
            EmailConfirmedAt = DateTime.UtcNow
        };
        authDb.Users.Add(user);
        await authDb.SaveChangesAsync();

        // 3. Create a Profile
        var profileId = Guid.NewGuid();
        var profile = new Profile
        {
            Id = profileId,
            Status = ProfileStatusEnum.Online,
            FirstName = "Test",
            LastName = "User",
            Rating = 4.5f,
            CityId = city.Id,
            FSA = "M5H"
        };
        db.Profiles.Add(profile);
        await db.SaveChangesAsync();

        return (profileId, db, authDb);
    }

    /// <summary>
    /// Cleans up listing data and disposes contexts.
    /// </summary>
    private void CleanupData(AppDbContext db, AuthDbContext authDb)
    {
        if (db != null)
        {
            db.Listings.RemoveRange(db.Listings);
            db.SaveChanges();
            db.Dispose();
        }

        if (authDb != null)
        {
            authDb.Dispose();
        }
    }

    private async Task SeedAsync()
    {
        // Create in-memory databases for user and profile setup
        var (profileId, inMemoryAppDb, inMemoryAuthDb) = await CreateUserAndProfileAsync();

        // Clean up in-memory contexts
        CleanupData(inMemoryAppDb, inMemoryAuthDb);

        // Now create listings in PostgreSQL database
        using var pgDb = new AppDbContext(_fx.DbOptions);

        // Clean previous listings
        pgDb.Listings.RemoveRange(pgDb.Listings);
        await pgDb.SaveChangesAsync();

        // Create profile in PostgreSQL database if it doesn't exist
        if (!pgDb.Profiles.Any(p => p.Id == profileId))
        {
            // Ensure province exists
            var province = pgDb.Provinces.FirstOrDefault();
            if (province == null)
            {
                province = new Province { Name = "Ontario", Code = "ON" };
                pgDb.Provinces.Add(province);
                await pgDb.SaveChangesAsync();
            }

            // Ensure city exists
            var city = pgDb.Cities.FirstOrDefault();
            if (city == null)
            {
                city = new City { Name = "Toronto", ProvinceId = province.Id };
                pgDb.Cities.Add(city);
                await pgDb.SaveChangesAsync();
            }

            // Create profile
            var pgProfile = new Profile
            {
                Id = profileId,
                Status = ProfileStatusEnum.Online,
                FirstName = "Test",
                LastName = "User",
                Rating = 4.5f,
                CityId = city.Id,
                FSA = "M5H"
            };
            pgDb.Profiles.Add(pgProfile);
            await pgDb.SaveChangesAsync();
        }

        // Create tags for listings
        var articleType = pgDb.ArticleTypes.FirstOrDefault();
        if (articleType == null)
        {
            articleType = new ArticleType { Name = "Footwear" };
            pgDb.ArticleTypes.Add(articleType);
            await pgDb.SaveChangesAsync();
        }

        var style = pgDb.Styles.FirstOrDefault();
        if (style == null)
        {
            style = new Style { Name = "Casual" };
            pgDb.Styles.Add(style);
            await pgDb.SaveChangesAsync();
        }

        var size = pgDb.Sizes.FirstOrDefault();
        if (size == null)
        {
            size = new Size { Value = "Medium", ArticleTypeId = articleType.Id, DisplayOrder = 2 };
            pgDb.Sizes.Add(size);
            await pgDb.SaveChangesAsync();
        }

        var tag = new Tag
        {
            ArticleTypeId = articleType.Id,
            StyleId = style.Id,
            SizeId = size.Id
        };
        pgDb.Tags.Add(tag);
        await pgDb.SaveChangesAsync();

        // Add test listings
        var now = DateTime.UtcNow;
        pgDb.Listings.AddRange(
            new Listing
            {
                Id = Guid.NewGuid(),
                Title = "Nike Air Max shoes",
                Description = "Great running sneakers size 10",
                Price = 80m,
                FSA = "M5H",
                TagId = tag.Id,
                ProfileId = profileId,
                CreatedAt = now.AddMinutes(-3),
                UpdatedAt = now.AddMinutes(-3)
            },
            new Listing
            {
                Id = Guid.NewGuid(),
                Title = "Adidas sweatshirt",
                Description = "Cozy hoodie, like new",
                Price = 35m,
                FSA = "M5H",
                ProfileId = profileId,
                CreatedAt = now.AddMinutes(-2),
                UpdatedAt = now.AddMinutes(-2)
            },
            new Listing
            {
                Id = Guid.NewGuid(),
                Title = "Converse sneakers",
                Description = "Classic shoes, white, size 9",
                Price = 50m,
                FSA = "M5H",
                ProfileId = profileId,
                CreatedAt = now.AddMinutes(-1),
                UpdatedAt = now.AddMinutes(-1)
            }
        );

        await pgDb.SaveChangesAsync();
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
        Assert.Contains(items, l => l.Listing.Title.Contains("Converse", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(items, l => l.Listing.Title.Contains("Nike", StringComparison.OrdinalIgnoreCase));
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
        Assert.NotEqual(items1[0].Listing.Id, items2[0].Listing.Id);

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
        Assert.True(items[0].Listing.CreatedAt >= items[1].Listing.CreatedAt); // ordered by recency

        Assert.True(hasNext);          // we seeded 3
        Assert.NotNull(nextCursor);
    }

    [Fact]
    public async Task Search_NoTypoQuery_ReturnsExpectedListings()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        // Search for "Nike" (exact match, no typo)
        var (items, nextCursor, hasNext) = await svc.SearchListingsAsync("Nike shoes", pageSize: 20, cursor: null);

        Assert.NotEmpty(items);
        Assert.Contains(items, l => l.Listing.Title.Contains("Nike", StringComparison.OrdinalIgnoreCase));
        Assert.False(hasNext);
        Assert.Null(nextCursor);
    }

    [Fact]
    public async Task Search_ReturnsListingsWithImages()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        var (items, _, _) = await svc.SearchListingsAsync("shoes", pageSize: 20, cursor: null);

        Assert.NotEmpty(items);

        // Verify all items have Images collection (even if empty)
        foreach (var item in items)
        {
            Assert.NotNull(item.Images);
            Assert.IsType<List<ListingImageDto>>(item.Images);
        }
    }

    [Fact]
    public async Task SearchListingsAsync_ReturnsProfileInfo()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        var (items, _, _) = await svc.SearchListingsAsync("shoes", pageSize: 20, cursor: null);

        Assert.NotEmpty(items);

        // Verify all items have associated Profile info
        foreach (var item in items)
        {
            Assert.NotNull(item.Listing.Profile);
            Assert.False(string.IsNullOrWhiteSpace(item.Listing.Profile.FirstName));
            Assert.False(string.IsNullOrWhiteSpace(item.Listing.Profile.LastName));
        }
    }

    [Fact]
    public async Task SearchListingsAsync_WithTag_ReturnsTagInfo()
    {
        await SeedAsync();
        await using var db = new AppDbContext(_fx.DbOptions);
        var svc = new ListingSearchService(db);

        var (items, _, _) = await svc.SearchListingsAsync("Nike", pageSize: 20, cursor: null);

        Assert.NotEmpty(items);

        // Find the Nike listing which should have a tag
        var nikeListing = items.FirstOrDefault(l => l.Listing.Title.Contains("Nike", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(nikeListing);
        Assert.NotNull(nikeListing.Listing.Tag);
        Assert.NotEqual(Guid.Empty, nikeListing.Listing.TagId);
        Assert.NotNull(nikeListing.Listing.Tag.ArticleTypeRef);
        Assert.NotNull(nikeListing.Listing.Tag.StyleRef);
    }
}
