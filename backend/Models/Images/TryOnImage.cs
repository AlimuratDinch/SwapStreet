using backend.Models.Authentication;
namespace backend.Models;


public class TryOnImage
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string PersonalImagePath { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation property
    public User User { get; set; }
}