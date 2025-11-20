using Microsoft.EntityFrameworkCore;
using backend.Contracts;
using backend.Models;
using backend.DbContexts;
using backend.DTOs;

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
    
    public Listing AddListing(CreateListingRequest request)
    {
        Profile? profile = _db.Profiles.Find(request.ProfileId);
        if (profile == null)
            throw new KeyNotFoundException("Invalid profile");
        
        Tag? tag = _db.Tags.Find(request.TagId);
        if (tag == null)
            throw new KeyNotFoundException("Invalid tag");
        
        Listing? listing = new Listing {
            Name = request.Name,
            Price = request.Price,
            Description = request.Description,
            ProfileId = request.ProfileId,
            TagId = request.TagId,
            Profile = profile,
            Tag = tag
        };
        // May throw an `OutOfMemoryException` exception
        
        _db.Listings.Add(listing);
        _db.SaveChanges();
        return listing;
    }
    
    public IEnumerable<Listing> GetAllListings()
    {
        return _db.Listings;
    }
    
    
    public bool UpdateListing(Listing updated)
    {
        Listing? existing = _db.Listings.Find(updated.Id);
        
        if (existing == null)
            return true;
        
        existing.Name = updated.Name;
        existing.Price = updated.Price;
        existing.Description = updated.Description;
        existing.ProfileId = updated.ProfileId;
        existing.TagId = updated.TagId;
        
        existing.Profile = updated.Profile;
        existing.TagId = updated.TagId;
        // Don't update the id, it is static.
        
        _db.SaveChanges();
        return false;
    }
    
    public bool DeleteListing(Guid guid)
    {
        Listing? existing = _db.Listings.Find(guid);
        
        if (existing == null)
            return true;
        
        _db.Listings.Remove(existing);
        _db.SaveChanges();
        
        return false;
    }
}
