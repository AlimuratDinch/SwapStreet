using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using backend.Contracts;
using System.Security.Claims;

namespace backend.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly IChatroomService _chatroomService;

        public ChatHub(IChatService chatService, IChatroomService chatroomService)
        {
            _chatService = chatService;
            _chatroomService = chatroomService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid token");
            }
            return userId;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a chatroom group
        /// </summary>
        public async Task JoinChatroom(Guid chatroomId)
        {
            try
            {
                var userId = GetUserId();

                // Verify user belongs to chatroom
                var belongsToChatroom = await _chatroomService.UserBelongsToChatroomAsync(userId, chatroomId);
                if (!belongsToChatroom)
                {
                    await Clients.Caller.SendAsync("Error", "You do not have access to this chatroom");
                    return;
                }

                var groupName = GetGroupName(chatroomId);
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                await Clients.Caller.SendAsync("JoinedChatroom", chatroomId);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        /// <summary>
        /// Leave a chatroom group
        /// </summary>
        public async Task LeaveChatroom(Guid chatroomId)
        {
            try
            {
                var groupName = GetGroupName(chatroomId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                await Clients.Caller.SendAsync("LeftChatroom", chatroomId);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        /// <summary>
        /// Send a message to a chatroom
        /// </summary>
        public async Task SendMessage(Guid chatroomId, string content)
        {
            try
            {
                var userId = GetUserId();

                // Verify user belongs to chatroom
                var belongsToChatroom = await _chatroomService.UserBelongsToChatroomAsync(userId, chatroomId);
                if (!belongsToChatroom)
                {
                    await Clients.Caller.SendAsync("Error", "You do not have access to this chatroom");
                    return;
                }

                var chatroom = await _chatroomService.GetChatroomByIdAsync(chatroomId);
                if (chatroom == null)
                {
                    await Clients.Caller.SendAsync("Error", "Chatroom not found");
                    return;
                }

                if (chatroom.IsArchived || chatroom.IsFrozen)
                {
                    await Clients.Caller.SendAsync("Error", "Chatroom is read-only");
                    return;
                }

                // Validate content
                if (string.IsNullOrWhiteSpace(content))
                {
                    await Clients.Caller.SendAsync("Error", "Message content cannot be empty");
                    return;
                }

                // Save message to database
                var messageDto = await _chatService.SendMessageAsync(chatroomId, userId, content);

                // Broadcast to all clients in the chatroom group
                var groupName = GetGroupName(chatroomId);
                await Clients.Group(groupName).SendAsync("ReceiveMessage", messageDto);

                var recipientId = chatroom.SellerId == userId ? chatroom.BuyerId : chatroom.SellerId;
                await Clients.User(recipientId.ToString()).SendAsync("ReceiveChatNotification", new
                {
                    chatroomId = messageDto.ChatroomId,
                    senderId = userId.ToString(),
                    content = messageDto.Content,
                    sendDate = messageDto.SendDate
                });
            }
            catch (ArgumentException ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
            catch (Exception)
            {
                await Clients.Caller.SendAsync("Error", "An error occurred while sending the message");
            }
        }

        /// <summary>
        /// Mark all unread messages in a chatroom as read by the current user
        /// </summary>
        public async Task MarkAsRead(Guid chatroomId)
        {
            try
            {
                var userId = GetUserId();

                var belongsToChatroom = await _chatroomService.UserBelongsToChatroomAsync(userId, chatroomId);
                if (!belongsToChatroom)
                {
                    await Clients.Caller.SendAsync("Error", "You do not have access to this chatroom");
                    return;
                }

                var result = await _chatService.MarkMessagesAsReadAsync(chatroomId, userId);

                // Notify everyone in the room (so the sender sees the read receipt)
                var groupName = GetGroupName(chatroomId);
                await Clients.Group(groupName).SendAsync("MessagesRead", result);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        private static string GetGroupName(Guid chatroomId)
        {
            return $"chatroom-{chatroomId}";
        }
    }
}