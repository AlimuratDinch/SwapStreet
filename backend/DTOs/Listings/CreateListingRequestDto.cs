using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace backend.DTOs.Listings
{
    public class CreateListingRequestDto
    {

        [Required(ErrorMessage = "Title is required")]
        [StringLength(255, MinimumLength = 3, ErrorMessage = "Title must be 3-255 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be 10-1000 characters")]
        public string Description { get; set; } = string.Empty;

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

        [Required(ErrorMessage = "Price is required")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Profile ID is required")]
        public Guid ProfileId { get; set; }

        [Required(ErrorMessage = "FSA is required")]
        [RegularExpression(@"^^[A-Z]\d[A-Z]$", ErrorMessage = "Invalid Canadian FSA format")]
        public string FSA { get; set; } = string.Empty;
    }
}
