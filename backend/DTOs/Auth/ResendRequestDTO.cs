using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth
{
    public class ResendRequestDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

    }
}