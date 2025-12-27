using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class WishList
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [ForeignKey("Profile")]
    public Guid UserID { get; set; }

    public Profile? Profile { get; set; }

    [Required]
    public Guid ListingID { get; set; }

    [ForeignKey("ListingID")]
    public Listing? Listing { get; set; }
}