"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { Send, Star, Plus, Archive } from "lucide-react";

type Message = {
  id: string;
  content: string;
  author: string;
  chatroomId: string;
  sendDate: string | null;
};

type ChatRating = {
  id: string;
  chatroomId: string;
  reviewerId: string;
  revieweeId: string;
  stars: number;
  description?: string | null;
  createdAt: string;
};

type Chatroom = {
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

function Avatar({ src, size = 10 }: { src?: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 object-cover`;
  return (
    <img
      src={src || "/images/default-avatar-icon.jpg"}
      alt=""
      className={cls}
    />
  );
}

function Sidebar({
  chatrooms,
  archivedChatrooms,
  otherNames,
  otherImages,
  listingImages,
  activeChatroomId,
  showArchived,
  onToggleArchived,
}: {
  chatrooms: Chatroom[];
  archivedChatrooms: Chatroom[];
  otherNames: Record<string, string>;
  otherImages: Record<string, string | null>;
  listingImages: Record<string, string | null>;
  activeChatroomId: string | null;
  showArchived: boolean;
  onToggleArchived: () => void;
}) {
  const router = useRouter();
  const { unread, latestMessages } = useChatContext();
  const visibleChatrooms = showArchived ? archivedChatrooms : chatrooms;

  return (
    <aside className="w-72 shrink-0 bg-[#ebebeb] border-r border-gray-300 flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-gray-300 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-800 text-base">
          {showArchived ? "Archived" : "Messages"}
        </h2>
        <button
          type="button"
          onClick={onToggleArchived}
          className={`p-2 rounded-md transition-colors ${
            showArchived
              ? "bg-gray-300 text-gray-900"
              : "text-gray-600 hover:bg-gray-200"
          }`}
          title={showArchived ? "Show messages" : "Show archived"}
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>
      {visibleChatrooms.length === 0 && (
        <p className="text-sm text-gray-400 px-5 py-4">
          {showArchived ? "No archived conversations." : "No conversations yet."}
        </p>
      )}
      {visibleChatrooms.map((room) => {
        const name = otherNames[room.id] ?? "…";
        const lastMsg =
          latestMessages[room.id] ??
          room.messages[room.messages.length - 1]?.content;
        const isActive = room.id === activeChatroomId;
        const hasUnread = !!unread[room.id];
        return (
          <button
            key={room.id}
            onClick={() => router.push(`/chat/${room.id}`)}
            className={`flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-200 transition-colors border-b border-gray-200 ${
              isActive ? "bg-gray-200" : ""
            }`}
          >
            <Avatar src={otherImages[room.id]} size={10} />
            <div className="overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}
                >
                  {name}
                </p>
              </div>
              {lastMsg && (
                <p
                  className={`text-xs truncate ${hasUnread ? "text-gray-700 font-medium" : "text-gray-500"}`}
                >
                  {lastMsg}
                </p>
              )}
            </div>
            <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
              {listingImages[room.id] ? (
                <img
                  src={listingImages[room.id] ?? undefined}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            {hasUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
            )}
          </button>
        );
      })}
    </aside>
  );
}

function formatAverage(avg?: number | null, count?: number) {
  if (!count || count <= 0 || avg == null) {
    return "No ratings";
  }
  return avg.toFixed(1);
}

function ChatPanel({
  room,
  otherName,
  otherImage,
  onRoomUpdate,
}: {
  room: Chatroom;
  otherName: string;
  otherImage?: string | null;
  onRoomUpdate: (room: Chatroom) => void;
}) {
  const searchParams = useSearchParams();
  const { userId, accessToken, isAuthenticated, authLoaded } = useAuth();
  const { markAsRead } = useChatContext();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [hoveredRatingStar, setHoveredRatingStar] = useState<number | null>(
    null,
  );

  const [ratingStars, setRatingStars] = useState<number | null>(null);
  const [ratingDescription, setRatingDescription] = useState("");
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSendRef = useRef<string>(searchParams.get("msg") ?? "");

  useEffect(() => {
    markAsRead(room.id);
  }, [room.id, messages, markAsRead]);

  useEffect(() => {
    if (authLoaded && !isAuthenticated) router.push("/auth/sign-in");
  }, [authLoaded, isAuthenticated, router]);

  useEffect(() => {
    if (!accessToken || !room.id) return;
    fetch(`/api/chat/chatrooms/${room.id}/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Message[]) =>
        setMessages(
          data
            .slice()
            .sort(
              (a, b) =>
                new Date(a.sendDate ?? 0).getTime() -
                new Date(b.sendDate ?? 0).getTime(),
            ),
        ),
      )
      .catch((e) => console.error("Failed to load messages", e));
  }, [accessToken, room.id]);

  useEffect(() => {
    if (!accessToken || !room.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/chathub", { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    connection.on("Error", (err: string) => setError(err));
    connection.on("CloseDealUpdated", (updated: Chatroom) => {
      onRoomUpdate(updated);
      if (updated.id === room.id && updated.isDealClosed) {
        setIsRatingModalOpen(true);
      }
    });

    connection
      .start()
      .then(async () => {
        setConnected(true);
        await connection.invoke("JoinChatroom", room.id);
        const pending = autoSendRef.current.trim();
        if (pending) {
          autoSendRef.current = "";
          await connection.invoke("SendMessage", room.id, pending);
        }
      })
      .catch((e: unknown) => {
        console.error("SignalR connection failed", e);
        setError("Failed to connect to chat.");
      });

    connectionRef.current = connection;

    return () => {
      connection.invoke("LeaveChatroom", room.id).catch(() => {});
      connection.stop();
    };
  }, [accessToken, room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !connectionRef.current || !connected) return;
    if (isArchived || isFrozen) return;
    try {
      await connectionRef.current.invoke("SendMessage", room.id, trimmed);
      setInput("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  }, [input, connected, room.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isSeller = userId === room.sellerId;
  const isBuyer = userId === room.buyerId;
  const roomRatings = room.ratings ?? [];
  const isDealClosed = !!room.isDealClosed;
  const isArchived = !!room.isArchived;
  const isFrozen = !!room.isFrozen;
  const hasRated = !!userId && roomRatings.some((r) => r.reviewerId === userId);
  const closeRequestPending = !!room.closeRequestedById;
  const needsCloseResponse =
    closeRequestPending &&
    !!userId &&
    ((isSeller && !room.closeConfirmedBySeller) ||
      (isBuyer && !room.closeConfirmedByBuyer));
  const canCloseDeal =
    !!userId && !isDealClosed && !isArchived && !isFrozen && !closeRequestPending;
  const canRate = !!userId && isDealClosed && !hasRated;

  useEffect(() => {
    if (needsCloseResponse) {
      setIsConfirmCloseOpen(true);
    }
  }, [needsCloseResponse]);

  useEffect(() => {
    if (isDealClosed && canRate) {
      setIsRatingModalOpen(true);
    }
  }, [isDealClosed, canRate]);

  const otherRoleText = isBuyer ? "Selling" : isSeller ? "Wants to buy" : null;
  const otherRating = isBuyer
    ? formatAverage(room.sellerRatingAverage, room.sellerRatingCount ?? 0)
    : isSeller
      ? formatAverage(room.buyerRatingAverage, room.buyerRatingCount ?? 0)
      : "No ratings";

  const submitCloseDeal = async () => {
    if (!accessToken) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/chat/chatrooms/${room.id}/close-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? body?.Error ?? `HTTP ${res.status}`);
      }

      onRoomUpdate(body as Chatroom);
      setIsConfirmCloseOpen(false);
      setIsActionMenuOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to request close");
    } finally {
      setActionBusy(false);
    }
  };

  const submitRating = async () => {
    if (!accessToken || !ratingStars) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/chat/chatrooms/${room.id}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          stars: ratingStars,
          description: ratingDescription.trim() || null,
        }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? body?.Error ?? `HTTP ${res.status}`);
      }

      onRoomUpdate(body as Chatroom);
      setRatingStars(null);
      setRatingDescription("");
      setIsRatingModalOpen(false);
      setHoveredRatingStar(null);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Failed to submit rating",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const respondToCloseDeal = async (accept: boolean) => {
    if (!accessToken) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/chat/chatrooms/${room.id}/close-respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accept }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? body?.Error ?? `HTTP ${res.status}`);
      }

      onRoomUpdate(body as Chatroom);
      setIsConfirmCloseOpen(false);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Failed to respond to close request",
      );
    } finally {
      setActionBusy(false);
    }
  };

  if (!authLoaded || !isAuthenticated) return null;

  return (
    <div className="relative flex flex-col flex-1 min-w-0 bg-[#f5f5f5]">
      <div className="flex items-center justify-between gap-3 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={otherImage} size={9} />
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 truncate flex items-center gap-2">
              <span className="truncate">{otherName}</span>
              <span className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#14b4a3] text-[#14b4a3]" />
                <span>{otherRating}</span>
              </span>
            </div>
            <div className="text-xs text-gray-500 truncate">
              {otherRoleText && room.listingId ? (
                <>
                  {otherRoleText}{" "}
                  <Link
                    href={`/listing/${room.listingId}`}
                    className="text-teal-600 hover:underline"
                  >
                    {room.listingTitle || "item"}
                  </Link>
                </>
              ) : (
                "Conversation"
              )}
            </div>
          </div>
        </div>
        {isDealClosed ? (
          <span className="text-xs text-[#14b4a3] font-medium shrink-0">
            Deal closed
          </span>
        ) : null}
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 text-sm px-4 py-2 border-b border-red-100">
          {error}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 text-red-500 text-sm px-4 py-2 border-b border-red-100">
          {actionError}
        </div>
      )}

      {isConfirmCloseOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 w-full px-6 z-10">
          <div className="mx-auto w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900">
              Close deal
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Do you want to close your deal with {otherName}?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmCloseOpen(false);
                  setIsActionMenuOpen(false);
                  if (needsCloseResponse) {
                    respondToCloseDeal(false);
                  }
                }}
                className="text-xs px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  needsCloseResponse ? respondToCloseDeal(true) : submitCloseDeal()
                }
                disabled={actionBusy}
                className="text-xs bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-black font-semibold px-3 py-2 rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {isRatingModalOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 w-full px-6 z-10">
          <div className="mx-auto w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900">
              Leave a rating
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Optionally rate your interaction with {otherName} from 1 (Poor) to
              5 (Exceptional) stars.
            </p>
            <div className="flex items-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled =
                  (hoveredRatingStar ?? ratingStars ?? 0) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRatingStar(star)}
                    onMouseLeave={() => setHoveredRatingStar(null)}
                    onClick={() => setRatingStars(star)}
                    className="p-1"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-6 h-6 ${isFilled ? "fill-[#14b4a3] text-[#14b4a3]" : "text-gray-300"}`}
                    />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setRatingStars(null);
                  setRatingDescription("");
                  setHoveredRatingStar(null);
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Skip
              </button>
            </div>
            <textarea
              value={ratingDescription}
              onChange={(e) => setRatingDescription(e.target.value)}
              placeholder={
                ratingStars
                  ? "Optional description"
                  : "Select a star rating to add a description"
              }
              rows={3}
              disabled={!ratingStars}
              className="mt-4 w-full bg-gray-50 text-gray-800 text-sm border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRatingModalOpen(false);
                  setRatingStars(null);
                  setRatingDescription("");
                  setHoveredRatingStar(null);
                }}
                className="text-xs px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                No rating
              </button>
              <button
                type="button"
                onClick={submitRating}
                disabled={actionBusy || !ratingStars}
                className="text-xs bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-black font-semibold px-3 py-2 rounded"
              >
                {actionBusy ? "Submitting..." : "Submit rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.author === userId;
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {!isOwn && <Avatar src={otherImage} size={8} />}
              <div
                className={`max-w-[60%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isOwn
                    ? "bg-teal-500 text-black rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.content}
                {msg.sendDate && (
                  <div
                    className={`text-[10px] mt-1 ${isOwn ? "text-black" : "text-gray-400"}`}
                  >
                    {new Date(msg.sendDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 bg-white border-t border-gray-200">
        {isFrozen && (
          <div className="text-xs text-gray-600 mb-2">
            {room.frozenReason ?? "The listing was sold to another buyer."}
          </div>
        )}
        {isArchived && (
          <div className="text-xs text-gray-600 mb-2">This chat is archived.</div>
        )}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsActionMenuOpen((v) => !v)}
              disabled={!canCloseDeal}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors"
              title="Actions"
            >
              <Plus className="w-4 h-4 text-gray-700" />
            </button>
            {isActionMenuOpen && canCloseDeal && (
              <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg w-40 overflow-hidden z-10">
                <button
                  onClick={() => {
                    setIsConfirmCloseOpen(true);
                    setIsActionMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  Close Deal
                </button>
              </div>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type Message Here"
            rows={1}
            disabled={isArchived || isFrozen}
            className="flex-1 bg-gray-50 text-gray-800 text-sm placeholder-gray-400 border border-gray-200 rounded-2xl px-4 py-2.5 resize-none focus:outline-none focus:border-teal-400 max-h-32 overflow-y-auto disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected || isArchived || isFrozen}
            className="p-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4 text-black translate-x-[-1px] translate-y-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
      <p className="text-gray-400 text-sm">
        Select a conversation to start chatting
      </p>
    </div>
  );
}

export default function ChatLayout({
  activeChatroomId,
}: {
  activeChatroomId: string | null;
}) {
  const { userId, accessToken, isAuthenticated, authLoaded } = useAuth();
  const router = useRouter();

  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [otherNames, setOtherNames] = useState<Record<string, string>>({});
  const [otherImages, setOtherImages] = useState<Record<string, string | null>>(
    {},
  );
  const [listingImageByListingId, setListingImageByListingId] = useState<
    Record<string, string | null>
  >({});
  const [showArchived, setShowArchived] = useState(false);

  const fetchChatrooms = useCallback(() => {
    if (!accessToken) return;
    fetch("/api/chat/chatrooms", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data: Chatroom[]) => setChatrooms(data))
      .catch((e) => console.error("Failed to load chatrooms", e));
  }, [accessToken]);

  useEffect(() => {
    if (authLoaded && !isAuthenticated) router.push("/auth/sign-in");
  }, [authLoaded, isAuthenticated, router]);

  useEffect(() => {
    fetchChatrooms();
  }, [fetchChatrooms]);

  useEffect(() => {
    if (!accessToken || !userId || chatrooms.length === 0) return;

    const unresolvedIds = new Set<string>();
    for (const room of chatrooms) {
      const otherId = room.sellerId === userId ? room.buyerId : room.sellerId;
      unresolvedIds.add(otherId);
    }

    unresolvedIds.forEach((otherId) => {
      fetch(`/api/profile/${otherId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          const first = profile?.firstName ?? "";
          const last = profile?.lastName ?? "";
          const name =
            first || last
              ? `${first} ${last}`.trim()
              : `User ${otherId.slice(0, 6)}`;
          const image: string | null = profile?.profileImagePath ?? null;
          setChatrooms((prev) => {
            const nameUpdates: Record<string, string> = {};
            const imageUpdates: Record<string, string | null> = {};
            prev.forEach((room) => {
              const rid =
                room.sellerId === userId ? room.buyerId : room.sellerId;
              if (rid === otherId) {
                nameUpdates[room.id] = name;
                imageUpdates[room.id] = image;
              }
            });
            setOtherNames((n) => ({ ...n, ...nameUpdates }));
            setOtherImages((n) => ({ ...n, ...imageUpdates }));
            return prev;
          });
        })
        .catch(() => {});
    });
  }, [accessToken, userId, chatrooms]);

  useEffect(() => {
    if (chatrooms.length === 0) return;

    const unresolvedListingIds = new Set<string>();
    for (const room of chatrooms) {
      if (!room.listingId) continue;
      if (listingImageByListingId[room.listingId] !== undefined) continue;
      unresolvedListingIds.add(room.listingId);
    }

    unresolvedListingIds.forEach((listingId) => {
      fetch(`/api/search/listing/${listingId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((listing) => {
          const firstImage = listing?.images?.[0]?.imageUrl ?? null;
          setListingImageByListingId((prev) => ({
            ...prev,
            [listingId]: firstImage,
          }));
        })
        .catch(() => {
          setListingImageByListingId((prev) => ({
            ...prev,
            [listingId]: null,
          }));
        });
    });
  }, [chatrooms, listingImageByListingId]);

  const handleRoomUpdate = useCallback((updatedRoom: Chatroom) => {
    setChatrooms((prev) =>
      prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)),
    );
  }, []);

  const activeChatrooms = chatrooms.filter((r) => !r.isArchived);
  const archivedChatrooms = chatrooms.filter((r) => r.isArchived);
  const activeRoom = activeChatroomId
    ? chatrooms.find((r) => r.id === activeChatroomId)
    : null;
  const listingImages = chatrooms.reduce<Record<string, string | null>>(
    (acc, room) => {
      const listingId = room.listingId ?? null;
      acc[room.id] =
        room.listingImageUrl ??
        (listingId ? listingImageByListingId[listingId] ?? null : null);
      return acc;
    },
    {},
  );
  const otherName = activeChatroomId
    ? (otherNames[activeChatroomId] ?? "…")
    : "";
  const otherImage = activeChatroomId
    ? (otherImages[activeChatroomId] ?? null)
    : null;

  useEffect(() => {
    if (activeRoom?.isArchived) {
      setShowArchived(true);
    }
  }, [activeRoom?.isArchived]);

  if (!authLoaded) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen pt-[60px]">
      <Sidebar
        chatrooms={activeChatrooms}
        archivedChatrooms={archivedChatrooms}
        otherNames={otherNames}
        otherImages={otherImages}
        listingImages={listingImages}
        activeChatroomId={activeChatroomId}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((prev) => !prev)}
      />
      {activeRoom ? (
        <ChatPanel
          room={activeRoom}
          otherName={otherName}
          otherImage={otherImage}
          onRoomUpdate={handleRoomUpdate}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
