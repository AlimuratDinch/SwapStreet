using backend.Contracts;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ListingsController : ControllerBase
    {
        private readonly IListingService _listingService;

        public ListingsController(IListingService listingService)
        {
            _listingService = listingService;
        }

        // GET: api/listings
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var listings = await _listingService.GetAllAsync();
            var response = listings.Select(MapToResponse);
            return Ok(response);
        }

        // GET: api/listings/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var listing = await _listingService.GetByIdAsync(id);
            if (listing == null) return NotFound(new { error = "Listing not found" });
            return Ok(MapToResponse(listing));
        }

        // GET: api/listings/profile/{profileId}
        [HttpGet("profile/{profileId}")]
        public async Task<IActionResult> GetByProfileId(Guid profileId)
        {
            var listings = await _listingService.GetByProfileIdAsync(profileId);
            var response = listings.Select(MapToResponse);
            return Ok(response);
        }

        // POST: api/listings
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateListingRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var listing = new Listing
            {
                Name = request.Name,
                Price = request.Price,
                Description = request.Description,
                ProfileId = request.ProfileId,
                TagId = request.TagId
            };

            var images = request.Images.Select(img => new ListingImage
            {
                ImagePath = img.ImagePath,
                DisplayOrder = img.DisplayOrder,
                ForTryon = img.ForTryon
            }).ToList();

            var createdListing = await _listingService.CreateAsync(listing, images);
            return CreatedAtAction(nameof(GetById), new { id = createdListing.Id }, MapToResponse(createdListing));
        }

        // PUT: api/listings/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateListingRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var listing = new Listing
            {
                Name = request.Name,
                Price = request.Price,
                Description = request.Description,
                TagId = request.TagId
            };

            var updatedListing = await _listingService.UpdateAsync(id, listing);
            if (updatedListing == null) return NotFound(new { error = "Listing not found" });
            return Ok(MapToResponse(updatedListing));
        }

        // DELETE: api/listings/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _listingService.DeleteAsync(id);
            if (!success) return NotFound(new { error = "Listing not found" });
            return NoContent();
        }

        // Helper method to map Listing to ListingResponse
        private ListingResponse MapToResponse(Listing listing)
        {
            return new ListingResponse
            {
                Id = listing.Id,
                Name = listing.Name,
                Price = listing.Price,
                Description = listing.Description,
                ProfileId = listing.ProfileId,
                TagId = listing.TagId,
                Images = listing.Images?.Select(img => new ListingImageResponse
                {
                    Id = img.Id,
                    ImagePath = img.ImagePath,
                    DisplayOrder = img.DisplayOrder,
                    ForTryon = img.ForTryon
                }).ToList() ?? new List<ListingImageResponse>(),
                CreatedAt = listing.CreatedAt,
                UpdatedAt = listing.UpdatedAt
            };
        }
    }
}
