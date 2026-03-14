"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import EmptyState from "./components/EmptyState";
import type { Chatroom } from "./components/types";
import styles from "./ChatLayout.module.css";

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
    <div className={styles.layout}>
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
