"use client";

import React, { useEffect, useState } from "react";
import { X, Bookmark } from "lucide-react";
import Gallery from "./Gallery";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  addWardrobeItem,
  hasWardrobeItem,
  removeWardrobeItem,
} from "../../wardrobe/wardrobeStorage";

type Seller = {
  id?: string;
  firstName?: string;
  lastName?: string;
  rating?: number;
  profileImageUrl?: string;
  FSA?: string;
  fsa?: string;
  createdAt?: string;
};

type Listing = {
  id?: string;
  title?: string;
  price?: number | string;
  createdAt?: string;
  category?: string;
  brand?: string;
  condition?: string;
  size?: string;
  colour?: string;
  images?: { imageUrl?: string }[];
  seller?: Seller | null;
  description?: string;
  location?: string;
  fsa?: string;
  FSA?: string;
};

interface ListingModalProps {
  listingId: string;
  onClose: () => void;
}

function formatListedAt(iso?: string) {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatJoinYear(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export function ListingModal({ listingId, onClose }: ListingModalProps) {
  const { userId, accessToken, authLoaded } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<{
    city: string;
    province: string;
  } | null>(null);

  const [inWardrobe, setInWardrobe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInWardrobe(hasWardrobeItem(listingId));
  }, [listingId]);

  useEffect(() => {
    fetch(`/api/search/listing/${listingId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setListing(data))
      .catch((e) => {
        console.error("Failed to fetch listing", e);
        setError(true);
      })
      .finally(() => setIsLoading(false));
  }, [listingId]);

  // Location from FSA
  useEffect(() => {
    if (!listing) return;
    const fsa =
      listing.FSA || listing.fsa || listing.seller?.FSA || listing.seller?.fsa;
    if (!fsa) return;

    fetch(`/api/location/lookup/${encodeURIComponent(fsa)}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.city) {
          setLocationData({
            city: data.city,
            province: data.provinceCode || data.province || "",
          });
        }
      })
      .catch((e) => console.error("Failed to fetch location", e));
  }, [listing]);

  const handleAddToWardrobe = async () => {
    if (isSaving || !listing) return;
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem("accessToken") || accessToken;
      if (!token) {
        router.push("/auth/sign-in");
        return;
      }
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const method = inWardrobe ? "DELETE" : "POST";

      const res = await fetch(`${apiUrl}/wishlist/${listingId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (inWardrobe) {
          removeWardrobeItem(listingId);
          setInWardrobe(false);
        } else {
          addWardrobeItem({
            id: listingId,
            title: listing.title || "Untitled",
            price: Number(listing.price || 0),
            imageUrl: listing.images?.[0]?.imageUrl ?? null,
          });
          setInWardrobe(true);
        }
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartChat = async () => {
    const sellerId = listing?.seller?.id;
    const messageToSend = message.trim() || "Hi, is this available?";
    if (!sellerId) {
      setChatError("Cannot message this seller right now.");
      return;
    }
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
        body: JSON.stringify({ sellerId, buyerId: userId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg: string =
          body?.error ?? body?.Error ?? `HTTP ${res.status}`;
        if (errMsg.toLowerCase().includes("buyer profile not found")) {
          setNoProfile(true);
          return;
        }
        throw new Error(errMsg);
      }

      const chatroom = await res.json();
      router.push(
        `/chat/${chatroom.id}?msg=${encodeURIComponent(messageToSend)}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start chat";
      console.error("Failed to start chat", e);
      setChatError(msg);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
        <div className="text-white bg-black/80 px-6 py-4 rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-teal-500 rounded-full animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm text-center">
          <p className="text-gray-800 font-medium mb-6">
            Failed to load listing
          </p>
          <button
            onClick={onClose}
            className="bg-teal-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-teal-600 transition-colors w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const images: { imageUrl?: string }[] = listing.images ?? [];
  const seller = listing.seller ?? null;
  const location =
    listing.location ??
    listing.fsa ??
    listing.FSA ??
    seller?.fsa ??
    seller?.FSA ??
    "Location unavailable";
  const listedAtText = formatListedAt(listing.createdAt);
  const joinedYear = formatJoinYear(seller?.createdAt);

  return (
    <div className="fixed inset-0 w-[100vw] h-[100dvh] bg-black z-[9999] overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-2 rounded-full transition-colors shadow-lg flex items-center justify-center w-10 h-10 border border-white/20"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Main content */}
      <div className="flex w-[100vw] h-[100dvh] min-w-[100vw] bg-white">
        {/* Left: Gallery */}
        <div className="flex-1 bg-transparent flex flex-col relative border-r border-gray-200 min-w-0 overflow-visible">
          <div className="flex-1 min-h-0 w-full overflow-visible mt-2">
            <Gallery images={images} />
          </div>
        </div>

        {/* Right: Details panel */}
        <div className="w-[380px] md:w-[460px] h-full bg-white text-gray-900 flex flex-col shrink-0 relative">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-5 flex flex-col space-y-3.5">
              {/* Title & Price */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {listing.title}
                </h1>
                <div className="text-[22px] font-bold mt-2 text-teal-600">
                  ${Number(listing.price ?? 0).toFixed(2)}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Listed </span>
                    <span className="font-medium text-gray-700">
                      {listedAtText}
                    </span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span className="font-medium text-gray-700">
                      {locationData
                        ? `${locationData.city}, ${locationData.province}`
                        : location}
                    </span>
                  </div>
                  <button
                    onClick={handleAddToWardrobe}
                    disabled={isSaving}
                    className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-3 py-1.5 rounded-md flex items-center justify-center gap-2 text-sm transition-colors border border-gray-200"
                  >
                    <Bookmark
                      className="w-4 h-4"
                      fill={inWardrobe ? "#14b8a6" : "none"}
                      stroke={inWardrobe ? "#14b8a6" : "currentColor"}
                    />
                    {inWardrobe ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
              <div className="h-px bg-gray-200 w-[94%] mx-auto" />

              {/* Description */}
              <div className="pt-1">
                <h2 className="text-[17px] font-bold mb-1 text-gray-900">
                  Description
                </h2>
                <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {listing.description || "No description provided."}
                </div>
              </div>
              <div className="h-px bg-gray-200 w-[94%] mx-auto" />

              {/* Item details */}
              <div className="pt-1">
                <h2 className="text-[17px] font-bold mb-1 text-gray-900">
                  Details
                </h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-800">
                      {listing.category ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-medium text-gray-800">
                      {listing.brand ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500">Condition</span>
                    <span className="font-medium text-gray-800">
                      {listing.condition ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500">Size</span>
                    <span className="font-medium text-gray-800">
                      {listing.size ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Color</span>
                    <span className="font-medium text-gray-800">
                      {listing.colour ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gray-200 w-[94%] mx-auto" />

              {/* Location */}
              <div className="pt-2 mt-1">
                <h2 className="text-[17px] font-bold mb-1 text-gray-900">
                  Location
                </h2>
                <div className="w-full h-[200px] bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 text-sm">
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p>Google Maps</p>
                    <p className="text-xs mt-1">
                      {locationData
                        ? `${locationData.city}, ${locationData.province}`
                        : location}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gray-200 w-[94%] mx-auto" />

              {/* Seller information */}
              <div className="pt-1 mt-1">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-[16px] font-bold text-gray-900">
                    Seller information
                  </h2>
                  {seller?.id && (
                    <a
                      href={`/profile/${seller.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Seller Details
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300 shadow-sm">
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
                    <div className="font-bold text-[16px] text-gray-900">
                      {seller
                        ? `${seller.firstName} ${seller.lastName}`
                        : "Unknown Seller"}
                    </div>
                    <div className="text-amber-500 text-sm mt-0.5">
                      {seller?.rating != null
                        ? `★ ${Number(seller.rating).toFixed(1)}`
                        : "No rating yet"}
                    </div>
                    <div className="text-gray-500 text-sm mt-0.5">
                      Joined SWAPSTREET {joinedYear ? `in ${joinedYear}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="border-t border-gray-200 bg-white p-5 flex-1 flex flex-col items-center justify-center shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.05)]">
              {noProfile && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-3">
                  <p className="mb-2 font-medium">
                    You need a profile before you can message sellers.
                  </p>
                  <button
                    onClick={() => router.push("/seller/onboarding")}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg w-full text-sm transition-colors shadow-sm"
                  >
                    Create profile
                  </button>
                </div>
              )}

              {chatError && (
                <div className="text-red-500 text-sm px-2 mb-2 font-medium bg-red-50 p-2 rounded">
                  {chatError}
                </div>
              )}

              <div className="space-y-2.5 w-full max-w-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <svg
                    viewBox="0 0 28 28"
                    fill="currentColor"
                    height="20"
                    width="20"
                    className="text-teal-500"
                  >
                    <path d="M14 2.042c-6.76 0-12.242 5.084-12.242 11.36 0 3.553 1.832 6.72 4.71 8.847v4.618a.75.75 0 0 0 1.154.63l4.316-2.82c.66.115 1.344.175 2.05.175 6.76 0 12.242-5.084 12.242-11.36S20.76 2.042 14 2.042z"></path>
                  </svg>
                  Send a message
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, is this available?"
                  rows={2}
                  className="w-full bg-gray-50 text-gray-900 text-sm placeholder-gray-400 border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors text-[15px] shadow-sm flex justify-center items-center gap-2"
                >
                  {chatLoading && (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {chatLoading ? "Opening chat..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
