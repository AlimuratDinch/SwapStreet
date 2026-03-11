"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/contexts/AuthContext";

// ──────────────────────── Types ────────────────────────

export type ChatNotification = {
  chatroomId: string;
  senderName: string;
  senderImage: string | null;
  content: string;
  sendDate: string | null;
};

type Chatroom = {
  id: string;
  sellerId: string;
  buyerId: string;
};

type Message = {
  id: string;
  content: string;
  author: string;
  chatroomId: string;
  sendDate: string | null;
};

// ──────────────────────── Context ────────────────────────

type ChatContextValue = {
  /** 1 unread notification per chatroomId */
  unread: Record<string, ChatNotification>;
  /** Total unread chatrooms count */
  totalUnread: number;
  /** Mark chatroom as read */
  markAsRead: (chatroomId: string) => void;
  /** Most recent message content per chatroomId */
  latestMessages: Record<string, string>;
};

const ChatContext = createContext<ChatContextValue>({
  unread: {},
  totalUnread: 0,
  markAsRead: () => {},
  latestMessages: {},
});

export function useChatContext() {
  return useContext(ChatContext);
}

// ──────────────────────── Provider ────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { userId, accessToken, isAuthenticated, authLoaded } = useAuth();

  const [unread, setUnread] = useState<Record<string, ChatNotification>>({});
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>(
    {},
  );
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  // Store chatroom owner to resolve sender
  const chatroomsRef = useRef<Chatroom[]>([]);
  // Cache resolved names/images (avoid re-fetching)
  const profileCacheRef = useRef<
    Record<string, { name: string; image: string | null }>
  >({});

  const markAsRead = useCallback((chatroomId: string) => {
    setUnread((prev) => {
      if (!prev[chatroomId]) return prev;
      const next = { ...prev };
      delete next[chatroomId];
      return next;
    });
  }, []);

  const totalUnread = Object.keys(unread).length;

  const resolveProfile = useCallback(
    async (
      otherId: string,
    ): Promise<{ name: string; image: string | null }> => {
      if (profileCacheRef.current[otherId])
        return profileCacheRef.current[otherId];
      try {
        const res = await fetch(`/api/profile/${otherId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const p = await res.json();
          const first = p?.firstName ?? "";
          const last = p?.lastName ?? "";
          const name =
            first || last
              ? `${first} ${last}`.trim()
              : `User ${otherId.slice(0, 6)}`;
          const image: string | null = p?.profileImagePath ?? null;
          profileCacheRef.current[otherId] = { name, image };
          return { name, image };
        }
      } catch {}
      const fallback = { name: `User ${otherId.slice(0, 6)}`, image: null };
      profileCacheRef.current[otherId] = fallback;
      return fallback;
    },
    [accessToken],
  );

  useEffect(() => {
    if (!authLoaded || !isAuthenticated || !accessToken || !userId) return;

    let cancelled = false;

    const connect = async () => {
      // Fetch all chatrooms
      let chatrooms: Chatroom[] = [];
      try {
        const res = await fetch("/api/chat/chatrooms", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) chatrooms = await res.json();
      } catch {
        return;
      }
      if (cancelled) return;
      chatroomsRef.current = chatrooms;

      // Build SignalR connection
      const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chathub", { accessTokenFactory: () => accessToken })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", async (msg: Message) => {
        // Ignore own messages (update sidebar preview only, no notification)
        if (msg.author === userId) {
          setLatestMessages((prev) => ({
            ...prev,
            [msg.chatroomId]: msg.content,
          }));
          return;
        }

        // Find which chatroom this belongs to
        const room = chatroomsRef.current.find((r) => r.id === msg.chatroomId);
        if (!room) return;

        const otherId = room.sellerId === userId ? room.buyerId : room.sellerId;
        const { name, image } = await resolveProfile(otherId);

        setUnread((prev) => ({
          ...prev,
          [msg.chatroomId]: {
            chatroomId: msg.chatroomId,
            senderName: name,
            senderImage: image,
            content: msg.content,
            sendDate: msg.sendDate,
          },
        }));
        setLatestMessages((prev) => ({
          ...prev,
          [msg.chatroomId]: msg.content,
        }));
      });

      try {
        await connection.start();
        if (cancelled) {
          connection.stop();
          return;
        }
        // Join all chatrooms
        for (const room of chatrooms) {
          await connection.invoke("JoinChatroom", room.id).catch(() => {});
        }
      } catch (e) {
        console.error("ChatContext: SignalR connection failed", e);
      }

      connectionRef.current = connection;
    };

    connect();

    return () => {
      cancelled = true;
      if (connectionRef.current) {
        chatroomsRef.current.forEach((r) =>
          connectionRef.current!.invoke("LeaveChatroom", r.id).catch(() => {}),
        );
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [authLoaded, isAuthenticated, accessToken, userId, resolveProfile]);

  return (
    <ChatContext.Provider
      value={{ unread, totalUnread, markAsRead, latestMessages }}
    >
      {children}
    </ChatContext.Provider>
  );
}
