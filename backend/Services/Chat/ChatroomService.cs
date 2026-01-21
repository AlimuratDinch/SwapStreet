using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs.Chat;

namespace backend.Services.Chat
{
    public class ChatroomService : IChatroomService
    {
        private readonly AppDbContext _context;

        public ChatroomService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ChatroomDto?> GetChatroomByIdAsync(Guid chatroomId)
        {
            var chatroom = await _context.Chatrooms
                .Include(c => c.Messages.OrderBy(m => m.SendDate))
                .FirstOrDefaultAsync(c => c.Id == chatroomId);

            if (chatroom == null)
                return null;

            return new ChatroomDto
            {
                Id = chatroom.Id,
                CreationTime = chatroom.CreationTime,
                SellerId = chatroom.SellerId,
                BuyerId = chatroom.BuyerId,
                Messages = chatroom.Messages.Select(m => new MessageDto
                {
                    Id = m.Id,
                    SendDate = m.SendDate,
                    Content = m.Content,
                    ChatroomId = m.ChatroomId,
                    AuthorId = m.AuthorId
                }).ToList()
            };
        }

        public async Task<List<ChatroomDto>> GetUserChatroomsAsync(Guid userId)
        {
            var chatrooms = await _context.Chatrooms
                .Where(c => c.SellerId == userId || c.BuyerId == userId)
                .Include(c => c.Messages)
                .ToListAsync();

            // Get last message for each chatroom and order by last message date or creation time
            var chatroomsWithLastMessage = chatrooms.Select(c => new
            {
                Chatroom = c,
                LastMessage = c.Messages.OrderByDescending(m => m.SendDate).FirstOrDefault()
            })
            .OrderByDescending(x => x.LastMessage?.SendDate ?? x.Chatroom.CreationTime)
            .ToList();

            return chatroomsWithLastMessage.Select(x =>
            {
                var c = x.Chatroom;
                var lastMessage = x.LastMessage;

                return new ChatroomDto
                {
                    Id = c.Id,
                    CreationTime = c.CreationTime,
                    SellerId = c.SellerId,
                    BuyerId = c.BuyerId,
                    Messages = lastMessage != null ? new List<MessageDto>
                    {
                        new MessageDto
                        {
                            Id = lastMessage.Id,
                            SendDate = lastMessage.SendDate,
                            Content = lastMessage.Content,
                            ChatroomId = lastMessage.ChatroomId,
                            AuthorId = lastMessage.AuthorId
                        }
                    } : new List<MessageDto>()
                };
            }).ToList();
        }

        public async Task<ChatroomDto> CreateChatroomAsync(CreateChatroomDto dto)
        {
            // Validate that both profiles exist
            var sellerExists = await _context.Profiles.AnyAsync(p => p.Id == dto.SellerId);
            var buyerExists = await _context.Profiles.AnyAsync(p => p.Id == dto.BuyerId);

            if (!sellerExists)
                throw new ArgumentException("Seller profile not found");
            if (!buyerExists)
                throw new ArgumentException("Buyer profile not found");
            if (dto.SellerId == dto.BuyerId)
                throw new ArgumentException("Seller and Buyer cannot be the same user");

            var chatroom = new Chatroom
            {
                Id = Guid.NewGuid(),
                CreationTime = DateTimeOffset.UtcNow,
                SellerId = dto.SellerId,
                BuyerId = dto.BuyerId
            };

            _context.Chatrooms.Add(chatroom);
            await _context.SaveChangesAsync();

            return (await GetChatroomByIdAsync(chatroom.Id))!;
        }

        public async Task<ChatroomDto?> GetOrCreateChatroomAsync(Guid sellerId, Guid buyerId)
        {
            var existingChatroom = await _context.Chatrooms
                .FirstOrDefaultAsync(c =>
                    (c.SellerId == sellerId && c.BuyerId == buyerId) ||
                    (c.SellerId == buyerId && c.BuyerId == sellerId));

            if (existingChatroom != null)
            {
                return await GetChatroomByIdAsync(existingChatroom.Id);
            }

            var createDto = new CreateChatroomDto
            {
                SellerId = sellerId,
                BuyerId = buyerId
            };

            return await CreateChatroomAsync(createDto);
        }

        public async Task<bool> UserBelongsToChatroomAsync(Guid userId, Guid chatroomId)
        {
            return await _context.Chatrooms
                .AnyAsync(c => c.Id == chatroomId && (c.SellerId == userId || c.BuyerId == userId));
        }
        
        public async void DeleteChatroomAsync(Guid chatroomId)
        {
            var chatroom = await _context.Chatrooms.FindAsync(chatroomId);
            
            if (chatroom != null)
            {
                _context.Chatrooms.Remove(chatroom);
                await _context.SaveChangesAsync();
                return;
            }
            else
            {
                throw new ArgumentException("Cannot find chatroom");
            }
        }
    }
}
