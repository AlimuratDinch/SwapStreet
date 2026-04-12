"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as signalR from "@microsoft/signalr";
import { Send, Star, Plus, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import styles from "../ChatLayout.module.css";
import Avatar from "./Avatar";
import type { Chatroom, ListingSustainabilityImpact, Message } from "./types";

type ChatPanelProps = {
  room: Chatroom;
  otherName: string;
  otherImage?: string | null;
  onRoomUpdate: (room: Chatroom) => void;
};

type MessagesReadEvent = {
  chatroomId: string;
  readerId: string;
  readAt: string;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof globalThis.window !== "undefined") {
    return globalThis.window.location.origin;
  }

  return "http://localhost:3000";
}

function sortMessagesByDate(data: Message[]): Message[] {
  return data
    .slice()
    .sort(
      (a, b) =>
        new Date(a.sendDate ?? 0).getTime() -
        new Date(b.sendDate ?? 0).getTime(),
    );
}

function getOtherRoleText(isBuyer: boolean, isSeller: boolean): string | null {
  if (isBuyer) return "Selling";
  if (isSeller) return "Wants to buy";
  return null;
}

function getOtherRating(
  isBuyer: boolean,
  isSeller: boolean,
  room: Chatroom,
): string {
  if (isBuyer) {
    return formatAverage(room.sellerRatingAverage, room.sellerRatingCount ?? 0);
  }

  if (isSeller) {
    return formatAverage(room.buyerRatingAverage, room.buyerRatingCount ?? 0);
  }

  return "No ratings";
}

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
}: Readonly<ChatPanelProps>) {
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
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [isFinalizeBusy, setIsFinalizeBusy] = useState(false);
  const [impactMetrics, setImpactMetrics] =
    useState<ListingSustainabilityImpact | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [hoveredRatingStar, setHoveredRatingStar] = useState<number | null>(
    null,
  );

  const [ratingStars, setRatingStars] = useState<number | null>(null);
  const [ratingDescription, setRatingDescription] = useState("");
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [ratingPromptDismissed, setRatingPromptDismissed] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSendRef = useRef<string>(searchParams.get("msg") ?? "");
  const ratingPromptDismissedRef = useRef(false);

  const updateRatingPromptDismissed = useCallback((dismissed: boolean) => {
    ratingPromptDismissedRef.current = dismissed;
    setRatingPromptDismissed(dismissed);
  }, []);

  useEffect(() => {
    const pending = searchParams.get("msg");
    if (!pending) return;
    if (typeof globalThis.window === "undefined") return;

    const url = new URL(globalThis.window.location.href);
    if (!url.searchParams.has("msg")) return;

    url.searchParams.delete("msg");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    globalThis.window.history.replaceState(
      globalThis.window.history.state,
      "",
      nextUrl,
    );
  }, [searchParams]);

  useEffect(() => {
    markAsRead(room.id);
  }, [room.id, messages, markAsRead]);

  useEffect(() => {
    if (!authLoaded) return;
    if (isAuthenticated) return;
    router.push("/auth/sign-in");
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
      .then((data: Message[]) => setMessages(sortMessagesByDate(data)))
      .catch((e) => console.error("Failed to load messages", e));
  }, [accessToken, room.id]);

  useEffect(() => {
    if (!accessToken || !room.id) return;

    const baseUrl = resolveBaseUrl();

    const hubUrl = new URL("/chathub", baseUrl).toString();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => accessToken ?? "" })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // If the incoming message is from the other user, mark it as read immediately
      if (msg.author !== userId) {
        connection.invoke("MarkAsRead", room.id).catch(() => {});
      }
    });
    connection.on("Error", (err: string) => setError(err));
    connection.on("CloseDealUpdated", (updated: Chatroom) => {
      onRoomUpdate(updated);
      const updatedRatings = updated.ratings ?? [];
      const updatedHasRated =
        !!userId && updatedRatings.some((r) => r.reviewerId === userId);

      if (
        updated.id === room.id &&
        updated.isDealClosed &&
        !updated.isArchived &&
        !updatedHasRated &&
        !ratingPromptDismissedRef.current
      ) {
        setIsRatingModalOpen(true);
      }
    });
    connection.on("MessagesRead", (event: MessagesReadEvent) => {
      if (event.chatroomId !== room.id) return;
      if (event.readerId === userId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.author === userId && m.readAt == null
            ? { ...m, readAt: event.readAt }
            : m,
        ),
      );
    });

    connection
      .start()
      .then(async () => {
        setConnected(true);
        await connection.invoke("JoinChatroom", room.id);
        await connection.invoke("MarkAsRead", room.id);
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
  }, [accessToken, room.id, onRoomUpdate, userId]);

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
    !!userId &&
    !isDealClosed &&
    !isArchived &&
    !isFrozen &&
    !closeRequestPending;
  const canRate = !!userId && isDealClosed && !isArchived && !hasRated;
  const shouldPromptForRating = canRate && !ratingPromptDismissed;

  const handleConfirmClose = () => {
    if (needsCloseResponse) {
      void respondToCloseDeal(true);
      return;
    }

    void submitCloseDeal();
  };

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

  const openImpactModal = useCallback(() => {
    setImpactMetrics(room.listingSustainabilityImpact ?? null);
    setIsImpactModalOpen(true);
  }, [room.listingSustainabilityImpact]);

  useEffect(() => {
    if (needsCloseResponse) {
      setIsConfirmCloseOpen(true);
    }
  }, [needsCloseResponse]);

  useEffect(() => {
    updateRatingPromptDismissed(false);
  }, [room.id, updateRatingPromptDismissed]);

  useEffect(() => {
    if (shouldPromptForRating) {
      setIsRatingModalOpen(true);
    }
  }, [shouldPromptForRating]);

  const otherRoleText = getOtherRoleText(isBuyer, isSeller);
  const otherRating = getOtherRating(isBuyer, isSeller, room);

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
      setActionError(
        e instanceof Error ? e.message : "Failed to request close",
      );
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

      const updatedRoom = body as Chatroom;
      onRoomUpdate(updatedRoom);
      setRatingStars(null);
      setRatingDescription("");
      setIsRatingModalOpen(false);
      setHoveredRatingStar(null);
      updateRatingPromptDismissed(true);
      setImpactMetrics(
        updatedRoom.listingSustainabilityImpact ??
          room.listingSustainabilityImpact ??
          null,
      );
      setIsImpactModalOpen(true);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Failed to submit rating",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const finalizeClose = async () => {
    if (!accessToken) return;

    setIsFinalizeBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/chat/chatrooms/${room.id}/finalize-close`, {
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
      setIsImpactModalOpen(false);
      setImpactMetrics(null);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Failed to finalize close",
      );
    } finally {
      setIsFinalizeBusy(false);
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

  const impactToDisplay =
    impactMetrics ?? room.listingSustainabilityImpact ?? null;

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
            <div className={styles.chatHeaderSub}>
              {otherRoleText && room.listingId ? (
                <>
                  {otherRoleText}{" "}
                  <Link
                    href={`/listing?id=${room.listingId}`}
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
        <div className={styles.chatHeaderRight}>
          {isDealClosed ? (
            <span className={styles.dealClosedBadge}>Deal closed</span>
          ) : null}
          <Link
            href={`/profile/${isSeller ? room.buyerId : room.sellerId}`}
            className={styles.viewProfileBtn}
          >
            View Profile
          </Link>
        </div>
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
                onClick={handleConfirmClose}
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
                  updateRatingPromptDismissed(true);
                  void openImpactModal();
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

      {isImpactModalOpen && (
        <div className={cx(styles.promptWrapper, styles.promptWrapperRating)}>
          <div className={styles.promptCard}>
            <h3 className={styles.promptTitle}>Sustainability impact</h3>
            <p className={styles.promptSubtext}>
              Impact generated by this transaction.
            </p>
            {impactToDisplay ? (
              <div className={styles.impactMetricsList}>
                <div className={styles.impactMetricRow}>
                  <span>CO2 avoided</span>
                  <strong>{impactToDisplay.CO2Kg.toFixed(2)} kg</strong>
                </div>
                <div className={styles.impactMetricRow}>
                  <span>Water saved</span>
                  <strong>{impactToDisplay.waterL.toFixed(2)} L</strong>
                </div>
                <div className={styles.impactMetricRow}>
                  <span>Electricity saved</span>
                  <strong>
                    {impactToDisplay.electricityKWh.toFixed(2)} kWh
                  </strong>
                </div>
                <div className={styles.impactMetricRow}>
                  <span>Toxic chemicals avoided</span>
                  <strong>{impactToDisplay.toxicChemicals.toFixed(2)} g</strong>
                </div>
                <div className={styles.impactMetricRow}>
                  <span>Landfill diverted</span>
                  <strong>
                    {(impactToDisplay.landfillKg * 1000).toFixed(2)} g
                  </strong>
                </div>
                <div className={styles.impactMetricRow}>
                  <span>Articles reused</span>
                  <strong>{impactToDisplay.articles}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.promptText}>
                No impact data is available for this transaction.
              </p>
            )}
            <div className={styles.promptActions}>
              <button
                type="button"
                onClick={() => {
                  void finalizeClose();
                }}
                disabled={isFinalizeBusy}
                className={styles.btnPrimary}
              >
                {isFinalizeBusy ? "Archiving..." : "Archive Chatroom"}
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
                <div
                  className={cx(
                    styles.messageFooter,
                    isOwn ? styles.messageFooterOwn : styles.messageFooterOther,
                  )}
                >
                  {msg.sendDate && (
                    <span className={styles.messageTimestamp}>
                      {new Date(msg.sendDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {isOwn && (
                    <span
                      className={cx(
                        styles.messageStatus,
                        msg.readAt
                          ? styles.messageStatusRead
                          : styles.messageStatusDelivered,
                      )}
                      title={msg.readAt ? "Read" : "Delivered"}
                    >
                      {msg.readAt ? (
                        <CheckCheck className={styles.statusIcon} />
                      ) : (
                        <Check className={styles.statusIcon} />
                      )}
                    </span>
                  )}
                </div>
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
