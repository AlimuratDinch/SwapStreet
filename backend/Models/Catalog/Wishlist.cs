using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class WishList
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProfileId { get; set; }

    [ForeignKey("ProfileId")]
    public Profile? Profile { get; set; } 

    [Required]
    public Guid ListingId { get; set; }

    [ForeignKey("ListingId")]
    public Listing? Listing { get; set; }

    public int DisplayOrder { get; set; }
}