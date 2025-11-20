
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    [Table("listings")]
    public class Listing
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [MaxLength(255)]
        [Column("name")]
        public required String Name { get; set; }
        
        [Required]
        [Column("price")]
        public int Price { get; set; }
        // Use price in cents for precise arithmetic.
        
        [Required]
        [MaxLength(32767)]
        [Column("description")]
        public required String Description { get; set; }
        
        [Required]
        [ForeignKey(nameof(Profile))]
        [Column("profile_id")]
        public Guid ProfileId { get; set; }
        
        [Required]
        [ForeignKey(nameof(Tag))]
        [Column("tag_id")]
        public Guid TagId { get; set; }
        
        // Attributes for navigation
        public required Profile Profile { get; set; }
        public required Tag Tag { get; set; }
    }
}