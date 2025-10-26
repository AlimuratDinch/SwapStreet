"use client";
import { use, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import DefaultAvatar from "../../images/default-avatar-icon.jpg";
import DefaultBanner from "../../images/default-seller-banner.png";

// Listing model (minimal fields for UI)
type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  images: string[];
  timestamp: string;
  status: string;
};

// Seller model
type Seller = {
  id: string;
  name: string;
  handle: string;
  location: string;
  avatarUrl: string | StaticImageData;
  bannerUrl: string | StaticImageData;
  stats: { totalSales: number; avgRating: number; reviews: number };
  about: string;
  memberSince: string;
  listings: Listing[];
};

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-gray-500">{icon}</div>
      <div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // Simulate auth-owned profile check. Set true to show owner perspective
  const isOwner = id === "me";

  // Initial defaults (fallback avatar/banner, zero stats, no listings)
  const [seller, setSeller] = useState<Seller>({
    id,
    name: "",
    handle: "",
    location: "",
    avatarUrl: DefaultAvatar,
    bannerUrl: DefaultBanner,
    stats: { totalSales: 0, avgRating: 0, reviews: 0 },
    about: "",
    memberSince: "",
    listings: [],
  });

  // On first load, if owner, provides onboarding data from localStorage
  useEffect(() => {
    if (!isOwner) return;
    try {
      const raw = localStorage.getItem("seller:me");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        name?: string;
        location?: string;
        bio?: string;
        avatarUrl?: string | null;
        bannerUrl?: string | null;
      };
      setSeller((prev) => ({
        ...prev,
        name: data.name?.trim() ? data.name : prev.name,
        location: data.location?.trim() ? data.location : prev.location,
        about: data.bio?.trim() ? data.bio : prev.about,
        avatarUrl: data.avatarUrl || prev.avatarUrl,
        bannerUrl: data.bannerUrl || prev.bannerUrl,
      }));
    } catch (e) {
      console.error("Failed to read onboarding data", e);
    }
  }, [isOwner]);

  // Load listings from localStorage
  useEffect(() => {
    try {
      const listingsData = localStorage.getItem("seller:listings");
      if (listingsData) {
        const listings = JSON.parse(listingsData) as Listing[];
        setSeller((prev) => ({
          ...prev,
          listings: listings,
        }));
      }
    } catch (e) {
      console.error("Failed to read listings data", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Banner */}
      <div className="relative h-40 w-full sm:h-56 border-b border-gray-200">
        {typeof seller.bannerUrl === "string" &&
        seller.bannerUrl.startsWith("blob:") ? (
          <img
            src={seller.bannerUrl}
            alt={`${seller.name || "Seller"} banner`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={seller.bannerUrl}
            alt={`${seller.name || "Seller"} banner`}
            fill
            priority
            className="object-cover"
          />
        )}
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        {/* Profile Header */}
        <div className="flex flex-col gap-4">
          <div className="mt-2 sm:mt-2 flex items-center gap-4">
            <div className="relative z-10 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-md sm:h-24 sm:w-24">
              {typeof seller.avatarUrl === "string" &&
              seller.avatarUrl.startsWith("blob:") ? (
                <img
                  src={seller.avatarUrl}
                  alt={seller.name || "Seller"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={seller.avatarUrl}
                  alt={seller.name || "Seller"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="relative z-10 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  {seller.name}
                </h1>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>{seller.handle}</span>
                <span className="inline-flex items-center gap-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 text-yellow-500"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {seller.stats.avgRating}{" "}
                  <span className="text-gray-400">|</span>{" "}
                  {seller.stats.reviews} reviews
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 text-gray-500"
                  >
                    <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  </svg>
                  {seller.location}
                </span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* disabled for now */}
              {/* <button
                type="button"
                title="Coming soon!"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 opacity-80 shadow-sm hover:bg-gray-50 cursor-not-allowed"
              >
                <span>Contact</span>
              </button> */}
              {/* <button
                type="button"
                title="Coming soon!"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 opacity-80 shadow-sm hover:bg-gray-50 cursor-not-allowed"
              >
                <span>Share</span>
              </button> */}
              {isOwner && (
                <button
                  type="button"
                  title="Coming soon!"
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[var(--primary-color)] px-3 py-2 text-sm font-medium text-white opacity-80 shadow-sm cursor-not-allowed"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Total Sales"
              value={new Intl.NumberFormat().format(seller.stats.totalSales)}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-gray-400"
                  fill="currentColor"
                >
                  <path d="M3 13h2v-2H3v2zm4 0h14v-2H7v2zm-4 6h2v-2H3v2zm4 0h14v-2H7v2zM3 7h2V5H3v2zm4 0h14V5H7v2z" />
                </svg>
              }
            />
            <StatCard
              label="Average Rating"
              value={seller.stats.avgRating.toFixed(1)}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-gray-400"
                  fill="currentColor"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              }
            />
            <StatCard
              label="Reviews"
              value={new Intl.NumberFormat().format(seller.stats.reviews)}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-gray-400"
                  fill="currentColor"
                >
                  <path d="M21 6h-2v9H7v2c0 .55.45 1 1 1h9l4 4V7c0-.55-.45-1-1-1zM17 12V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v12l4-4h10c.55 0 1-.45 1-1z" />
                </svg>
              }
            />
          </div>

          {/* About */}
          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">About</h2>
            <p className="text-gray-700">{seller.about}</p>
          </section>

          {/* Listings */}
          <section className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Listings</h2>
              {isOwner && (
                <Link
                  href="/seller/listing"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Create new listing
                </Link>
              )}
            </div>
            {seller.listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <div className="rounded-full bg-gray-100 p-4 text-gray-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    fill="currentColor"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">No listings yet</p>
                  <p className="mx-auto mt-1 max-w-xl text-sm text-gray-600">
                    {isOwner
                      ? "You haven't added any products to your store yet. Create your first listing to get started!"
                      : "This seller hasn't added any products to their store yet. Check back soon to discover their curated collection of items."}
                  </p>
                </div>
                {isOwner && (
                  <Link
                    href="/seller/listing"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                  >
                    Create your first listing
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {seller.listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                  >
                    {listing.images.length > 0 && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate">
                        {listing.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                          ${listing.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {listing.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
