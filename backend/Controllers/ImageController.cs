using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.Models;
using System;
using System.Threading.Tasks;
using backend.DTOs.Image;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/images")]
    public class ImageController : ControllerBase
    {
        private readonly IFileStorageService _fileStorage;

        public ImageController(IFileStorageService fileStorage)
        {
            _fileStorage = fileStorage;
        }

        /// <summary>
        /// Upload an image.
        /// Type determines if it is public (profile, banner, listing) or private (try-on)
        /// </summary>
        /// <param name="request">FileUploadRequest containing the image file and type</param>
        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] FileUploadRequest request)
        {
            //Validate user credentials
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Error = "Invalid token" });
            }

            try
            {
                if (request.File == null || request.File.Length == 0)
                    return BadRequest("No file uploaded.");

                // Upload file (internal logic decides bucket and URL type) 
                var url = await _fileStorage.UploadFileAsync(request.File, request.Type, userId, request.ListingId);

                return Ok(new
                {
                    fileName = request.File.FileName,
                    url,
                    type = request.Type.ToString()
                });
            }
            catch (ArgumentException ex)
            {
                // Validation errors (size, type, dimensions)
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                // Unexpected errors
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
