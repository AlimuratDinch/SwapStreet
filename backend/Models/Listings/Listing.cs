using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Listing
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    [Required(ErrorMessage = "Title is required")]
    [StringLength(255, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; } = 0.00M;

    [EnumDataType(typeof(ListingSize), ErrorMessage = "Invalid size value")]
    public ListingSize Size { get; set; }

    [EnumDataType(typeof(ListingCondition), ErrorMessage = "Invalid condition value")]
    public ListingCondition Condition { get; set; }

    [EnumDataType(typeof(ListingBrand), ErrorMessage = "Invalid brand value")]
    public ListingBrand Brand { get; set; }

    [EnumDataType(typeof(ListingColour), ErrorMessage = "Invalid colour value")]
    public ListingColour Colour { get; set; }

    [EnumDataType(typeof(ListingCategory), ErrorMessage = "Invalid category value")]
    public ListingCategory Category { get; set; }

    // Foreign Key to Profile (the seller)
    [Required]
    public Guid ProfileId { get; set; }

    [ForeignKey("ProfileId")]
    public Profile? Profile { get; set; }

    // Full-Text Search Vector, "SearchText" (computed column in DB) and can be accessed context.Listings.Where(l => EF.Property<string>(l, "SearchText") != null)

    [Required(ErrorMessage = "FSA is required")]
    [StringLength(3, MinimumLength = 3)]
    public string FSA { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ListingSize
{
    XXS,
    XS,
    S,
    M,
    L,
    XL,
    XXL,
    NA
}

public enum ListingCondition
{
    New,
    LikeNew,      
    UsedExcellent,
    UsedGood,    
    UsedFair,                 
}

public enum ListingColour
{
    // Basic Colors
    Black,
    White,
    Red,
    Blue,
    Green,
    Yellow,
    Pink,
    Purple,
    Orange,
    Brown,
    Grey,

    // Metallics / Neutrals
    Beige,
    Silver,
    Gold,

    // Patterns / Other
    Clear,
    MultiColor
}

public enum ListingBrand
{
    Nike, 
    HandM,
    Zara, 
    Addidas,
    Carhartt,
    Dickies,
    Puma,
    Gap,
    Vans,
    NewBalance, 
    Lululemon, 
    Other
}

public enum ListingCategory
{
    Bottoms, Tops, Footwear, Accessory, Outerwear, Formalwear, Sportswear 
}
// Brand (Nike, H&M, Zara, Addidas, Carhartt, Dickies, Puma, Gap, Vans, New Balance, Lululemon, Other)
// Category (Bottoms, Tops, Footwear, Accessory, Outerwear, Formalwear, Sportswear )
// Condition (New, Like New, Used-Excellent, Used-Good, Used-Fair)
