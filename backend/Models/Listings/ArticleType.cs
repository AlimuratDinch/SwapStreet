using System.ComponentModel.DataAnnotations;

public class ArticleType
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
}