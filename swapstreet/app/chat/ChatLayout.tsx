// Note: This page contains 4 components (Avatar, Sidebar, ChatPanel, ChatLayout) which could be split into separate components if needed later

"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { Send } from "lucide-react";

// ──────────────────────── Types ────────────────────────

type Message = {
  id: string;
  content: string;
  author: string;
  chatroomId: string;
  sendDate: string | null;
};

type Chatroom = {
  id: string;
  sellerId: string;
  buyerId: string;
  messages: Message[];
};

// ──────────────────────── Avatar ────────────────────────

function Avatar({ src, size = 10 }: { src?: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 object-cover`;
  return <img src={src || "/images/default-avatar-icon.jpg"} alt="" className={cls} />;
}

// ──────────────────────── Sidebar ────────────────────────

function Sidebar({
  chatrooms,
  otherNames,
  otherImages,
  activeChatroomId,
}: {
  chatrooms: Chatroom[];
  otherNames: Record<string, string>;
  otherImages: Record<string, string | null>;
  activeChatroomId: string | null;
}) {
  const router = useRouter();
  const { unread, latestMessages } = useChatContext();

  return (
    <aside className="w-72 shrink-0 bg-[#ebebeb] border-r border-gray-300 flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-gray-300">
        <h2 className="font-semibold text-gray-800 text-base">Messages</h2>
      </div>
      {chatrooms.length === 0 && (
        <p className="text-sm text-gray-400 px-5 py-4">No conversations yet.</p>
      )}
      {chatrooms.map((room) => {
        const name = otherNames[room.id] ?? "…";
        const lastMsg = latestMessages[room.id] ?? room.messages[room.messages.length - 1]?.content;
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
              <p className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>{name}</p>
              {lastMsg && (
                <p className={`text-xs truncate ${hasUnread ? "text-gray-700 font-medium" : "text-gray-500"}`}>{lastMsg}</p>
              )}
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

// ──────────────────────── Active Chat Panel ────────────────────────

function ChatPanel({
  chatroomId,
  otherName,
  otherImage,
}: {
  chatroomId: string;
  otherName: string;
  otherImage?: string | null;
}) {
  const searchParams = useSearchParams();
  const { userId, accessToken, isAuthenticated, authLoaded } = useAuth();
  const { markAsRead } = useChatContext();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSendRef = useRef<string>(searchParams.get("msg") ?? "");

  // Mark chatroom as read (on open & new msg)
  useEffect(() => {
    markAsRead(chatroomId);
  }, [chatroomId, messages, markAsRead]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoaded && !isAuthenticated) router.push("/auth/sign-in");
  }, [authLoaded, isAuthenticated, router]);

  // Load message history
  useEffect(() => {
    if (!accessToken || !chatroomId) return;
    fetch(`/api/chat/chatrooms/${chatroomId}/messages`, {
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
                new Date(b.sendDate ?? 0).getTime()
            )
        )
      )
      .catch((e) => console.error("Failed to load messages", e));
  }, [accessToken, chatroomId]);

  // SignalR connection
  useEffect(() => {
    if (!accessToken || !chatroomId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/chathub", { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    connection.on("Error", (err: string) => setError(err));

    connection
      .start()
      .then(async () => {
        setConnected(true);
        await connection.invoke("JoinChatroom", chatroomId);
        // Auto-send message
        const pending = autoSendRef.current.trim();
        if (pending) {
          autoSendRef.current = "";
          await connection.invoke("SendMessage", chatroomId, pending);
        }
      })
      .catch((e: unknown) => {
        console.error("SignalR connection failed", e);
        setError("Failed to connect to chat.");
      });

    connectionRef.current = connection;

    return () => {
      connection.invoke("LeaveChatroom", chatroomId).catch(() => {});
      connection.stop();
    };
  }, [accessToken, chatroomId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !connectionRef.current || !connected) return;
    try {
      await connectionRef.current.invoke("SendMessage", chatroomId, trimmed);
      setInput("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  }, [input, connected, chatroomId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!authLoaded || !isAuthenticated) return null;

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-[#f5f5f5]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
        <Avatar src={otherImage} size={9} />
        <span className="font-semibold text-gray-800">{otherName}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-500 text-sm px-4 py-2 border-b border-red-100">
          {error}
        </div>
      )}

      {/* Messages */}
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
                  <div className={`text-[10px] mt-1 ${isOwn ? "text-black" : "text-gray-400"}`}>
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

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type Message Here"
          rows={1}
          className="flex-1 bg-gray-50 text-gray-800 text-sm placeholder-gray-400 border border-gray-200 rounded-2xl px-4 py-2.5 resize-none focus:outline-none focus:border-teal-400 max-h-32 overflow-y-auto"
          style={{ minHeight: "44px" }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          className="p-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors"
          title="Send"
        >
          <Send className="w-4 h-4 text-black translate-x-[-1px] translate-y-[1px]" />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────── Empty State ────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#f5f5f5]">
      <p className="text-gray-400 text-sm">Select a conversation to start chatting</p>
    </div>
  );
}

// ──────────────────────── Root Layout ────────────────────────

export default function ChatLayout({
  activeChatroomId,
}: {
  activeChatroomId: string | null;
}) {
  const { userId, accessToken, isAuthenticated, authLoaded } = useAuth();
  const router = useRouter();

  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [otherNames, setOtherNames] = useState<Record<string, string>>({});
  const [otherImages, setOtherImages] = useState<Record<string, string | null>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoaded && !isAuthenticated) router.push("/auth/sign-in");
  }, [authLoaded, isAuthenticated, router]);

  // Fetch all chatrooms
  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/chat/chatrooms", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data: Chatroom[]) => setChatrooms(data))
      .catch((e) => console.error("Failed to load chatrooms", e));
  }, [accessToken]);

  // Resolve other user's name for each chatroom
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
            (first || last)
              ? `${first} ${last}`.trim()
              : `User ${otherId.slice(0, 6)}`;
          const image: string | null = profile?.profileImagePath ?? null;
          // Map name/image back to all rooms that have this otherId
          setChatrooms((prev) => {
            const nameUpdates: Record<string, string> = {};
            const imageUpdates: Record<string, string | null> = {};
            prev.forEach((room) => {
              const rid = room.sellerId === userId ? room.buyerId : room.sellerId;
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

  if (!authLoaded) return null;
  if (!isAuthenticated) return null;

  const activeRoom = activeChatroomId
    ? chatrooms.find((r) => r.id === activeChatroomId)
    : null;
  const otherName = activeChatroomId
    ? (otherNames[activeChatroomId] ?? "…")
    : "";
  const otherImage = activeChatroomId ? (otherImages[activeChatroomId] ?? null) : null;

  return (
    <div className="flex h-screen pt-[60px]">
      <Sidebar
        chatrooms={chatrooms}
        otherNames={otherNames}
        otherImages={otherImages}
        activeChatroomId={activeChatroomId}
      />
      {activeRoom && activeChatroomId ? (
        <ChatPanel chatroomId={activeChatroomId} otherName={otherName} otherImage={otherImage} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
