using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using backend.Models;

namespace backend.DTOs
{
    public class DeleteListingRequestDto
    {

        [Required(ErrorMessage = "Listing ID is required")]
        public Guid ListingId { get; set; }

        [Required(ErrorMessage = "Profile ID is required")]
        public Guid ProfileId { get; set; }

        ListingImage[]? Images { get; set; }

        

        [Required(ErrorMessage = "FSA is required")]
        [RegularExpression(@"^^[A-Z]\d[A-Z]$", ErrorMessage = "Invalid Canadian FSA format")]
        public string FSA { get; set; } = string.Empty;
    }
}
