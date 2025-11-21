using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class WishList
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProfileID { get; set; }

    [ForeignKey("ProfileID")]
    public Profile? Profile { get; set; } 

    [Required]
    public Guid ListingId { get; set; }

    [ForeignKey("LsitingId")]
    public Listing? Listing { get; set; }
}