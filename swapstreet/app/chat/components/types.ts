export type Message = {
  id: string;
  content: string;
  author: string;
  chatroomId: string;
  sendDate: string | null;
  readAt: string | null;
};

export type ChatRating = {
  id: string;
  chatroomId: string;
  reviewerId: string;
  revieweeId: string;
  stars: number;
  description?: string | null;
  createdAt: string;
};

export type Chatroom = {
  id: string;
  sellerId: string;
  buyerId: string;
  listingId?: string | null;
  listingTitle?: string | null;
  listingImageUrl?: string | null;
  isDealClosed?: boolean;
  closedAt?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  isFrozen?: boolean;
  frozenReason?: string | null;
  closeRequestedById?: string | null;
  closeRequestedAt?: string | null;
  closeConfirmedBySeller?: boolean;
  closeConfirmedByBuyer?: boolean;
  sellerRatingAverage?: number | null;
  sellerRatingCount?: number;
  buyerRatingAverage?: number | null;
  buyerRatingCount?: number;
  ratings?: ChatRating[];
  messages: Message[];
};
