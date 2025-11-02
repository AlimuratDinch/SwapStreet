namespace backend.DTOs.Auth
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = default!;
        public string Username { get; set; } = default!;

    }
    public record UpdateUsernameDto(string NewUsername);
    public record UpdateEmailDto(string NewEmail);
}