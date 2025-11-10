using System.Collections.Generic;
using backend.Models;

namespace backend.Data.Seed
{
    public static class SeedData
    {
        public static List<Category> Categories => new()
        {
            new Category { Id = 1, Name = "Tops" },
            new Category { Id = 2, Name = "Bottoms" },
            new Category { Id = 3, Name = "Accessories" },
            new Category { Id = 4, Name = "Portables" },
            new Category { Id = 5, Name = "Sale" }
        };

        public static List<Item> Items => new()
        {
            new Item { Id = 1, Title = "Classic White T-Shirt", Description = "Soft cotton t-shirt perfect for everyday wear. Size M.", Condition = "Used", Price = 15.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 1 },
            new Item { Id = 2, Title = "Denim Jeans", Description = "Slim-fit blue jeans with stretch for comfort.", Condition = "Like New", Price = 29.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 2 },
            new Item { Id = 3, Title = "Leather Belt", Description = "Brown leather belt with adjustable buckle.", Condition = "New", Price = 19.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 3 },
            new Item { Id = 4, Title = "Canvas Backpack", Description = "Durable portable backpack for daily use.", Condition = "Used", Price = 25.00m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 4 },
            new Item { Id = 5, Title = "Discounted Hoodie", Description = "Cozy fleece hoodie on sale. Warm and casual.", Condition = "New", Price = 22.50m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 5 },
            new Item { Id = 6, Title = "Striped Blouse", Description = "Lightweight striped blouse for office or outings. Size S.", Condition = "Like New", Price = 18.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 1 },
            new Item { Id = 7, Title = "Cargo Pants", Description = "Practical cargo pants with multiple pockets.", Condition = "Used", Price = 27.50m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 2 },
            new Item { Id = 8, Title = "Sunglasses", Description = "Polarized sunglasses for sun protection.", Condition = "New", Price = 14.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 3 },
            new Item { Id = 9, Title = "Messenger Bag", Description = "Compact portable messenger bag in black.", Condition = "Used", Price = 30.00m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 4 },
            new Item { Id = 10, Title = "Sale Polo Shirt", Description = "Breathable polo shirt at a reduced price.", Condition = "New", Price = 12.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 5 },
            new Item { Id = 11, Title = "Knit Sweater", Description = "Warm knit sweater in neutral tones.", Condition = "Like New", Price = 24.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 1 },
            new Item { Id = 12, Title = "Chino Shorts", Description = "Casual chino shorts for summer.", Condition = "Used", Price = 17.50m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 2 },
            new Item { Id = 13, Title = "Wristwatch", Description = "Stylish analog wristwatch with leather strap.", Condition = "New", Price = 49.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 3 },
            new Item { Id = 14, Title = "Tote Bag", Description = "Spacious portable tote bag made from canvas.", Condition = "Like New", Price = 22.00m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 4 },
            new Item { Id = 15, Title = "Discounted Jacket", Description = "Lightweight jacket on sale.", Condition = "New", Price = 39.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 5 },
            new Item { Id = 16, Title = "Crop Top", Description = "Trendy crop top in black.", Condition = "Used", Price = 14.50m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 1 },
            new Item { Id = 17, Title = "Sweatpants", Description = "Relaxed sweatpants for lounging or workouts.", Condition = "Like New", Price = 19.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 2 },
            new Item { Id = 18, Title = "Scarf", Description = "Soft wool scarf for added warmth.", Condition = "New", Price = 12.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 3 },
            new Item { Id = 19, Title = "Laptop Sleeve", Description = "Protective portable sleeve for laptops.", Condition = "Used", Price = 15.00m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 4 },
            new Item { Id = 20, Title = "Sale Skirt", Description = "Flowy skirt at a discount.", Condition = "New", Price = 18.99m, ImageUrl = "/images/clothes_login_page.png", CategoryId = 5 }
        };
    }
}
