using System;
using System.Linq;
using backend.DbContexts;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;
using AwesomeAssertions;

namespace backend.Tests
{
    public class CatalogServiceTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly CatalogService _service;

        public CatalogServiceTests()
        {
            // Use InMemory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);
            _service = new CatalogService(_db);

            // Seed initial clothing category
            _db.Categories.Add(new Category { Name = "Clothing" });
            _db.SaveChanges();
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        // ---- CATEGORY TESTS ----
        [Fact]
        public void AddCategory_ShouldAddCategory()
        {
            var category = new Category { Name = "Accessories" };
            var result = _service.AddCategory(category);

            result.Should().NotBeNull();
            result.Name.Should().Be("Accessories");
            _db.Categories.Count().Should().Be(2);
        }

        [Fact]
        public void GetAllCategories_ShouldReturnAllCategories()
        {
            var categories = _service.GetAllCategories();

            categories.Should().HaveCount(1);
            categories.First().Name.Should().Be("Clothing");
        }

        [Fact]
        public void UpdateCategory_ShouldChangeCategoryName()
        {
            var existing = _db.Categories.First();
            var updated = new Category { Name = "Men's Clothing" };

            var result = _service.UpdateCategory(existing.Id, updated);

            result.Name.Should().Be("Men's Clothing");
        }

        [Fact]
        public void DeleteCategory_ShouldRemoveCategoryAndItems()
        {
            var category = _service.AddCategory(new Category { Name = "Footwear" });
            _service.AddItem(new Item { Title = "Sneakers", CategoryId = category.Id });

            var success = _service.DeleteCategory(category.Id);

            success.Should().BeTrue();
            _db.Categories.Find(category.Id).Should().BeNull();
            _db.Items.Where(i => i.CategoryId == category.Id).Should().BeEmpty();
        }

        // ---- ITEM TESTS ----
        [Fact]
        public void AddItem_ShouldAddClothingItem()
        {
            var category = _db.Categories.First();
            var item = new Item
            {
                Title = "T-Shirt",
                Description = "Cotton, size M",
                Condition = "New",
                Price = 25.00m,
                CategoryId = category.Id
            };

            var result = _service.AddItem(item);

            result.Should().NotBeNull();
            result.Title.Should().Be("T-Shirt");
            _db.Items.Should().HaveCount(1);
        }

        [Fact]
        public void GetAllItems_ShouldReturnAllClothingItems()
        {
            var category = _db.Categories.First();
            _service.AddItem(new Item { Title = "Sweater", Price = 40.00m, CategoryId = category.Id });
            _service.AddItem(new Item { Title = "Jacket", Price = 100.00m, CategoryId = category.Id });

            var items = _service.GetAllItems();

            items.Should().HaveCount(2);
            items.Should().ContainSingle(i => i.Title == "Sweater");
            items.Should().ContainSingle(i => i.Title == "Jacket");
        }

        [Fact]
        public void UpdateItem_ShouldUpdateClothingProperties()
        {
            var category = _db.Categories.First();
            var item = _service.AddItem(new Item { Title = "Jeans", CategoryId = category.Id, Price = 50.00m });

            var updated = new Item
            {
                Title = "Denim Jeans",
                Description = "Blue, size 32",
                Condition = "New",
                Price = 55.00m,
                CategoryId = category.Id
            };

            var result = _service.UpdateItem(item.Id, updated);

            result.Title.Should().Be("Denim Jeans");
            result.Price.Should().Be(55.00m);
            result.Description.Should().Be("Blue, size 32");
        }

        [Fact]
        public void DeleteItem_ShouldRemoveClothingItem()
        {
            var category = _db.Categories.First();
            var item = _service.AddItem(new Item { Title = "Hat", CategoryId = category.Id, Price = 20.00m });

            var success = _service.DeleteItem(item.Id);

            success.Should().BeTrue();
            _db.Items.Find(item.Id).Should().BeNull();
        }

        [Fact]
        public void GetItemById_ShouldReturnCorrectClothingItem()
        {
            var category = _db.Categories.First();
            var item = _service.AddItem(new Item { Title = "Scarf", CategoryId = category.Id, Price = 15.00m });

            var result = _service.GetItemById(item.Id);

            result.Should().NotBeNull();
            result.Title.Should().Be("Scarf");
        }
    }
}
