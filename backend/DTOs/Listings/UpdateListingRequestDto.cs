using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.DTOs.Listings;

public class UpdateListingRequestDto
{
    [StringLength(255, MinimumLength = 3, ErrorMessage = "Title must be 3-255 characters")]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be 10-1000 characters")]
    public string Description { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "999999.99", ErrorMessage = "Price must be between 0.01 and 999999.99")]
    public decimal Price { get; set; }

    [EnumDataType(typeof(ListingCategory), ErrorMessage = "Invalid category value")]
    public ListingCategory Category { get; set; }

    [EnumDataType(typeof(ListingBrand), ErrorMessage = "Invalid brand value")]
    public ListingBrand Brand { get; set; }

    [EnumDataType(typeof(ListingCondition), ErrorMessage = "Invalid condition value")]
    public ListingCondition Condition { get; set; }

    [EnumDataType(typeof(ListingSize), ErrorMessage = "Invalid size value")]
    public ListingSize Size { get; set; }

    [EnumDataType(typeof(ListingColour), ErrorMessage = "Invalid colour value")]
    public ListingColour Colour { get; set; }
}