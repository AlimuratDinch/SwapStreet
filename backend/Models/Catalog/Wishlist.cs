using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("wishlists")]
    public class Wishlist
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("user_id")]
        [ForeignKey(nameof(Profile))]
        public Guid UserId { get; set; }

        [Required]
        [Column("item_id")]
        [ForeignKey(nameof(Item))]
        public int ItemId { get; set; }
    }
}