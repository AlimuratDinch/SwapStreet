using backend.DTOs.Chat;

namespace backend.Contracts
{
    public interface IChatroomService
    {
        Task<ChatroomDto?> GetChatroomByIdAsync(Guid chatroomId);
        Task<List<ChatroomDto>> GetUserChatroomsAsync(Guid userId);
        Task<ChatroomDto> CreateChatroomAsync(CreateChatroomDto dto);
        Task<ChatroomDto?> GetOrCreateChatroomAsync(Guid sellerId, Guid buyerId);
        Task<bool> UserBelongsToChatroomAsync(Guid userId, Guid chatroomId);
    }
}
