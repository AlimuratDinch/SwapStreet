using backend.DTOs.Chat;

namespace backend.Contracts
{
    public interface IChatService
    {
        Task<MessageDto> SendMessageAsync(Guid chatroomId, Guid senderId, string content);
        Task<List<MessageDto>> GetMessagesAsync(Guid chatroomId, int page = 1, int pageSize = 50);
        Task<MessageDto?> GetMessageByIdAsync(Guid messageId);
        Task DeleteMessageByIdAsync(Guid messageId);
    }
}
