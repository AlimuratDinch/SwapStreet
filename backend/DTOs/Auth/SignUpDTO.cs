using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth
{
    public class SignUpDto
    {
        [Required(ErrorMessage = "Email is required.")]
        public string Email { get; set; } = default!;

        [Required(ErrorMessage = "username is required.")]
        public string Username { get; set; } = default!;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = default!;

        public void Deconstruct(out string email,out string username, out string password)
        {
            email = Email;
            username = Username;
            password = Password;
        }
    }
}