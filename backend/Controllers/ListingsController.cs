using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.Models;
using backend.Contracts;

[ApiController]
[Route("api/search")]
public class ListingsController : ControllerBase
{
    private readonly IListingSearchService _listingSearchService;

    public ListingsController(IListingSearchService listingSearchService)
    {
        _listingSearchService = listingSearchService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchListings(
        [FromQuery] string? q,
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20)
    {
        var (items, nextCursor, hasNextPage) = await _listingSearchService.SearchListingsAsync(q, Math.Min(limit, 50), cursor);  // Cap at 50

        return Ok(new
        {
            items,
            limit,
            nextCursor,
            hasNextPage
        });
    }
}
