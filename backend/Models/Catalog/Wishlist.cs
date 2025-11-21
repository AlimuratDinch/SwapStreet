using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class WishList
{
    [Key]
    public Guid Id { get; set; }

    // Use ProfileID for consistency with the model name
    [Required]
    public Guid ProfileID { get; set; } // Renamed from UserID

    [ForeignKey("ProfileID")]
    public Profile? Profile { get; set; } // Renamed from User

    [Required]
    public Guid ListingId { get; set; }

    [ForeignKey("LsitingId")]
    public Listing? Listing { get; set; }
}