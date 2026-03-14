"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as signalR from "@microsoft/signalr";
import { Send, Star, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import styles from "../ChatLayout.module.css";
import Avatar from "./Avatar";
import type { Chatroom, Message } from "./types";

type ChatPanelProps = {
  room: Chatroom;
  otherName: string;
  otherImage?: string | null;
  onRoomUpdate: (room: Chatroom) => void;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function formatAverage(avg?: number | null, count?: number) {
  if (!count || count <= 0 || avg == null) {
    return "No ratings";
  }
  return avg.toFixed(1);
}

export default function ChatPanel({
  room,
  otherName,
  otherImage,
  onRoomUpdate,
}: ChatPanelProps) {
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
  }, [accessToken, room.id, onRoomUpdate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  }, [input, connected, room.id, isArchived, isFrozen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <Avatar src={otherImage} size={9} />
          <div className={styles.chatHeaderMeta}>
            <div className={styles.chatHeaderNameRow}>
              <span className={styles.chatHeaderName}>{otherName}</span>
              <span className={styles.chatHeaderRating}>
                <Star className={styles.starFilledSmall} />
                <span>{otherRating}</span>
              </span>
            </div>
            <div className={styles.chatHeaderSub}
            >
              {otherRoleText && room.listingId ? (
                <>
                  {otherRoleText}{" "}
                  <Link
                    href={`/listing/${room.listingId}`}
                    className={styles.chatHeaderLink}
                  >
                    {room.listingTitle || "item"}
                  </Link>
                </>
              ) : (
                "Archived conversation"
              )}
            </div>
          </div>
        </div>
        {isDealClosed ? (
          <span className={styles.dealClosedBadge}>Deal closed</span>
        ) : null}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {actionError && <div className={styles.errorBanner}>{actionError}</div>}

      {isConfirmCloseOpen && (
        <div className={styles.promptWrapper}>
          <div className={styles.promptCard}>
            <h3 className={styles.promptTitle}>Close deal</h3>
            <p className={styles.promptText}>
              Do you want to close your deal with {otherName}?
            </p>
            <div className={styles.promptActions}>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmCloseOpen(false);
                  setIsActionMenuOpen(false);
                  if (needsCloseResponse) {
                    respondToCloseDeal(false);
                  }
                }}
                className={styles.btnSecondary}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  needsCloseResponse
                    ? respondToCloseDeal(true)
                    : submitCloseDeal()
                }
                disabled={actionBusy}
                className={styles.btnPrimary}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {isRatingModalOpen && (
        <div className={cx(styles.promptWrapper, styles.promptWrapperRating)}>
          <div className={styles.promptCard}>
            <h3 className={styles.promptTitle}>Leave a rating</h3>
            <p className={styles.promptSubtext}>
              Optionally rate your interaction with {otherName} from 1 (Poor) to
              5 (Exceptional) stars.
            </p>
            <div className={styles.ratingStarsRow}>
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
                    className={styles.ratingStarButton}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={
                        isFilled ? styles.starFilled : styles.starEmpty
                      }
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
                className={styles.ratingSkip}
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
              className={styles.ratingTextarea}
            />
            <div className={styles.promptActions}>
              <button
                type="button"
                onClick={() => {
                  setIsRatingModalOpen(false);
                  setRatingStars(null);
                  setRatingDescription("");
                  setHoveredRatingStar(null);
                }}
                className={styles.btnSecondary}
              >
                No rating
              </button>
              <button
                type="button"
                onClick={submitRating}
                disabled={actionBusy || !ratingStars}
                className={styles.btnPrimary}
              >
                {actionBusy ? "Submitting..." : "Submit rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.messagesList}>
        {messages.map((msg) => {
          const isOwn = msg.author === userId;
          return (
            <div
              key={msg.id}
              className={cx(
                styles.messageRow,
                isOwn ? styles.messageRowOwn : styles.messageRowOther,
              )}
            >
              {!isOwn && <Avatar src={otherImage} size={8} />}
              <div
                className={cx(
                  styles.messageBubble,
                  isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                )}
              >
                {msg.content}
                {msg.sendDate && (
                  <div
                    className={cx(
                      styles.messageTimestamp,
                      isOwn
                        ? styles.messageTimestampOwn
                        : styles.messageTimestampOther,
                    )}
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

      <div className={styles.composer}>
        {isFrozen && (
          <div className={styles.composerNotice}>
            {room.frozenReason ?? "The listing was sold to another buyer."}
          </div>
        )}
        {isArchived && (
          <div className={styles.composerNotice}>This chat is archived.</div>
        )}
        <div className={styles.composerRow}>
          <div className={styles.actionMenuWrapper}>
            <button
              onClick={() => setIsActionMenuOpen((v) => !v)}
              disabled={!canCloseDeal}
              className={styles.actionButton}
              title="Actions"
            >
              <Plus className={styles.actionIcon} />
            </button>
            {isActionMenuOpen && canCloseDeal && (
              <div className={styles.actionMenu}>
                <button
                  onClick={() => {
                    setIsConfirmCloseOpen(true);
                    setIsActionMenuOpen(false);
                  }}
                  className={styles.actionMenuButton}
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
            className={styles.messageInput}
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected || isArchived || isFrozen}
            className={styles.sendButton}
            title="Send"
          >
            <Send className={styles.sendIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
