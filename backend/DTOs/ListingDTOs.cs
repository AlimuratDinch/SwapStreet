namespace backend.DTOs
{
    public class CreateListingRequest
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public Guid ProfileId { get; set; }
        public Guid? TagId { get; set; }
        public List<CreateListingImageRequest> Images { get; set; } = new();
    }

    public class CreateListingImageRequest
    {
        public string ImagePath { get; set; } = "";
        public int DisplayOrder { get; set; }
        public bool ForTryon { get; set; }
    }

    public class UpdateListingRequest
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public Guid? TagId { get; set; }
    }

    public class ListingResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public Guid ProfileId { get; set; }
        public Guid? TagId { get; set; }
        public List<ListingImageResponse> Images { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ListingImageResponse
    {
        public Guid Id { get; set; }
        public string ImagePath { get; set; } = "";
        public int DisplayOrder { get; set; }
        public bool ForTryon { get; set; }
    }
}
