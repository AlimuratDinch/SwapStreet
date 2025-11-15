using backend.Contracts;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.IO;

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

    [HttpPost("virtual-tryon")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> TryOnFromUrl([FromForm] TryOnRequestDto request)
    {
        try
        {
            _logger.LogInformation("Received try-on request");

            if (request == null)
            {
                _logger.LogWarning("Request body is null");
                return BadRequest(new { error = "Request body is required" });
            }

            // Get access token from request body or Authorization header/cookie
            string? accessToken = request.AccessToken;
            
            if (string.IsNullOrEmpty(accessToken))
            {
                // Try to get from Authorization header
                if (Request.Headers.ContainsKey("Authorization"))
                {
                    var authHeader = Request.Headers["Authorization"].ToString();
                    if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        accessToken = authHeader.Substring(7).Trim();
                    }
                    else
                    {
                        accessToken = authHeader.Trim();
                    }
                }
            }
            
            if (string.IsNullOrEmpty(accessToken))
            {
                accessToken = Request.Cookies["access_token"];
            }

            if (string.IsNullOrEmpty(accessToken))
            {
                return Unauthorized(new { error = "Access token is required" });
            }

            if (string.IsNullOrEmpty(request.ClothingImagePath))
            {
                return BadRequest(new { error = "Clothing image path is required" });
            }

            _logger.LogInformation("Starting try-on processing...");

            // Process the try-on request (automatically fetches user image from DB)
            var generatedImagePath = await _tryOnService.ProcessTryOnRequestAsync(
                accessToken,
                request.ClothingImagePath);

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
            _logger.LogError(ex, "HTTP error while downloading images or calling Gemini API");
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