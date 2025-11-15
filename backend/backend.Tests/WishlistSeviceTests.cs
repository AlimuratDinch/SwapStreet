using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using backend.DbContexts;
using backend.Models;
using backend.Services;

namespace backend.Tests.Services
{
    public class WishlistServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()) // isolated per test
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetWishlistAsync_ReturnsItemsForUser()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var userId = Guid.NewGuid();
            db.Wishlists.AddRange(
                new Wishlist { UserId = userId, ItemId = 1 },
                new Wishlist { UserId = userId, ItemId = 2 },
                new Wishlist { UserId = Guid.NewGuid(), ItemId = 3 }
            );
            await db.SaveChangesAsync();

            var service = new WishlistService(db);

            // Act
            var result = await service.GetWishlistAsync(userId);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(1, result);
            Assert.Contains(2, result);
            Assert.DoesNotContain(3, result);
        }

        [Fact]
        public async Task AddToWishlistAsync_AddsNewItem_WhenNotExists()
        {
            var db = GetInMemoryDbContext();
            var userId = Guid.NewGuid();
            var service = new WishlistService(db);

            await service.AddToWishlistAsync(userId, 10);

            var items = db.Wishlists.Where(w => w.UserId == userId).ToList();
            Assert.Single(items);
            Assert.Equal(10, items[0].ItemId);
        }

        [Fact]
        public async Task AddToWishlistAsync_DoesNotDuplicateExistingItem()
        {
            var db = GetInMemoryDbContext();
            var userId = Guid.NewGuid();
            db.Wishlists.Add(new Wishlist { UserId = userId, ItemId = 10 });
            await db.SaveChangesAsync();

            var service = new WishlistService(db);
            await service.AddToWishlistAsync(userId, 10);

            var count = await db.Wishlists.CountAsync(w => w.UserId == userId && w.ItemId == 10);
            Assert.Equal(1, count);
        }

        [Fact]
        public async Task RemoveFromWishlistAsync_RemovesItem_WhenExists()
        {
            var db = GetInMemoryDbContext();
            var userId = Guid.NewGuid();
            db.Wishlists.Add(new Wishlist { UserId = userId, ItemId = 10 });
            await db.SaveChangesAsync();

            var service = new WishlistService(db);
            await service.RemoveFromWishlistAsync(userId, 10);

            var exists = await db.Wishlists.AnyAsync(w => w.UserId == userId && w.ItemId == 10);
            Assert.False(exists);
        }

        [Fact]
        public async Task RemoveFromWishlistAsync_DoesNothing_WhenNotExists()
        {
            var db = GetInMemoryDbContext();
            var userId = Guid.NewGuid();
            db.Wishlists.Add(new Wishlist { UserId = userId, ItemId = 10 });
            await db.SaveChangesAsync();

            var service = new WishlistService(db);
            await service.RemoveFromWishlistAsync(userId, 20);

            var count = await db.Wishlists.CountAsync();
            Assert.Equal(1, count);
        }
    }
}
