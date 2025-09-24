using Microsoft.EntityFrameworkCore;
using backend.Contracts;
using backend.Models;
using backend.DbContexts;

namespace backend.Services;

public class CatalogService : ICatalogService
{
    private readonly AppDbContext _db;

    public CatalogService(AppDbContext db) => _db = db;

    // ---- CATEGORY ----
    public Category AddCategory(Category category)
    {
        _db.Categories.Add(category);
        _db.SaveChanges();
        return category;
    }

    public IEnumerable<Category> GetAllCategories()
    {
        return _db.Categories.Include(c => c.Items).ToList();
    }

    public Category? GetCategoryById(int id)
    {
        return _db.Categories.Include(c => c.Items).FirstOrDefault(c => c.Id == id);
    }

    public Category UpdateCategory(int id, Category updated)
    {
        var existing = _db.Categories.Find(id);
        if (existing == null) throw new KeyNotFoundException();
        existing.Name = updated.Name;
        _db.SaveChanges();
        return existing;
    }

    public bool DeleteCategory(int id)
    {
        var cat = _db.Categories.Include(c => c.Items).FirstOrDefault(c => c.Id == id);
        if (cat == null) return false;

        // Optional: remove items in this category or throw error
        _db.Items.RemoveRange(cat.Items);  
        _db.Categories.Remove(cat);
        _db.SaveChanges();
        return true;
    }

    // ---- ITEM ----
    public Item AddItem(Item item)
    {
        _db.Items.Add(item);
        _db.SaveChanges();
        return item;
    }

    public IEnumerable<Item> GetAllItems()
    {
        return _db.Items.Include(i => i.Category).ToList();
    }

    public Item? GetItemById(int id)
    {
        return _db.Items.Include(i => i.Category).FirstOrDefault(i => i.Id == id);
    }

    public Item UpdateItem(int id, Item updated)
    {
        var existing = _db.Items.Find(id);
        if (existing == null) throw new KeyNotFoundException();

        existing.Title = updated.Title;
        existing.Description = updated.Description;
        existing.Condition = updated.Condition;
        existing.Price = updated.Price;
        existing.ImageUrl = updated.ImageUrl;
        existing.CategoryId = updated.CategoryId;

        _db.SaveChanges();
        return existing;
    }

    public bool DeleteItem(int id)
    {
        var item = _db.Items.Find(id);
        if (item == null) return false;

        _db.Items.Remove(item);
        _db.SaveChanges();
        return true;
    }
}
