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
            }
            catch (ArgumentException ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", "An error occurred while sending the message");
            }
        }

        private static string GetGroupName(Guid chatroomId)
        {
            return $"chatroom-{chatroomId}";
        }
    }
}
