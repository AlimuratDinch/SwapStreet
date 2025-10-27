namespace backend.Models;

public class Category
{
    public int Id { get; set; }           // Primary key
    public string Name { get; set; } = "";

    // Navigation property: one category has many items
    public List<Item> Items { get; set; } = new();
}