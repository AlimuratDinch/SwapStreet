import React from "react";
import Link from "next/link";
import Gallery from "./Gallery";
import PostedAt from "./PostedAt";
import { Header } from "../../browse/BrowseElements";

export const dynamic = "force-dynamic";

async function fetchListing(id: string) {
  const api = "http://backend:8080";
  const res = await fetch(`${api}/api/search/listing/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  type Seller = {
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

  let listing: Listing | null = null;
  try {
    listing = await fetchListing(id);
  } catch (e) {
    console.error("Failed to fetch listing", e);
    return (
      <div className="p-6">
        <Header />
        <div className="flex items-center justify-center h-96">
          Failed to load listing.
        </div>
      </div>
    );
  }

  const images: { imageUrl?: string }[] = listing?.images ?? [];
  const seller = listing?.seller ?? null;

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
                {listing?.title}
              </h1>
              <div className="text-2xl text-teal-400 font-bold mt-2">
                ${Number(listing?.price ?? 0).toFixed(2)}
              </div>
            </div>

            {/* When listed */}
            <div className="text-gray-400">
              <div className="text-xs">Posted</div>
              <PostedAt iso={listing?.createdAt} />
            </div>

            {/* Location / Where */}
            <div>
              <div className="text-gray-400 text-xs">Location</div>
              <div className="text-gray-200">
                {listing?.location ??
                  listing?.fsa ??
                  listing?.FSA ??
                  seller?.fsa ??
                  seller?.FSA ??
                  "Unknown"}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-gray-400 text-xs mb-2">Description</div>
              <div className="text-gray-200 whitespace-pre-wrap">
                {listing?.description}
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

              <div className="flex gap-2">
                <button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded">
                  Send message
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
