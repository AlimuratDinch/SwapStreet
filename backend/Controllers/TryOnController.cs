using backend.Contracts;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/tryon")]
public class TryOnController : ControllerBase
{
    private readonly ITryOnService _tryOnService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<TryOnController> _logger;

    public TryOnController(
        ITryOnService tryOnService, 
        IFileStorageService fileStorageService,
        ILogger<TryOnController> logger)
    {
        _tryOnService = tryOnService;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    [Authorize]
    [HttpPost("virtual-tryon")]
    [Consumes("application/json")]
    public async Task<IActionResult> TryOnFromUrl([FromBody] TryOnRequestDto request)
    {   
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { Error = "Invalid token" });

        try
        {
            _logger.LogInformation("Received try-on request");

            if (request == null)
            {
                _logger.LogWarning("Request body is null");
                return BadRequest(new { error = "Request body is required" });
            }

            // Get access token from Authorization header or cookie
            
            // if(string.IsNullOrEmpty(request.UserImageUrl))
            // {
            //     return BadRequest(new { error = "User image URL is required" });
            // }

            if (string.IsNullOrEmpty(request.ClothingImageUrl))
            {
                return BadRequest(new { error = "Clothing image URL is required" });
            }

            _logger.LogInformation("Starting try-on processing...");

            // Process the try-on request (automatically fetches user image from DB)
            var generatedImagePath = await _tryOnService.ProcessTryOnRequestAsync(
                userId,
                request.ClothingImageUrl);
            
            // var generatedImagePath = await _tryOnService.ProcessTryOnFromUrlsAsync(
            //     request.UserImageUrl);

            _logger.LogInformation("Try-on processing completed. Generated path: {Path}", generatedImagePath);

            // Generate pre-signed URL for the generated image (valid for 1 hour)
            var generatedImageUrl = await _fileStorageService.GetPrivateFileUrlAsync(generatedImagePath, 3600);

            // Extract filename from path (e.g., "generated/guid.png" -> "guid.png")
            var fileName = Path.GetFileName(generatedImagePath);
            if (string.IsNullOrEmpty(fileName))
            {
                // Fallback: generate a filename from the path
                fileName = generatedImagePath.Replace("generated/", "").Replace("/", "-");
                if (string.IsNullOrEmpty(Path.GetExtension(fileName)))
                {
                    fileName = $"{fileName}.png";
                }
            }
            
            await _tryOnService.AddGeneratedImage(userId,request.ListingId,fileName);

            // Return response in the same format as ImageController
            return Ok(new
            {
                fileName = fileName,
                url = generatedImageUrl,
                type = "Generated"
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogWarning(ex, "Image not found: {Message}", ex.Message);
            return NotFound(new { error = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while downloading images or calling Virtual Try-On API");
            return StatusCode(500, new { error = $"HTTP error: {ex.Message}" });
        }
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "Request timed out");
            return StatusCode(504, new { error = "Request timed out. Image generation may take longer than expected." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing try-on request: {Message}, StackTrace: {StackTrace}", ex.Message, ex.StackTrace);
            return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
        }
    }
}