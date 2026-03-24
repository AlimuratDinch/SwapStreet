"use client";

import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import styles from "../ChatLayout.module.css";
import Avatar from "./Avatar";
import type { Chatroom } from "./types";

type SidebarProps = {
  chatrooms: Chatroom[];
  archivedChatrooms: Chatroom[];
  otherNames: Record<string, string>;
  otherImages: Record<string, string | null>;
  listingImages: Record<string, string | null>;
  activeChatroomId: string | null;
  showArchived: boolean;
  onToggleArchived: () => void;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function Sidebar({
  chatrooms,
  archivedChatrooms,
  otherNames,
  otherImages,
  listingImages,
  activeChatroomId,
  showArchived,
  onToggleArchived,
}: SidebarProps) {
  const router = useRouter();
  const { unread, latestMessages } = useChatContext();
  const visibleChatrooms = showArchived ? archivedChatrooms : chatrooms;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>
          {showArchived ? "Archived" : "Messages"}
        </h2>
        <button
          type="button"
          onClick={onToggleArchived}
          className={cx(
            styles.archiveToggle,
            showArchived && styles.archiveToggleActive,
          )}
          title={showArchived ? "Show messages" : "Show archived"}
        >
          <Archive className={styles.archiveIcon} />
        </button>
      </div>
      {visibleChatrooms.length === 0 && (
        <p className={styles.sidebarEmpty}>
          {showArchived
            ? "No archived conversations."
            : "No conversations yet."}
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
            className={cx(
              styles.chatroomButton,
              isActive && styles.chatroomButtonActive,
            )}
          >
            <Avatar src={otherImages[room.id]} size={10} />
            <div className={styles.chatroomContent}>
              <div className={styles.chatroomNameRow}>
                <p
                  className={cx(
                    styles.chatroomName,
                    hasUnread && styles.chatroomNameUnread,
                  )}
                >
                  {name}
                </p>
              </div>
              {lastMsg && (
                <p
                  className={cx(
                    styles.chatroomLastMessage,
                    hasUnread && styles.chatroomLastMessageUnread,
                  )}
                >
                  {lastMsg}
                </p>
              )}
            </div>
            <div className={styles.listingThumb}>
              {listingImages[room.id] ? (
                <img
                  src={listingImages[room.id] ?? undefined}
                  alt=""
                  className={styles.listingThumbImage}
                />
              ) : null}
            </div>
            {hasUnread && <span className={styles.unreadDot} />}
          </button>
        );
      })}
    </aside>
  );
}
