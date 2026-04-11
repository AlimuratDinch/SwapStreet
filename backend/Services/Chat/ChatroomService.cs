using Microsoft.EntityFrameworkCore;
using backend.DbContexts;
using backend.Contracts;
using backend.DTOs.Chat;

namespace backend.Services.Chat
{
    public class ChatroomService : IChatroomService
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly IListingCommandService _listingCommandService;
        private readonly ISustainabilityTrackerService _sustainabilityTrackerService;

        public ChatroomService(
            AppDbContext context,
            IFileStorageService fileStorage,
            IListingCommandService listingCommandService,
            ISustainabilityTrackerService sustainabilityTrackerService)
        {
            _context = context;
            _fileStorage = fileStorage;
            _listingCommandService = listingCommandService;
            _sustainabilityTrackerService = sustainabilityTrackerService;
        }

        public async Task<ChatroomDto?> GetChatroomByIdAsync(Guid chatroomId)
        {
            var chatroom = await _context.Chatrooms
                .Include(c => c.Listing)
                .Include(c => c.Messages.OrderBy(m => m.SendDate))
                .Include(c => c.Ratings.OrderBy(r => r.CreatedAt))
                .FirstOrDefaultAsync(c => c.Id == chatroomId);

            if (chatroom == null)
            {
                return null;
            }

            var ratingStats = await GetRatingStatsAsync(new[] { chatroom.SellerId, chatroom.BuyerId });
            string? listingImageUrl = null;
            if (chatroom.ListingId.HasValue)
            {
                var image = await _context.ListingImages
                    .AsNoTracking()
                    .Where(li => li.ListingId == chatroom.ListingId.Value)
                    .OrderBy(li => li.DisplayOrder)
                    .FirstOrDefaultAsync();
                listingImageUrl = _fileStorage.GetPublicFileUrl(image?.ImagePath);
            }
            if (string.IsNullOrWhiteSpace(listingImageUrl) &&
                !string.IsNullOrWhiteSpace(chatroom.ListingImageSnapshotPath))
            {
                listingImageUrl = _fileStorage.GetPublicFileUrl(chatroom.ListingImageSnapshotPath);
            }
            return MapChatroomDto(chatroom, ratingStats, listingImageUrl);
        }

