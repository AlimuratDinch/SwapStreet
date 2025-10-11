namespace backend.Contracts;

using backend.Models;

public interface ICatalogService
{
    IEnumerable<Item> GetAllItems();
    Item GetItemById(int id);
    Item AddItem(Item item);
    Item UpdateItem(int id, Item item);
    bool DeleteItem(int id);
    IEnumerable<Category> GetAllCategories();
    Category GetCategoryById(int id);
    Category AddCategory(Category category);
    Category UpdateCategory(int id, Category category);
    bool DeleteCategory(int id);
}