using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Tag
{
    // Primary Key
    [Key]
    public Guid Id { get; set; }

    // Foreign Key for ArticleType
    [Required]
    public Guid ArticleTypeId { get; set; }

    [ForeignKey("ArticleTypeId")]
    public ArticleType? ArticleTypeRef { get; set; }

    // Foreign Key for Style
    public Guid StyleId { get; set; }

    [ForeignKey("StyleId")]
    public Style? StyleRef { get; set; }

    // Foreign Key for Size
    public Guid SizeId { get; set; }

    [ForeignKey("SizeId")]
    public Size? SizeRef { get; set; }

    // Enum
    [Required]
    public ColorEnum Color { get; set; }

    // Foreign Key for Brand
    public Guid BrandId { get; set; }

    [ForeignKey("BrandId")]
    public Brand? BrandRef { get; set; } 

    // Enum
    [Required]
    public SexEnum Sex { get; set; }

    // Enum
    [Required]
    public ConditionEnum Condition { get; set; }

    // Material (Bit Vector) - Stored as an integer value
    // You would use bitwise operations on this integer to check/set material flags.
    [Required]
    public int Material { get; set; }
}


[Flags]
public enum MaterialEnum
{
    None = 0,
    Cotton = 1,        // 2^0
    Polyester = 2,     // 2^1
    Wool = 4,          // 2^2
    Silk = 8,          // 2^3
    Leather = 16,      // 2^4
    Denim = 32,        // 2^5
    Spandex = 64,      // 2^6
    Rayon = 128,       // 2^7
    SyntheticBlend = Cotton | Polyester // Example of combining flags
}

public enum ColorEnum
{
    // Basic Colors
    Black = 1,
    White = 2,
    Red = 3,
    Blue = 4,
    Green = 5,
    Yellow = 6,
    Pink = 7,
    Purple = 8,
    Orange = 9,
    Brown = 10,
    Grey = 11,

    // Metallics / Neutrals
    Beige = 12,
    Tan = 13,
    Silver = 14,
    Gold = 15,

    // Patterns / Other
    Clear = 16,
    MultiColor = 100 // Use a high number to keep basic colors tightly grouped
}

public enum ConditionEnum
{
    NewWithTags = 1,          // Item is brand new with all original tags attached.
    NewWithoutTags = 2,       // Item is brand new but the original tags are missing.
    ExcellentUsedCondition = 3, // Item has been worn but shows minimal signs of wear.
    GoodUsedCondition = 4,    // Item shows typical signs of wear but no major flaws.
    Fair = 5,                 // Item has noticeable flaws, stains, or damage, but is still wearable.
    ForPartsOrRepair = 6      // Item is significantly damaged and intended for repair or components.
}


public enum SexEnum
{
    Unisex = 0, // Item is designed to be worn by any gender.
    Male = 1,
    Female = 2,
    Child = 3   // Added for general children's apparel.
}