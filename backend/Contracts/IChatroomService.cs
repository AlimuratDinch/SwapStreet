using backend.DTOs.Chat;

namespace backend.Contracts
{
    public interface IChatroomService
    {
        Task<ChatroomDto?> GetChatroomByIdAsync(Guid chatroomId);
        Task<List<ChatroomDto>> GetUserChatroomsAsync(Guid userId);
        Task<ChatroomDto> CreateChatroomAsync(CreateChatroomDto dto);
        Task<ChatroomDto?> GetOrCreateChatroomAsync(Guid sellerId, Guid buyerId, Guid? listingId = null);
        Task<ChatroomDto> CloseDealAsync(Guid chatroomId, Guid sellerId, int? stars = null, string? description = null);
        Task<ChatroomDto> SubmitRatingAsync(Guid chatroomId, Guid reviewerId, int stars, string? description = null);
        Task<bool> UserBelongsToChatroomAsync(Guid userId, Guid chatroomId);
        Task DeleteChatroomAsync(Guid chatroomId);
    }
}
