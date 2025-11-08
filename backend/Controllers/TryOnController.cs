using backend.Contracts;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
namespace backend.Controllers;

[ApiController]
[Route("api/tryon")]
public class TryOnController : ControllerBase
{
    private readonly ITryOnService _tryOnService;
    private readonly ILogger<TryOnController> _logger;

    public TryOnController(ITryOnService tryOnService, ILogger<TryOnController> logger)
    {
        _tryOnService = tryOnService;
        _logger = logger;
    }

    [HttpPost("api/virtual-tryon")]
    public async Task<ActionResult<TryOnResponseDto>> TryOnFromUrl([FromBody] TryOnRequestDto request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.AccessToken))
            {
                return BadRequest(new { message = "Access token is required" });
            }

            if (string.IsNullOrEmpty(request.ClothingImagePath))
            {
                return BadRequest(new { message = "Clothing image path is required" });
            }

            var generatedImagePath = await _tryOnService.ProcessTryOnRequestAsync(
                request.AccessToken,
                request.ClothingImagePath);

            return Ok(new TryOnResponseDto
            {
                GeneratedImageUrl = generatedImagePath,
                Message = "Image generated successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Unauthorized(new { message = "Invalid access token" });
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogWarning(ex, "Image not found");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing try-on request");
            return StatusCode(500, new { message = "An error occurred processing your request" });
        }
    }
}