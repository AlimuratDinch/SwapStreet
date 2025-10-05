namespace backend.Models;

public class Item
{
    public int Id { get; set; }           // Primary key
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Condition { get; set; } = "Good";
    public decimal Price { get; set; }
    public string ImageUrl { get; set; } = "";

    // Foreign key
    public int CategoryId { get; set; }

    // Navigation property
    public Category Category { get; set; } = null!;
}