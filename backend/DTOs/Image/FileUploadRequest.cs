using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace backend.DTOs.Image
{
public class FileUploadRequest
{
    [Required]
    public IFormFile File { get; set; }

    [Required]
    public UploadType Type { get; set; }
}
}