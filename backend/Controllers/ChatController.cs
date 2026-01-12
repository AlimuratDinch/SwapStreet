using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Contracts;
using backend.DTOs.Chat;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatroomService _chatroomService;
        private readonly IChatService _chatService;

        public ChatController(IChatroomService chatroomService, IChatService chatService)
        {
            _chatroomService = chatroomService;
            _chatService = chatService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid token");
            }
            return userId;
        }

        /// <summary>
        /// Get all chatrooms for the authenticated user
        /// </summary>
        [HttpGet("chatrooms")]
        public async Task<IActionResult> GetChatrooms()
        {
            try
            {
                var userId = GetUserId();
                var chatrooms = await _chatroomService.GetUserChatroomsAsync(userId);
                return Ok(chatrooms);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific chatroom by ID
        /// </summary>
        [HttpGet("chatrooms/{chatroomId}")]
        public async Task<IActionResult> GetChatroom(Guid chatroomId)
        {
            try
            {
                var userId = GetUserId();

                // Verify user belongs to chatroom
                var belongsToChatroom = await _chatroomService.UserBelongsToChatroomAsync(userId, chatroomId);
                if (!belongsToChatroom)
                {
                    return Forbid("You do not have access to this chatroom");
                }

                var chatroom = await _chatroomService.GetChatroomByIdAsync(chatroomId);
                if (chatroom == null)
                {
                    return NotFound(new { Error = "Chatroom not found" });
                }

                return Ok(chatroom);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new chatroom
        /// </summary>
        [HttpPost("chatrooms")]
        public async Task<IActionResult> CreateChatroom([FromBody] CreateChatroomDto dto)
        {
            try
            {
                var userId = GetUserId();

                // User must be either seller or buyer
                if (dto.SellerId != userId && dto.BuyerId != userId)
                {
                    return Forbid("You can only create chatrooms where you are the seller or buyer");
                }

                var chatroom = await _chatroomService.CreateChatroomAsync(dto);
                return CreatedAtAction(nameof(GetChatroom), new { chatroomId = chatroom.Id }, chatroom);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Get or create a chatroom between seller and buyer
        /// </summary>
        [HttpPost("chatrooms/get-or-create")]
        public async Task<IActionResult> GetOrCreateChatroom([FromBody] CreateChatroomDto dto)
        {
            try
            {
                var userId = GetUserId();

                // User must be either seller or buyer
                if (dto.SellerId != userId && dto.BuyerId != userId)
                {
                    return Forbid("You can only access chatrooms where you are the seller or buyer");
                }

                var chatroom = await _chatroomService.GetOrCreateChatroomAsync(dto.SellerId, dto.BuyerId);
                return Ok(chatroom);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Get messages for a chatroom with pagination
        /// </summary>
        [HttpGet("chatrooms/{chatroomId}/messages")]
        public async Task<IActionResult> GetMessages(Guid chatroomId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                var userId = GetUserId();

                // Verify user belongs to chatroom
                var belongsToChatroom = await _chatroomService.UserBelongsToChatroomAsync(userId, chatroomId);
                if (!belongsToChatroom)
                {
                    return Forbid("You do not have access to this chatroom");
                }

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 50;

                var messages = await _chatService.GetMessagesAsync(chatroomId, page, pageSize);
                return Ok(messages);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Error = ex.Message });
            }
        }
    }
}
