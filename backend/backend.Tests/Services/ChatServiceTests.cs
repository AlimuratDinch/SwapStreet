using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DbContexts;
using backend.Services.Chat;
using backend.DTOs.Chat;
using Microsoft.EntityFrameworkCore;
using Xunit;
using AwesomeAssertions;

namespace backend.Tests.Services
{
    public class ChatServiceTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly ChatService _chatService;
        private readonly ChatroomService _chatroomService;
        private readonly Guid _sellerId;
        private readonly Guid _buyerId;
        private readonly Guid _chatroomId;
        private readonly int _testCityId;
        private readonly int _testProvinceId;

        public ChatServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);
            _chatService = new ChatService(_db);
            _chatroomService = new ChatroomService(_db);

            _sellerId = Guid.NewGuid();
            _buyerId = Guid.NewGuid();
            _chatroomId = Guid.NewGuid();
            _testProvinceId = 1;
            _testCityId = 1;

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Add test province
            var province = new Province
            {
                Id = _testProvinceId,
                Name = "Ontario",
                Code = "ON"
            };
            _db.Provinces.Add(province);

            // Add test city
            var city = new City
            {
                Id = _testCityId,
                Name = "Toronto",
                ProvinceId = _testProvinceId
            };
            _db.Cities.Add(city);

            // Add test profiles (seller and buyer)
            var sellerProfile = new Profile
            {
                Id = _sellerId,
                FirstName = "Seller",
                LastName = "User",
                CityId = _testCityId,
                FSA = "M5V",
                Status = ProfileStatusEnum.Online
            };
            _db.Profiles.Add(sellerProfile);

            var buyerProfile = new Profile
            {
                Id = _buyerId,
                FirstName = "Buyer",
                LastName = "User",
                CityId = _testCityId,
                FSA = "M5V",
                Status = ProfileStatusEnum.Online
            };
            _db.Profiles.Add(buyerProfile);

            // Add test chatroom
            var chatroom = new Chatroom
            {
                Id = _chatroomId,
                SellerId = _sellerId,
                BuyerId = _buyerId,
                CreationTime = DateTimeOffset.UtcNow
            };
            _db.Chatrooms.Add(chatroom);

            _db.SaveChanges();
        }

        public void Dispose()
        {
            _db.Database.EnsureDeleted();
            _db.Dispose();
        }

        // ==========================================
        // ChatService Tests
        // ==========================================

        [Fact]
        public async Task SendMessageAsync_ShouldCreateMessage_WhenValidRequest()
        {
            // Arrange
            var content = "Hello, I'm interested in your item!";

            // Act
            var result = await _chatService.SendMessageAsync(_chatroomId, _buyerId, content);

            // Assert
            result.Should().NotBeNull();
            result.Content.Should().Be(content);
            result.ChatroomId.Should().Be(_chatroomId);
            result.SendDate.Should().NotBeNull();
            result.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public async Task SendMessageAsync_ShouldThrowException_WhenChatroomNotFound()
        {
            // Arrange
            var nonExistentChatroomId = Guid.NewGuid();
            var content = "Hello!";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _chatService.SendMessageAsync(nonExistentChatroomId, _buyerId, content)
            );

            exception.Message.Should().Be("Chatroom not found");
        }

        [Fact]
        public async Task SendMessageAsync_ShouldThrowException_WhenUserNotInChatroom()
        {
            // Arrange
            var outsiderId = Guid.NewGuid();
            var content = "Hello!";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _chatService.SendMessageAsync(_chatroomId, outsiderId, content)
            );

            exception.Message.Should().Be("User does not belong to this chatroom");
        }

        [Fact]
        public async Task SendMessageAsync_ShouldThrowException_WhenContentEmpty()
        {
            // Arrange
            var emptyContent = "";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _chatService.SendMessageAsync(_chatroomId, _buyerId, emptyContent)
            );

            exception.Message.Should().Be("Message content cannot be empty");
        }

        [Fact]
        public async Task SendMessageAsync_ShouldThrowException_WhenContentWhitespace()
        {
            // Arrange
            var whitespaceContent = "   ";

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _chatService.SendMessageAsync(_chatroomId, _buyerId, whitespaceContent)
            );

            exception.Message.Should().Be("Message content cannot be empty");
        }

        [Fact]
        public async Task SendMessageAsync_ShouldAllowBothParticipantsToSend()
        {
            // Arrange & Act
            var sellerMessage = await _chatService.SendMessageAsync(_chatroomId, _sellerId, "Seller message");
            var buyerMessage = await _chatService.SendMessageAsync(_chatroomId, _buyerId, "Buyer message");

            // Assert
            sellerMessage.Should().NotBeNull();
            buyerMessage.Should().NotBeNull();
            sellerMessage.Content.Should().Be("Seller message");
            buyerMessage.Content.Should().Be("Buyer message");
        }

        [Fact]
        public async Task GetMessagesAsync_ShouldReturnMessages_InChronologicalOrder()
        {
            // Arrange
            await _chatService.SendMessageAsync(_chatroomId, _sellerId, "First message");
            await Task.Delay(10); // Ensure different timestamps
            await _chatService.SendMessageAsync(_chatroomId, _buyerId, "Second message");
            await Task.Delay(10);
            await _chatService.SendMessageAsync(_chatroomId, _sellerId, "Third message");

            // Act
            var messages = await _chatService.GetMessagesAsync(_chatroomId);

            // Assert
            messages.Should().HaveCount(3);
            messages[0].Content.Should().Be("First message");
            messages[1].Content.Should().Be("Second message");
            messages[2].Content.Should().Be("Third message");
        }

        [Fact]
        public async Task GetMessagesAsync_ShouldReturnEmptyList_WhenNoMessages()
        {
            // Arrange - chatroom exists but no messages

            // Act
            var messages = await _chatService.GetMessagesAsync(_chatroomId);

            // Assert
            messages.Should().BeEmpty();
        }

        [Fact]
        public async Task GetMessagesAsync_ShouldRespectPagination()
        {
            // Arrange - Add 5 messages
            for (int i = 1; i <= 5; i++)
            {
                await _chatService.SendMessageAsync(_chatroomId, _sellerId, $"Message {i}");
                await Task.Delay(10);
            }

            // Act - Get page 1 with size 2
            var page1 = await _chatService.GetMessagesAsync(_chatroomId, page: 1, pageSize: 2);
            var page2 = await _chatService.GetMessagesAsync(_chatroomId, page: 2, pageSize: 2);
            var page3 = await _chatService.GetMessagesAsync(_chatroomId, page: 3, pageSize: 2);

            // Assert
            page1.Should().HaveCount(2);
            page2.Should().HaveCount(2);
            page3.Should().HaveCount(1);
            
            // Verify order (most recent first when paginating, then reversed)
            page1[0].Content.Should().Be("Message 4");
            page1[1].Content.Should().Be("Message 5");
        }

        [Fact]
        public async Task GetMessageByIdAsync_ShouldReturnMessage_WhenExists()
        {
            // Arrange
            var sentMessage = await _chatService.SendMessageAsync(_chatroomId, _buyerId, "Test message");

            // Act
            var result = await _chatService.GetMessageByIdAsync(sentMessage.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(sentMessage.Id);
            result.Content.Should().Be("Test message");
            result.ChatroomId.Should().Be(_chatroomId);
        }

        [Fact]
        public async Task GetMessageByIdAsync_ShouldReturnNull_WhenNotExists()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var result = await _chatService.GetMessageByIdAsync(nonExistentId);

            // Assert
            result.Should().BeNull();
        }
    }

    public class ChatroomServiceTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly ChatroomService _service;
        private readonly Guid _sellerId;
        private readonly Guid _buyerId;
        private readonly Guid _thirdUserId;
        private readonly int _testCityId;
        private readonly int _testProvinceId;

        public ChatroomServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);
            _service = new ChatroomService(_db);

            _sellerId = Guid.NewGuid();
            _buyerId = Guid.NewGuid();
            _thirdUserId = Guid.NewGuid();
            _testProvinceId = 1;
            _testCityId = 1;

            SeedTestData();
        }

        private void SeedTestData()
        {
            // Add test province
            var province = new Province
            {
                Id = _testProvinceId,
                Name = "Ontario",
                Code = "ON"
            };
            _db.Provinces.Add(province);

            // Add test city
            var city = new City
            {
                Id = _testCityId,
                Name = "Toronto",
                ProvinceId = _testProvinceId
            };
            _db.Cities.Add(city);

            // Add test profiles
            var profiles = new[]
            {
                new Profile { Id = _sellerId, FirstName = "Seller", LastName = "User", CityId = _testCityId, FSA = "M5V" },
                new Profile { Id = _buyerId, FirstName = "Buyer", LastName = "User", CityId = _testCityId, FSA = "M5V" },
                new Profile { Id = _thirdUserId, FirstName = "Third", LastName = "User", CityId = _testCityId, FSA = "M5V" }
            };
            _db.Profiles.AddRange(profiles);

            _db.SaveChanges();
        }

        public void Dispose()
        {
            _db.Database.EnsureDeleted();
            _db.Dispose();
        }

        // ==========================================
        // ChatroomService Tests
        // ==========================================

        [Fact]
        public async Task CreateChatroomAsync_ShouldCreateChatroom_WhenValidRequest()
        {
            // Arrange
            var dto = new CreateChatroomDto
            {
                SellerId = _sellerId,
                BuyerId = _buyerId
            };

            // Act
            var result = await _service.CreateChatroomAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBe(Guid.Empty);
            result.SellerId.Should().Be(_sellerId);
            result.BuyerId.Should().Be(_buyerId);
            result.CreationTime.Should().NotBeNull();
            result.Messages.Should().BeEmpty();
        }

        [Fact]
        public async Task CreateChatroomAsync_ShouldThrowException_WhenSellerNotFound()
        {
            // Arrange
            var dto = new CreateChatroomDto
            {
                SellerId = Guid.NewGuid(), // Non-existent
                BuyerId = _buyerId
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateChatroomAsync(dto)
            );

            exception.Message.Should().Be("Seller profile not found");
        }

        [Fact]
        public async Task CreateChatroomAsync_ShouldThrowException_WhenBuyerNotFound()
        {
            // Arrange
            var dto = new CreateChatroomDto
            {
                SellerId = _sellerId,
                BuyerId = Guid.NewGuid() // Non-existent
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateChatroomAsync(dto)
            );

            exception.Message.Should().Be("Buyer profile not found");
        }

        [Fact]
        public async Task CreateChatroomAsync_ShouldThrowException_WhenSellerAndBuyerAreSame()
        {
            // Arrange
            var dto = new CreateChatroomDto
            {
                SellerId = _sellerId,
                BuyerId = _sellerId // Same as seller
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateChatroomAsync(dto)
            );

            exception.Message.Should().Be("Seller and Buyer cannot be the same user");
        }

        [Fact]
        public async Task GetChatroomByIdAsync_ShouldReturnChatroom_WhenExists()
        {
            // Arrange
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var created = await _service.CreateChatroomAsync(dto);

            // Act
            var result = await _service.GetChatroomByIdAsync(created.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(created.Id);
            result.SellerId.Should().Be(_sellerId);
            result.BuyerId.Should().Be(_buyerId);
        }

        [Fact]
        public async Task GetChatroomByIdAsync_ShouldReturnNull_WhenNotExists()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var result = await _service.GetChatroomByIdAsync(nonExistentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetChatroomByIdAsync_ShouldIncludeMessages()
        {
            // Arrange
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var chatroom = await _service.CreateChatroomAsync(dto);

            // Add messages directly to database
            var message = new Message
            {
                Id = Guid.NewGuid(),
                ChatroomId = chatroom.Id,
                Content = "Test message",
                SendDate = DateTimeOffset.UtcNow
            };
            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.GetChatroomByIdAsync(chatroom.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Messages.Should().HaveCount(1);
            result.Messages[0].Content.Should().Be("Test message");
        }

        [Fact]
        public async Task GetUserChatroomsAsync_ShouldReturnChatroomsForUser()
        {
            // Arrange
            var dto1 = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var dto2 = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _thirdUserId };
            await _service.CreateChatroomAsync(dto1);
            await _service.CreateChatroomAsync(dto2);

            // Act
            var sellerChatrooms = await _service.GetUserChatroomsAsync(_sellerId);
            var buyerChatrooms = await _service.GetUserChatroomsAsync(_buyerId);
            var thirdUserChatrooms = await _service.GetUserChatroomsAsync(_thirdUserId);

            // Assert
            sellerChatrooms.Should().HaveCount(2);
            buyerChatrooms.Should().HaveCount(1);
            thirdUserChatrooms.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetUserChatroomsAsync_ShouldReturnEmptyList_WhenNoChatrooms()
        {
            // Arrange
            var userWithNoChatrooms = Guid.NewGuid();

            // Act
            var result = await _service.GetUserChatroomsAsync(userWithNoChatrooms);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetUserChatroomsAsync_ShouldOrderByLastMessage()
        {
            // Arrange - Create two chatrooms
            var dto1 = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var dto2 = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _thirdUserId };
            var chatroom1 = await _service.CreateChatroomAsync(dto1);
            await Task.Delay(50);
            var chatroom2 = await _service.CreateChatroomAsync(dto2);

            // Add older message to chatroom1
            _db.Messages.Add(new Message
            {
                Id = Guid.NewGuid(),
                ChatroomId = chatroom1.Id,
                Content = "Old message",
                SendDate = DateTimeOffset.UtcNow.AddHours(-1)
            });

            // Add newer message to chatroom2
            _db.Messages.Add(new Message
            {
                Id = Guid.NewGuid(),
                ChatroomId = chatroom2.Id,
                Content = "New message",
                SendDate = DateTimeOffset.UtcNow
            });
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.GetUserChatroomsAsync(_sellerId);

            // Assert - chatroom2 should be first (most recent message)
            result.Should().HaveCount(2);
            result[0].Id.Should().Be(chatroom2.Id);
            result[1].Id.Should().Be(chatroom1.Id);
        }

        [Fact]
        public async Task GetOrCreateChatroomAsync_ShouldCreateNew_WhenNotExists()
        {
            // Arrange - no chatroom exists between seller and buyer

            // Act
            var result = await _service.GetOrCreateChatroomAsync(_sellerId, _buyerId);

            // Assert
            result.Should().NotBeNull();
            result!.SellerId.Should().Be(_sellerId);
            result.BuyerId.Should().Be(_buyerId);

            // Verify it was persisted
            var chatrooms = await _service.GetUserChatroomsAsync(_sellerId);
            chatrooms.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetOrCreateChatroomAsync_ShouldReturnExisting_WhenExists()
        {
            // Arrange - create a chatroom first
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var existing = await _service.CreateChatroomAsync(dto);

            // Act
            var result = await _service.GetOrCreateChatroomAsync(_sellerId, _buyerId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(existing.Id);

            // Verify no duplicate was created
            var chatrooms = await _service.GetUserChatroomsAsync(_sellerId);
            chatrooms.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetOrCreateChatroomAsync_ShouldReturnExisting_WhenRolesReversed()
        {
            // Arrange - create chatroom with seller/buyer
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var existing = await _service.CreateChatroomAsync(dto);

            // Act - try to get/create with reversed roles
            var result = await _service.GetOrCreateChatroomAsync(_buyerId, _sellerId);

            // Assert - should return the existing chatroom
            result.Should().NotBeNull();
            result!.Id.Should().Be(existing.Id);

            // Verify no duplicate was created
            var chatrooms = await _service.GetUserChatroomsAsync(_sellerId);
            chatrooms.Should().HaveCount(1);
        }

        [Fact]
        public async Task UserBelongsToChatroomAsync_ShouldReturnTrue_ForSeller()
        {
            // Arrange
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var chatroom = await _service.CreateChatroomAsync(dto);

            // Act
            var result = await _service.UserBelongsToChatroomAsync(_sellerId, chatroom.Id);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task UserBelongsToChatroomAsync_ShouldReturnTrue_ForBuyer()
        {
            // Arrange
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var chatroom = await _service.CreateChatroomAsync(dto);

            // Act
            var result = await _service.UserBelongsToChatroomAsync(_buyerId, chatroom.Id);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task UserBelongsToChatroomAsync_ShouldReturnFalse_ForNonParticipant()
        {
            // Arrange
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var chatroom = await _service.CreateChatroomAsync(dto);

            // Act
            var result = await _service.UserBelongsToChatroomAsync(_thirdUserId, chatroom.Id);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task UserBelongsToChatroomAsync_ShouldReturnFalse_WhenChatroomNotExists()
        {
            // Arrange
            var nonExistentChatroomId = Guid.NewGuid();

            // Act
            var result = await _service.UserBelongsToChatroomAsync(_sellerId, nonExistentChatroomId);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetUserChatroomsAsync_ShouldIncludeLastMessage()
        {
            // Arrange
            var dto = new CreateChatroomDto { SellerId = _sellerId, BuyerId = _buyerId };
            var chatroom = await _service.CreateChatroomAsync(dto);

            // Add multiple messages
            _db.Messages.AddRange(
                new Message { Id = Guid.NewGuid(), ChatroomId = chatroom.Id, Content = "First", SendDate = DateTimeOffset.UtcNow.AddMinutes(-2) },
                new Message { Id = Guid.NewGuid(), ChatroomId = chatroom.Id, Content = "Last", SendDate = DateTimeOffset.UtcNow }
            );
            await _db.SaveChangesAsync();

            // Act
            var result = await _service.GetUserChatroomsAsync(_sellerId);

            // Assert
            result.Should().HaveCount(1);
            result[0].Messages.Should().HaveCount(1);
            result[0].Messages[0].Content.Should().Be("Last");
        }
    }
}
