using backend.Models;
using backend.DTOs;

namespace backend.Contracts
{
    public interface ICatalogService
    {
        // ---- ITEM METHODS ----
        Item AddItem(Item item);
        IEnumerable<Item> GetAllItems();
        Item? GetItemById(int id);
        Item UpdateItem(int id, Item updated);
        bool DeleteItem(int id);

        // ---- CATEGORY METHODS ----
        Category AddCategory(Category category);
        IEnumerable<Category> GetAllCategories();
        Category? GetCategoryById(int id);
        Category UpdateCategory(int id, Category updated);
        bool DeleteCategory(int id);
        
        // ---- LISTING METHODS ----
        Listing AddListing(CreateListingRequest request);
        IEnumerable<Listing> GetAllListings();
        bool UpdateListing(Listing listing);
        bool DeleteListing(Guid guid);
    }
}

