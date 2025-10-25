using System.ComponentModel.DataAnnotations;
using Xunit.Sdk;

namespace backend.DTOs.Auth
{
    public class SignInDto
    {
        [Required(ErrorMessage = "Email or username is required.")]
        public string Email { get; set; } = default!;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = default!;

        public void Deconstruct(out string email, out string password)
        {
            email = Email;
            password = Password;
        }
    }
}