        public async Task<List<ChatroomDto>> GetUserChatroomsAsync(Guid userId)
        {
            var chatrooms = await _context.Chatrooms
                .Where(c => c.SellerId == userId || c.BuyerId == userId)
                .Include(c => c.Listing)
                .Include(c => c.Messages)
                .Include(c => c.Ratings)
                .ToListAsync();

            var profileIds = chatrooms
                .SelectMany(c => new[] { c.SellerId, c.BuyerId })
                .Distinct()
                .ToList();

            var ratingStats = await GetRatingStatsAsync(profileIds);

            var listingIds = chatrooms
                .Where(c => c.ListingId.HasValue)
                .Select(c => c.ListingId!.Value)
                .Distinct()
                .ToList();

            var listingImageMap = new Dictionary<Guid, string?>();
            if (listingIds.Count > 0)
            {
                var images = await _context.ListingImages
                    .AsNoTracking()
                    .Where(li => listingIds.Contains(li.ListingId))
                    .OrderBy(li => li.DisplayOrder)
                    .ToListAsync();

                listingImageMap = images
                    .GroupBy(li => li.ListingId)
                    .ToDictionary(
                        g => g.Key,
                        g => _fileStorage.GetPublicFileUrl(g.FirstOrDefault()?.ImagePath)
                    );
            }

            var chatroomsWithLastMessage = chatrooms
                .Select(c => new
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
                var sellerStats = ratingStats.TryGetValue(c.SellerId, out var seller) ? seller : ((double?)null, 0);
                var buyerStats = ratingStats.TryGetValue(c.BuyerId, out var buyer) ? buyer : ((double?)null, 0);
                var listingImageUrl = c.ListingId.HasValue && listingImageMap.TryGetValue(c.ListingId.Value, out var url)
                    ? url
                    : null;
                if (string.IsNullOrWhiteSpace(listingImageUrl) &&
                    !string.IsNullOrWhiteSpace(c.ListingImageSnapshotPath))
                {
                    listingImageUrl = _fileStorage.GetPublicFileUrl(c.ListingImageSnapshotPath);
                }

                return new ChatroomDto
                {
                    Id = c.Id,
                    CreationTime = c.CreationTime,
                    SellerId = c.SellerId,
                    BuyerId = c.BuyerId,
                    ListingId = c.ListingId,
                    ListingTitle = c.Listing?.Title,
                    ListingImageUrl = listingImageUrl,
                    IsDealClosed = c.IsDealClosed,
                    ClosedAt = c.ClosedAt,
                    IsArchived = c.IsArchived,
                    ArchivedAt = c.ArchivedAt,
                    IsFrozen = c.IsFrozen,
                    FrozenReason = c.FrozenReason,
                    CloseRequestedById = c.CloseRequestedById,
                    CloseRequestedAt = c.CloseRequestedAt,
                    CloseConfirmedBySeller = c.CloseConfirmedBySeller,
                    CloseConfirmedByBuyer = c.CloseConfirmedByBuyer,
                    SellerRatingAverage = sellerStats.Item1,
                    SellerRatingCount = sellerStats.Item2,
                    BuyerRatingAverage = buyerStats.Item1,
                    BuyerRatingCount = buyerStats.Item2,
                    Ratings = c.Ratings
                        .OrderBy(r => r.CreatedAt)
                        .Select(MapRatingDto)
                        .ToList(),
                    Messages = lastMessage != null
                        ? new List<MessageDto>
                        {
                            new MessageDto
                            {
                                Id = lastMessage.Id,
                                SendDate = lastMessage.SendDate,
                                Content = lastMessage.Content,
                                ChatroomId = lastMessage.ChatroomId,
                                AuthorId = lastMessage.AuthorId
                            }
                        }
                        : new List<MessageDto>()
                };
            }).ToList();
        }

        public async Task<ChatroomDto> CreateChatroomAsync(CreateChatroomDto dto)
        {
            var sellerExists = await _context.Profiles.AnyAsync(p => p.Id == dto.SellerId);
            var buyerExists = await _context.Profiles.AnyAsync(p => p.Id == dto.BuyerId);

            if (!sellerExists)
            {
                throw new ArgumentException("Seller profile not found");
            }

            if (!buyerExists)
            {
                throw new ArgumentException("Buyer profile not found");
            }

            if (dto.SellerId == dto.BuyerId)
            {
                throw new ArgumentException("Seller and Buyer cannot be the same user");
            }

            if (dto.ListingId.HasValue)
            {
                var listing = await _context.Listings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == dto.ListingId.Value);

                if (listing == null)
                {
                    throw new ArgumentException("Listing not found");
                }

                if (listing.ProfileId != dto.SellerId)
                {
                    throw new ArgumentException("Listing does not belong to seller");
                }
            }

            var chatroom = new Chatroom
            {
                Id = Guid.NewGuid(),
                CreationTime = DateTimeOffset.UtcNow,
                SellerId = dto.SellerId,
                BuyerId = dto.BuyerId,
                ListingId = dto.ListingId,
                IsDealClosed = false,
                ClosedAt = null
            };

            _context.Chatrooms.Add(chatroom);
            await _context.SaveChangesAsync();

            return (await GetChatroomByIdAsync(chatroom.Id))!;
        }

        public async Task<ChatroomDto?> GetOrCreateChatroomAsync(Guid sellerId, Guid buyerId, Guid? listingId = null)
        {
            if (listingId.HasValue)
            {
                var listing = await _context.Listings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == listingId.Value);

                if (listing == null)
                {
                    throw new ArgumentException("Listing not found");
                }

                if (listing.ProfileId != sellerId)
                {
                    throw new ArgumentException("Listing does not belong to seller");
                }

                var existingWithListing = await _context.Chatrooms
                    .FirstOrDefaultAsync(c =>
                        c.ListingId == listingId.Value &&
                        ((c.SellerId == sellerId && c.BuyerId == buyerId) ||
                         (c.SellerId == buyerId && c.BuyerId == sellerId)));

                if (existingWithListing != null)
                {
                    return await GetChatroomByIdAsync(existingWithListing.Id);
                }
            }
            else
            {
                var existingWithoutListing = await _context.Chatrooms
                    .FirstOrDefaultAsync(c =>
                        ((c.SellerId == sellerId && c.BuyerId == buyerId) ||
                         (c.SellerId == buyerId && c.BuyerId == sellerId)));

                if (existingWithoutListing != null)
                {
                    return await GetChatroomByIdAsync(existingWithoutListing.Id);
                }
            }

            var createDto = new CreateChatroomDto
            {
                SellerId = sellerId,
                BuyerId = buyerId,
                ListingId = listingId
            };

            return await CreateChatroomAsync(createDto);
        }

        public async Task<ChatroomDto> CloseDealAsync(Guid chatroomId, Guid sellerId, int? stars = null, string? description = null)
        {
            var chatroom = await _context.Chatrooms
                .Include(c => c.Listing)
                .Include(c => c.Ratings)
                .FirstOrDefaultAsync(c => c.Id == chatroomId);

            if (chatroom == null)
            {
                throw new ArgumentException("Chatroom not found");
            }

            if (chatroom.SellerId != sellerId)
            {
                throw new UnauthorizedAccessException("Only the seller can close the deal");
            }

            if (!chatroom.IsDealClosed)
            {
                chatroom.IsDealClosed = true;
                chatroom.ClosedAt = DateTimeOffset.UtcNow;
            }

            await ApplySustainabilityForClosedDealAsync(chatroom);

            Guid? revieweeIdForRecalc = null;
            if (stars.HasValue)
            {
                if (stars.Value < 1 || stars.Value > 5)
                {
                    throw new ArgumentException("Stars must be between 1 and 5");
                }

                var alreadyRated = chatroom.Ratings.Any(r => r.ReviewerId == sellerId);
                if (!alreadyRated)
                {
                    Guid buyerId = chatroom.BuyerId;

                    _context.ChatRatings.Add(new ChatRating
                    {
                        Id = Guid.NewGuid(),
                        ChatroomId = chatroom.Id,
                        ReviewerId = sellerId,
                        RevieweeId = buyerId,
                        Stars = stars.Value,
                        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                        CreatedAt = DateTimeOffset.UtcNow
                    });

                    revieweeIdForRecalc = chatroom.BuyerId;
                }
            }

            await _context.SaveChangesAsync();

            if (revieweeIdForRecalc.HasValue)
            {
                await RecalculateProfileRatingAsync(revieweeIdForRecalc.Value);
            }

            return (await GetChatroomByIdAsync(chatroom.Id))!;
        }

        public async Task<ChatroomDto> RequestCloseDealAsync(Guid chatroomId, Guid userId)
        {
            var chatroom = await _context.Chatrooms
                .FirstOrDefaultAsync(c => c.Id == chatroomId);

            if (chatroom == null)
            {
                throw new ArgumentException("Chatroom not found");
            }

            if (chatroom.SellerId != userId && chatroom.BuyerId != userId)
            {
                throw new UnauthorizedAccessException("User does not belong to this chatroom");
            }

            if (chatroom.IsArchived || chatroom.IsFrozen)
            {
                throw new InvalidOperationException("Chatroom is read-only");
            }

            chatroom.CloseRequestedById = userId;
            chatroom.CloseRequestedAt = DateTimeOffset.UtcNow;
            chatroom.CloseConfirmedBySeller = chatroom.SellerId == userId;
            chatroom.CloseConfirmedByBuyer = chatroom.BuyerId == userId;
            chatroom.IsFrozen = false;
            chatroom.FrozenReason = null;

            await _context.SaveChangesAsync();
            return (await GetChatroomByIdAsync(chatroom.Id))!;
        }

        public async Task<ChatroomDto> RespondToCloseDealAsync(Guid chatroomId, Guid userId, bool accept)
        {
            var chatroom = await _context.Chatrooms
                .FirstOrDefaultAsync(c => c.Id == chatroomId);

            if (chatroom == null)
            {
                throw new ArgumentException("Chatroom not found");
            }

            if (chatroom.SellerId != userId && chatroom.BuyerId != userId)
            {
                throw new UnauthorizedAccessException("User does not belong to this chatroom");
            }

            if (chatroom.CloseRequestedById == null)
            {
                throw new InvalidOperationException("No close request pending");
            }

            if (!accept)
            {
                chatroom.CloseRequestedById = null;
                chatroom.CloseRequestedAt = null;
                chatroom.CloseConfirmedBySeller = false;
                chatroom.CloseConfirmedByBuyer = false;
                await _context.SaveChangesAsync();
                return (await GetChatroomByIdAsync(chatroom.Id))!;
            }

            if (chatroom.SellerId == userId)
            {
                chatroom.CloseConfirmedBySeller = true;
            }
            else
            {
                chatroom.CloseConfirmedByBuyer = true;
            }

            if (chatroom.CloseConfirmedBySeller && chatroom.CloseConfirmedByBuyer)
            {
                if (chatroom.ListingId.HasValue &&
                    string.IsNullOrWhiteSpace(chatroom.ListingImageSnapshotPath))
                {
                    var firstImage = await _context.ListingImages
                        .AsNoTracking()
                        .Where(li => li.ListingId == chatroom.ListingId.Value)
                        .OrderBy(li => li.DisplayOrder)
                        .FirstOrDefaultAsync();
                    chatroom.ListingImageSnapshotPath = firstImage?.ImagePath;
                }

                chatroom.IsDealClosed = true;
                chatroom.ClosedAt = DateTimeOffset.UtcNow;
                chatroom.IsArchived = true;
                chatroom.ArchivedAt = DateTimeOffset.UtcNow;
                chatroom.CloseRequestedById = null;
                chatroom.CloseRequestedAt = null;
                chatroom.IsFrozen = false;
                chatroom.FrozenReason = null;

                await ApplySustainabilityForClosedDealAsync(chatroom);
            }

            await _context.SaveChangesAsync();

            if (chatroom.IsDealClosed && chatroom.ListingId.HasValue)
            {
                var listingId = chatroom.ListingId.Value;
                var otherChats = await _context.Chatrooms
                    .Where(c => c.Id != chatroom.Id && c.ListingId == listingId)
                    .ToListAsync();

                foreach (var other in otherChats)
                {
                    other.IsFrozen = true;
                    other.FrozenReason = "The listing was sold to another buyer.";
                }

                await _context.SaveChangesAsync();

                var listing = await _context.Listings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == listingId);

                if (listing != null)
                {
                    await _listingCommandService.DeleteListingAsync(listingId, listing.ProfileId);
                }
            }

            return (await GetChatroomByIdAsync(chatroom.Id))!;
        }

        public async Task<List<ChatroomDto>> GetChatroomsByListingAsync(Guid listingId)
        {
            var chatrooms = await _context.Chatrooms
                .Where(c => c.ListingId == listingId)
                .Include(c => c.Listing)
                .Include(c => c.Messages)
                .Include(c => c.Ratings)
                .ToListAsync();

            var profileIds = chatrooms
                .SelectMany(c => new[] { c.SellerId, c.BuyerId })
                .Distinct()
                .ToList();

            var ratingStats = await GetRatingStatsAsync(profileIds);
            var listingImageMap = new Dictionary<Guid, string?>();

            var images = await _context.ListingImages
                .AsNoTracking()
                .Where(li => li.ListingId == listingId)
                .OrderBy(li => li.DisplayOrder)
                .ToListAsync();

            listingImageMap = images
                .GroupBy(li => li.ListingId)
                .ToDictionary(
                    g => g.Key,
                    g => _fileStorage.GetPublicFileUrl(g.FirstOrDefault()?.ImagePath)
                );

            return chatrooms.Select(c =>
            {
                var listingImageUrl = listingImageMap.TryGetValue(listingId, out var url) ? url : null;
                return MapChatroomDto(c, ratingStats, listingImageUrl);
            }).ToList();
        }

        public async Task<ChatroomDto> SubmitRatingAsync(Guid chatroomId, Guid reviewerId, int stars, string? description = null)
        {
            if (stars < 1 || stars > 5)
            {
                throw new ArgumentException("Stars must be between 1 and 5");
            }

            var chatroom = await _context.Chatrooms
                .Include(c => c.Ratings)
                .FirstOrDefaultAsync(c => c.Id == chatroomId);

            if (chatroom == null)
            {
                throw new ArgumentException("Chatroom not found");
            }

            if (chatroom.SellerId != reviewerId && chatroom.BuyerId != reviewerId)
            {
                throw new UnauthorizedAccessException("User does not belong to this chatroom");
            }

            if (!chatroom.IsDealClosed)
            {
                throw new InvalidOperationException("Deal must be closed before submitting ratings");
            }

            var alreadyRated = chatroom.Ratings.Any(r => r.ReviewerId == reviewerId);
            if (alreadyRated)
            {
                throw new InvalidOperationException("You already submitted a rating for this deal");
            }

            var revieweeId = chatroom.SellerId == reviewerId ? chatroom.BuyerId : chatroom.SellerId;

            _context.ChatRatings.Add(new ChatRating
            {
                Id = Guid.NewGuid(),
                ChatroomId = chatroom.Id,
                ReviewerId = reviewerId,
                RevieweeId = revieweeId,
                Stars = stars,
                Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _context.SaveChangesAsync();
            await RecalculateProfileRatingAsync(revieweeId);

            return (await GetChatroomByIdAsync(chatroom.Id))!;
        }

        public async Task<bool> UserBelongsToChatroomAsync(Guid userId, Guid chatroomId)
        {
            return await _context.Chatrooms
                .AnyAsync(c => c.Id == chatroomId && (c.SellerId == userId || c.BuyerId == userId));
        }

        public async Task DeleteChatroomAsync(Guid chatroomId)
        {
            DeleteChatroom(chatroomId);
            _context.SaveChanges();
        }

        public void DeleteAllFromUser(Guid userId)
        {
            var chatroomData = _context.Chatrooms.Where(
                c => c.SellerId == userId || c.BuyerId == userId
            ).ToList();

            bool fail = false;

            foreach (Chatroom chatroom in chatroomData)
            {
                DeleteChatroom(chatroom.Id);
                // It is impossible for this call to throw an 
                // exception. The chatrooms are necessarily in the 
                // database if this function queried them.

            }
            _context.SaveChanges();
        }

        private void DeleteChatroom(Guid chatroomId)
        {
            var chatroom = _context.Chatrooms.Find(chatroomId);

            if (chatroom != null)
            {
                var messageData = _context.Messages.Where(
                    m => m.ChatroomId == chatroomId
                );

                foreach (Message message in messageData)
                {
                    _context.Messages.Remove(message);
                }
                // Delete all messages before deleting the chatroom.

                _context.Chatrooms.Remove(chatroom);
            }
            else
            {
                throw new ArgumentException("Cannot find chatroom");
            }
        }

        private async Task<Dictionary<Guid, (double? Average, int Count)>> GetRatingStatsAsync(IEnumerable<Guid> profileIds)
        {
            var ids = profileIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<Guid, (double? Average, int Count)>();
            }

            var aggregates = await _context.ChatRatings
                .Where(r => ids.Contains(r.RevieweeId))
                .GroupBy(r => r.RevieweeId)
                .Select(g => new
                {
                    ProfileId = g.Key,
                    Count = g.Count(),
                    Average = g.Average(x => x.Stars)
                })
                .ToListAsync();

            var dict = new Dictionary<Guid, (double? Average, int Count)>();
            foreach (var row in aggregates)
            {
                dict[row.ProfileId] = (Math.Round(row.Average, 1), row.Count);
            }

            return dict;
        }

        private static ChatRatingDto MapRatingDto(ChatRating rating)
        {
            return new ChatRatingDto
            {
                Id = rating.Id,
                ChatroomId = rating.ChatroomId,
                ReviewerId = rating.ReviewerId,
                RevieweeId = rating.RevieweeId,
                Stars = rating.Stars,
                Description = rating.Description,
                CreatedAt = rating.CreatedAt
            };
        }

        private ChatroomDto MapChatroomDto(
            Chatroom chatroom,
            Dictionary<Guid, (double? Average, int Count)> ratingStats,
            string? listingImageUrl)
        {
            var sellerStats = ratingStats.TryGetValue(chatroom.SellerId, out var seller) ? seller : ((double?)null, 0);
            var buyerStats = ratingStats.TryGetValue(chatroom.BuyerId, out var buyer) ? buyer : ((double?)null, 0);
            var resolvedListingImageUrl = listingImageUrl;
            if (string.IsNullOrWhiteSpace(resolvedListingImageUrl) &&
                !string.IsNullOrWhiteSpace(chatroom.ListingImageSnapshotPath))
            {
                resolvedListingImageUrl = _fileStorage.GetPublicFileUrl(chatroom.ListingImageSnapshotPath);
            }

            return new ChatroomDto
            {
                Id = chatroom.Id,
                CreationTime = chatroom.CreationTime,
                SellerId = chatroom.SellerId,
                BuyerId = chatroom.BuyerId,
                ListingId = chatroom.ListingId,
                ListingTitle = chatroom.Listing?.Title,
                ListingImageUrl = resolvedListingImageUrl,
                IsDealClosed = chatroom.IsDealClosed,
                ClosedAt = chatroom.ClosedAt,
                IsArchived = chatroom.IsArchived,
                ArchivedAt = chatroom.ArchivedAt,
                IsFrozen = chatroom.IsFrozen,
                FrozenReason = chatroom.FrozenReason,
                CloseRequestedById = chatroom.CloseRequestedById,
                CloseRequestedAt = chatroom.CloseRequestedAt,
                CloseConfirmedBySeller = chatroom.CloseConfirmedBySeller,
                CloseConfirmedByBuyer = chatroom.CloseConfirmedByBuyer,
                SellerRatingAverage = sellerStats.Item1,
                SellerRatingCount = sellerStats.Item2,
                BuyerRatingAverage = buyerStats.Item1,
                BuyerRatingCount = buyerStats.Item2,
                Ratings = chatroom.Ratings
                    .OrderBy(r => r.CreatedAt)
                    .Select(MapRatingDto)
                    .ToList(),
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

        private async Task RecalculateProfileRatingAsync(Guid revieweeId)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == revieweeId);
            if (profile == null)
            {
                return;
            }

            var ratings = await _context.ChatRatings
                .Where(r => r.RevieweeId == revieweeId)
                .Select(r => r.Stars)
                .ToListAsync();

            profile.Rating = ratings.Count == 0 ? 0f : (float)ratings.Average();
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task ApplySustainabilityForClosedDealAsync(Chatroom chatroom)
        {
            if (!chatroom.IsDealClosed || chatroom.SustainabilityMetricsApplied || !chatroom.ListingId.HasValue)
            {
                return;
            }

            var listing = chatroom.Listing;
            if (listing == null)
            {
                listing = await _context.Listings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == chatroom.ListingId.Value);
            }

            if (listing == null)
            {
                return;
            }

            chatroom.SustainabilityMetricsApplied = true;
            _sustainabilityTrackerService.UpdateWith(chatroom.BuyerId, chatroom.SellerId, listing);
        }
    }
}
