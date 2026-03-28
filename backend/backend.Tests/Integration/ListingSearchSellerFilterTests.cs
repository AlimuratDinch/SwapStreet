using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AwesomeAssertions;
using backend.DbContexts;
using backend.Models;
using backend.Tests.BackendTestFactories;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests.IntegrationTests;

public class ListingSearchSellerFilterTests : IClassFixture<InMemoryWebAppFactory>
{
    private readonly InMemoryWebAppFactory _factory;
    private readonly HttpClient _client;

    public ListingSearchSellerFilterTests(InMemoryWebAppFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Search_WithSellerId_ReturnsOnlyThatSellersListings_AndPaginates()
    {
        var sellerA = Guid.NewGuid();
        var sellerB = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var province = new Province { Name = "Ontario", Code = "ON" };
            db.Provinces.Add(province);
            await db.SaveChangesAsync();

            var city = new City { Name = "Toronto", ProvinceId = province.Id };
            db.Cities.Add(city);
            await db.SaveChangesAsync();

            db.Profiles.AddRange(
                new Profile
                {
                    Id = sellerA,
                    Status = ProfileStatusEnum.Online,
                    FirstName = "A",
                    LastName = "Seller",
                    CityId = city.Id,
                    FSA = "M5V",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Profile
                {
                    Id = sellerB,
                    Status = ProfileStatusEnum.Online,
                    FirstName = "B",
                    LastName = "Seller",
                    CityId = city.Id,
                    FSA = "M5V",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

            for (var i = 0; i < 3; i++)
            {
                db.Listings.Add(new Listing
                {
                    Id = Guid.NewGuid(),
                    Title = $"A Item {i}",
                    Description = "Description at least ten chars long here.",
                    Price = 10 + i,
                    Size = ListingSize.M,
                    Brand = ListingBrand.Nike,
                    Category = ListingCategory.Tops,
                    Condition = ListingCondition.New,
                    Colour = ListingColour.Black,
                    ProfileId = sellerA,
                    FSA = "M5V",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-i),
                    UpdatedAt = DateTime.UtcNow
                });
            }

            db.Listings.Add(new Listing
            {
                Id = Guid.NewGuid(),
                Title = "B Item",
                Description = "Description at least ten chars long here.",
                Price = 99,
                Size = ListingSize.L,
                Brand = ListingBrand.Zara,
                Category = ListingCategory.Bottoms,
                Condition = ListingCondition.LikeNew,
                Colour = ListingColour.Blue,
                ProfileId = sellerB,
                FSA = "M5V",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        using var page1 = await _client.GetAsync(
            $"/api/search/search?SellerId={sellerA}&PageSize=2");
        page1.StatusCode.Should().Be(HttpStatusCode.OK);
        var json1 = await page1.Content.ReadAsStringAsync();
        json1.Should().Contain("A Item");
        json1.Should().NotContain("B Item");
        json1.Should().Contain("\"hasNextPage\":true");

        using var doc1 = System.Text.Json.JsonDocument.Parse(json1);
        var items1 = doc1.RootElement.GetProperty("items").GetArrayLength();
        items1.Should().Be(2);

        var nextCursor = doc1.RootElement.GetProperty("nextCursor").GetString();
        nextCursor.Should().NotBeNullOrEmpty();

        using var page2 = await _client.GetAsync(
            $"/api/search/search?SellerId={sellerA}&PageSize=2&Cursor={nextCursor}");
        page2.StatusCode.Should().Be(HttpStatusCode.OK);
        var json2 = await page2.Content.ReadAsStringAsync();
        using var doc2 = System.Text.Json.JsonDocument.Parse(json2);
        doc2.RootElement.GetProperty("items").GetArrayLength().Should().Be(1);
        doc2.RootElement.GetProperty("hasNextPage").GetBoolean().Should().BeFalse();
    }
}
