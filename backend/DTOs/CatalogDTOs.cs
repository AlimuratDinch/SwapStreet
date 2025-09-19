namespace backend.DTOs;

// Category DTOs
public record CategoryResponse(
    int Id,
    string Name,
    IEnumerable<ItemResponse> Items
);

public record CreateCategoryRequest(string Name);
public record UpdateCategoryRequest(string Name);

// Item DTOs
public record CreateItemRequest(
    string Title,
    string Description,
    string Condition,
    decimal Price,
    string ImageUrl,
    int CategoryId
);

public record ItemResponse(
    int Id,
    string Title,
    string Description,
    string Condition,
    decimal Price,
    string ImageUrl,
    int CategoryId
);

public record UpdateItemRequest(
    string Title,
    string Description,
    string Condition,
    decimal Price,
    string ImageUrl,
    int CategoryId
);
