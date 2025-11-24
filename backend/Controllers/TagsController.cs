using backend.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagsController(ITagService tagService)
        {
            _tagService = tagService;
        }

        // GET: api/tags
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tags = await _tagService.GetAllAsync();
            return Ok(tags);
        }

        // GET: api/tags/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tag = await _tagService.GetByIdAsync(id);
            if (tag == null) return NotFound(new { error = "Tag not found" });
            return Ok(tag);
        }

        // POST: api/tags
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Tag tag)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdTag = await _tagService.CreateAsync(tag);
            return CreatedAtAction(nameof(GetById), new { id = createdTag.Id }, createdTag);
        }

        // PUT: api/tags/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Tag tag)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updatedTag = await _tagService.UpdateAsync(id, tag);
            if (updatedTag == null) return NotFound(new { error = "Tag not found" });
            return Ok(updatedTag);
        }

        // DELETE: api/tags/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _tagService.DeleteAsync(id);
            if (!success) return NotFound(new { error = "Tag not found" });
            return NoContent();
        }
    }
}
