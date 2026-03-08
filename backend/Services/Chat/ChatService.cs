using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs.Chat;

namespace backend.Services.Chat
{
    public class ChatService : IChatService
    {
        private readonly AppDbContext _context;

        public ChatService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MessageDto> SendMessageAsync(Guid chatroomId, Guid authorId, string content)
        {
            // Validate chatroom exists
            var chatroom = await _context.Chatrooms.FindAsync(chatroomId);
            if (chatroom == null)
                throw new ArgumentException("Chatroom not found");

            // Validate sender belongs to chatroom
            if (chatroom.SellerId != authorId && chatroom.BuyerId != authorId)
                throw new UnauthorizedAccessException("User does not belong to this chatroom");

            // Validate content
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Message content cannot be empty");

            var message = new Message
            {
                Id = Guid.NewGuid(),
                SendDate = DateTimeOffset.UtcNow,
                Content = content,
                ChatroomId = chatroomId,
                AuthorId = authorId
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                SendDate = message.SendDate,
                Content = message.Content,
                ChatroomId = message.ChatroomId,
                AuthorId = message.AuthorId
            };
        }

        public async Task<List<MessageDto>> GetMessagesAsync(Guid chatroomId, int page = 1, int pageSize = 50)
        {
            var messages = await _context.Messages
                .Where(m => m.ChatroomId == chatroomId)
                .OrderByDescending(m => m.SendDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return messages.Select(m => new MessageDto
            {
                Id = m.Id,
                SendDate = m.SendDate,
                Content = m.Content,
                ChatroomId = m.ChatroomId,
                AuthorId = m.AuthorId
            }).Reverse().ToList(); // Reverse to get chronological order
        }

        public async Task<MessageDto?> GetMessageByIdAsync(Guid messageId)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message == null)
                return null;

            return new MessageDto
            {
                Id = message.Id,
                SendDate = message.SendDate,
                Content = message.Content,
                ChatroomId = message.ChatroomId,
                AuthorId = message.AuthorId
            };
        }

        public async Task DeleteMessageByIdAsync(Guid messageId)
        {
            var message = await _context.Messages.FindAsync(messageId);

            if (message != null)
            {
                _context.Messages.Remove(message);
                await _context.SaveChangesAsync();
            }
            else
            {
                throw new ArgumentException("Cannot find message");
            }
        }
    }
}
