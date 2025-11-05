using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.DTOs;
using backend.Models;

namespace TestProject.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly ICatalogService _catalog;
    public CatalogController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet("items")]
    public IActionResult GetAllItems(
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? categoryId,
        [FromQuery] string? conditions)
    {
        var items = _catalog.GetAllItems();
        if (minPrice.HasValue)
            items = items.Where(i => i.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            items = items.Where(i => i.Price <= maxPrice.Value);
        if (categoryId.HasValue)
            items = items.Where(i => i.CategoryId == categoryId.Value);
        if (!string.IsNullOrEmpty(conditions))
        {
            var conditionList = conditions.Split(',').Select(c => c.Trim()).ToArray();
            items = items.Where(i => conditionList.Contains(i.Condition, StringComparer.OrdinalIgnoreCase));
        }
        var response = items.Select(i => new
        {
            id = i.Id,
            title = i.Title,
            description = i.Description,
            imageUrl = i.ImageUrl
        });
        return Ok(response);
    }

    [HttpGet("items/{id}")]
    public IActionResult GetItemById(int id)
    {
        var item = _catalog.GetItemById(id);
        if (item == null) return NotFound();
        return Ok(new ItemResponse(item.Id, item.Title, item.Description, item.Condition, item.Price, item.ImageUrl, item.CategoryId));
    }

    [HttpPost("items")]
    public IActionResult AddItem([FromBody] CreateItemRequest request)
    {
        var item = new Item
        {
            Title = request.Title,
            Description = request.Description,
            Condition = request.Condition,
            Price = request.Price,
            ImageUrl = request.ImageUrl,
            CategoryId = request.CategoryId
        };
        var saved = _catalog.AddItem(item);
        return Ok(new ItemResponse(saved.Id, saved.Title, saved.Description, saved.Condition, saved.Price, saved.ImageUrl, saved.CategoryId));
    }

    [HttpPut("items/{id}")]
    public IActionResult UpdateItem(int id, [FromBody] UpdateItemRequest request)
    {
        var updated = new Item
        {
            Title = request.Title,
            Description = request.Description,
            Condition = request.Condition,
            Price = request.Price,
            ImageUrl = request.ImageUrl,
            CategoryId = request.CategoryId
        };
        try
        {
            var saved = _catalog.UpdateItem(id, updated);
            return Ok(new ItemResponse(saved.Id, saved.Title, saved.Description, saved.Condition, saved.Price, saved.ImageUrl, saved.CategoryId));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("items/{id}")]
    public IActionResult DeleteItem(int id)
    {
        return _catalog.DeleteItem(id) ? NoContent() : NotFound();
    }

    // ---- CATEGORIES ----
    [HttpGet("categories")]
    public IActionResult GetAllCategories()
    {
        var categories = _catalog.GetAllCategories()
            .Select(c => new CategoryResponse(c.Id, c.Name, c.Items.Select(i => new ItemResponse(i.Id, i.Title, i.Description, i.Condition, i.Price, i.ImageUrl, i.CategoryId))));
        return Ok(categories);
    }

    [HttpGet("categories/{id}")]
    public IActionResult GetCategoryById(int id)
    {
        var cat = _catalog.GetCategoryById(id);
        if (cat == null) return NotFound();
        return Ok(new CategoryResponse(cat.Id, cat.Name, cat.Items.Select(i => new ItemResponse(i.Id, i.Title, i.Description, i.Condition, i.Price, i.ImageUrl, i.CategoryId))));
    }

    [HttpPost("categories")]
    public IActionResult AddCategory([FromBody] CreateCategoryRequest request)
    {
        var cat = new Category { Name = request.Name };
        var saved = _catalog.AddCategory(cat);
        return Ok(new CategoryResponse(saved.Id, saved.Name, saved.Items.Select(i => new ItemResponse(i.Id, i.Title, i.Description, i.Condition, i.Price, i.ImageUrl, i.CategoryId))));
    }

    [HttpPut("categories/{id}")]
    public IActionResult UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
    {
        try
        {
            var updated = _catalog.UpdateCategory(id, new Category { Name = request.Name });
            return Ok(new CategoryResponse(updated.Id, updated.Name, updated.Items.Select(i => new ItemResponse(i.Id, i.Title, i.Description, i.Condition, i.Price, i.ImageUrl, i.CategoryId))));
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("categories/{id}")]
    public IActionResult DeleteCategory(int id)
    {
        return _catalog.DeleteCategory(id) ? NoContent() : NotFound();
    }
}
