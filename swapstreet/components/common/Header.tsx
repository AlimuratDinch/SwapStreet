"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, Leaf, Bookmark, MessageSquare, Bell, User, ChevronDown, Settings, MessageCircle, LogOut } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 shadow-sm px-6 py-2 flex items-center justify-between z-[100] bg-[#eae9ea]">
      <Logo />
      <ActionButtons />
    </header>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/browse" className="font-bold text-2xl">
        <span className="text-teal-500">SWAP</span><span className="text-gray-900">STREET</span>
      </Link>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2 items-center">
      <IconButton href="/community" icon={<Globe />} title="Community" />
      <IconButton href="/sustainability" icon={<Leaf />} title="Sustainability" />
      <IconButton href="/wardrobe" icon={<Bookmark />} title="Wardrobe" />
      <IconButton href="/chat" icon={<MessageSquare />} title="Messages" />
      <NotificationButton />
      <ProfileButton />
    </div>
  );
}

function NotificationButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { unread, totalUnread, markAsRead } = useChatContext();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = Object.values(unread);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
        title="Notifications"
      >
        <Bell />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-700">Notifications</p>
            {totalUnread > 0 && (
              <button
                onClick={() => Object.keys(unread).forEach(markAsRead)}
                className="text-xs text-teal-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              You have no notifications.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.map((n, i) => (
                <button
                  key={i}
                  onClick={() => {
                    markAsRead(n.chatroomId);
                    setOpen(false);
                    router.push(`/chat/${n.chatroomId}`);
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <img
                    src={n.senderImage || "/images/default-avatar-icon.jpg"}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0 object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{n.senderName}</span> has sent you a message!
                    </p>
                  </div>
                  <span className="ml-auto mt-1 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
        title="Profile"
      >
        <User className="w-6 h-6" />
        <span className="absolute -bottom-0.5 -right-0.5 bg-gray-500 rounded-full w-4 h-4 grid place-items-center">
          <ChevronDown className="w-3 h-3 text-white" />
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {[
            { label: "View profile", href: "/profile", icon: <User className="w-4 h-4" /> },
            { label: "Settings & Preferences", href: "/settings", icon: <Settings className="w-4 h-4" /> },
          ].map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {icon}
              {label}
            </Link>
          ))}
          <a
            href="https://forms.gle/qvST4GZ3oyCphi8cA"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Give feedback
          </a>
          <div className="border-t border-gray-100">
            {/*
              TODO: Implement full logout:
              1. Call POST /api/auth/logout (requires Bearer token in Authorization header)
                 - Without this step, the browser still has the refresh token cookie and can
                   obtain a new access token, so the user is never actually logged out
              2. On success, call AuthContext.logout() [@Sawanoza when backend is done]
            */}
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link href={href}>
      <button
        className="p-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
        title={title}
      >
        {icon}
      </button>
    </Link>
  );
}
