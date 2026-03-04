"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { Shirt, Globe, Leaf, Bookmark, MessageSquare, Bell, User, ChevronDown, Settings, MessageCircle, LogOut } from "lucide-react";

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
      <Shirt className="h-8 w-8 text-teal-500" />
      <Link href="/browse" className="font-bold text-2xl">
        SWAPSTREET
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
        className="p-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
        title="Notifications"
      >
        <Bell />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-700">Notifications</p>
          </div>
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            You have no notifications.
          </div>
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
          <ChevronDown className="w-3 h-3 text-white -translate-x-[0.3px]" />
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
