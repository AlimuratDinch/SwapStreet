"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Gallery from "./Gallery";
import PostedAt from "./PostedAt";
import { Header } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";

type Seller = {
  id?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  FSA?: string;
  fsa?: string;
};

type Listing = {
  title?: string;
  price?: number | string;
  createdAt?: string;
  images?: { imageUrl?: string }[];
  seller?: Seller | null;
  description?: string;
  location?: string;
  fsa?: string;
  FSA?: string;
};

export default function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { userId, accessToken, authLoaded } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);

  const handleStartChat = async () => {
    if (!seller?.id) return;
    if (!authLoaded) return;
    if (!userId || !accessToken) {
      router.push("/auth/sign-in");
      return;
    }
    setChatLoading(true);
    setChatError(null);
    setNoProfile(false);
    try {
      const res = await fetch("/api/chat/chatrooms/get-or-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sellerId: seller.id, buyerId: userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg: string = body?.error ?? body?.Error ?? `HTTP ${res.status}`;
        if (errMsg.toLowerCase().includes("buyer profile not found")) {
          setNoProfile(true);
          return;
        }
        throw new Error(errMsg);
      }
      const chatroom = await res.json();
      router.push(`/chat/${chatroom.id}${message ? `?msg=${encodeURIComponent(message)}` : ""}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start chat";
      console.error("Failed to start chat", e);
      setChatError(msg);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetch(`/api/search/listing/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setListing(data))
      .catch((e) => {
        console.error("Failed to fetch listing", e);
        setError(true);
      });
  }, [id]);

  if (error) {
    return (
      <div className="p-6">
        <Header />
        <div className="flex items-center justify-center h-96">
          Failed to load listing.
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6">
        <Header />
        <div className="flex items-center justify-center h-96 text-white">
          Loading...
        </div>
      </div>
    );
  }

  const images: { imageUrl?: string }[] = listing.images ?? [];
  const seller = listing.seller ?? null;

  return (
    <div className="h-screen overflow-hidden bg-[#111] text-white">
      {/* Full screen focus layout (WILL CHANGE LATER) */}
      <div className="relative">
        <Link
          href="/browse"
          className="absolute left-4 top-4 z-50 bg-white/10 text-white px-3 py-2 rounded"
        >
          ✕
        </Link>
      </div>

      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Left: big media area (images only FOR NOW) */}
          <div className="lg:col-span-2 bg-black rounded overflow-hidden p-4 flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <Gallery images={images} />
            </div>
          </div>

          {/* Right: details panel */}
          <aside className="bg-[#0f1720] rounded p-6 text-sm space-y-6 h-full sticky top-0 overflow-auto">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {listing.title}
              </h1>
              <div className="text-2xl text-teal-400 font-bold mt-2">
                ${Number(listing.price ?? 0).toFixed(2)}
              </div>
            </div>

            {/* When listed */}
            <div className="text-gray-400">
              <div className="text-xs">Posted</div>
              <PostedAt iso={listing.createdAt} />
            </div>

            {/* Location / Where */}
            <div>
              <div className="text-gray-400 text-xs">Location</div>
              <div className="text-gray-200">
                {listing.location ??
                  listing.fsa ??
                  listing.FSA ??
                  seller?.fsa ??
                  seller?.FSA ??
                  "Unknown"}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-gray-400 text-xs mb-2">Description</div>
              <div className="text-gray-200 whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>

            {/* Seller information and actions */}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden">
                  {seller?.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seller.profileImageUrl}
                      alt={`${seller.firstName} ${seller.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="font-medium text-lg text-white">
                    {seller
                      ? `${seller.firstName} ${seller.lastName}`
                      : "Seller"}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {seller?.FSA ?? ""}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {noProfile && (
                  <div className="bg-yellow-900/40 border border-yellow-700 rounded p-3 text-xs text-yellow-300">
                    <p className="mb-2 font-medium">You need a profile before you can message sellers.</p>
                    <button
                      onClick={() => router.push("/seller/onboarding")}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded w-full"
                    >
                      Create your profile
                    </button>
                  </div>
                )}
                {chatError && (
                  <div className="text-red-400 text-xs px-1">{chatError}</div>
                )}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message..."
                  rows={3}
                  className="w-full bg-[#1a2535] text-white text-sm placeholder-gray-500 border border-gray-700 rounded px-3 py-2 resize-none focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold py-2 rounded"
                >
                  {chatLoading ? "Opening chat..." : "Send message"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
