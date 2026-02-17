using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<ImageController> _logger;

        public ImageController(IFileStorageService fileStorage, ILogger<ImageController> logger)
        {
            _fileStorage = fileStorage;
            _logger = logger;
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

            // Ensure user is verified
            var isEmailConfirmedClaim = User.FindFirst("isEmailConfirmed")?.Value;
            bool isEmailConfirmed = bool.TryParse(isEmailConfirmedClaim, out var result) && result;
            if (!isEmailConfirmed) return BadRequest("Not Verified");

            try
            {
                if (request.File == null || request.File.Length == 0)
                    return BadRequest("No file uploaded.");

                // Upload file (internal logic decides bucket and URL type)
                var url = await _fileStorage.UploadFileAsync(
                    request.File, 
                    request.Type, 
                    userId, 
                    request.ListingId,
                    displayOrder: request.DisplayOrder);

                return Ok(new
                {
                    fileName = request.File.FileName,
                    url,
                    type = request.Type.ToString(),
                    displayOrder = request.DisplayOrder
                });
            }
            catch (ArgumentException ex)
            {
                // Validation errors (size, type, dimensions)
                _logger.LogWarning(ex, "Image upload validation failed for user {UserId}", userId);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                // Unexpected errors
                _logger.LogError(ex, "Unexpected error during image upload for user {UserId}", userId);
                return StatusCode(500, new { error = "An unexpected error occurred while uploading the image." });
            }
        }
    }
}
