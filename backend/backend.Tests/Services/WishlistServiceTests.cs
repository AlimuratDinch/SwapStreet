using System;
using System.Linq;
using System.Threading.Tasks;
using AwesomeAssertions;
using backend.Contracts;
using backend.DbContexts;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.Tests.Services
{
    public class WishlistServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly WishlistService _service;

        public WishlistServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _service = new WishlistService(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task GetWishlistAsync_ShouldReturnOnlyProfileItems_OrderedByDisplayOrder()
        {
            var profileId = Guid.NewGuid();
            var otherProfileId = Guid.NewGuid();

            var listingA = CreateListing("Listing A");
            var listingB = CreateListing("Listing B");
            var listingC = CreateListing("Listing C");

            _context.Listings.AddRange(listingA, listingB, listingC);
            _context.WishLists.AddRange(
                new WishList { Id = Guid.NewGuid(), ProfileId = profileId, ListingId = listingB.Id, DisplayOrder = 2 },
                new WishList { Id = Guid.NewGuid(), ProfileId = profileId, ListingId = listingA.Id, DisplayOrder = 1 },
                new WishList { Id = Guid.NewGuid(), ProfileId = otherProfileId, ListingId = listingC.Id, DisplayOrder = 1 }
            );
            await _context.SaveChangesAsync();

            var result = await _service.GetWishlistAsync(profileId);

            result.Should().Equal(listingA.Id, listingB.Id);
        }

        [Fact]
        public async Task AddToWishlistAsync_ShouldReturnListingNotFound_WhenListingDoesNotExist()
        {
            var result = await _service.AddToWishlistAsync(Guid.NewGuid(), Guid.NewGuid());

            result.Should().Be(WishlistAddResult.ListingNotFound);
            _context.WishLists.Should().BeEmpty();
        }

        [Fact]
        public async Task AddToWishlistAsync_ShouldAddItemWithNextDisplayOrder()
        {
            var profileId = Guid.NewGuid();
            var existingListing = CreateListing("Existing Listing");
            var listingToAdd = CreateListing("Listing To Add");

            _context.Listings.AddRange(existingListing, listingToAdd);
            _context.WishLists.Add(
                new WishList
                {
                    Id = Guid.NewGuid(),
                    ProfileId = profileId,
                    ListingId = existingListing.Id,
                    DisplayOrder = 3
                }
            );
            await _context.SaveChangesAsync();

            var result = await _service.AddToWishlistAsync(profileId, listingToAdd.Id);

            result.Should().Be(WishlistAddResult.Added);
            var added = await _context.WishLists.SingleAsync(w => w.ProfileId == profileId && w.ListingId == listingToAdd.Id);
            added.DisplayOrder.Should().Be(4);
        }

        [Fact]
        public async Task AddToWishlistAsync_ShouldReturnAlreadyExists_WhenItemAlreadyInWishlist()
        {
            var profileId = Guid.NewGuid();
            var listing = CreateListing("Duplicate Listing");

            _context.Listings.Add(listing);
            _context.WishLists.Add(
                new WishList
                {
                    Id = Guid.NewGuid(),
                    ProfileId = profileId,
                    ListingId = listing.Id,
                    DisplayOrder = 1
                }
            );
            await _context.SaveChangesAsync();

            var result = await _service.AddToWishlistAsync(profileId, listing.Id);

            result.Should().Be(WishlistAddResult.AlreadyExists);
            var count = await _context.WishLists.CountAsync(w => w.ProfileId == profileId && w.ListingId == listing.Id);
            count.Should().Be(1);
        }

        [Fact]
        public async Task RemoveFromWishlistAsync_ShouldRemoveItem_WhenItemExists()
        {
            var profileId = Guid.NewGuid();
            var listing = CreateListing("Remove Listing");

            _context.Listings.Add(listing);
            _context.WishLists.Add(
                new WishList
                {
                    Id = Guid.NewGuid(),
                    ProfileId = profileId,
                    ListingId = listing.Id,
                    DisplayOrder = 1
                }
            );
            await _context.SaveChangesAsync();

            var result = await _service.RemoveFromWishlistAsync(profileId, listing.Id);

            result.Should().Be(WishlistRemoveResult.Removed);
            var exists = await _context.WishLists.AnyAsync(w => w.ProfileId == profileId && w.ListingId == listing.Id);
            exists.Should().BeFalse();
        }

        [Fact]
        public async Task RemoveFromWishlistAsync_ShouldReturnNotFound_WhenItemDoesNotExist()
        {
            var result = await _service.RemoveFromWishlistAsync(Guid.NewGuid(), Guid.NewGuid());

            result.Should().Be(WishlistRemoveResult.NotFound);
        }

        private static Listing CreateListing(string title)
        {
            return new Listing
            {
                Id = Guid.NewGuid(),
                Title = title,
                Description = "Valid listing description for tests.",
                Price = 10.00m,
                ProfileId = Guid.NewGuid(),
                FSA = "M5V"
            };
        }
    }
}
