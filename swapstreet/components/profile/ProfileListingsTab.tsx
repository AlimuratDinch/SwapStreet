"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CardItem } from "@/app/browse/components/CardItem";
import {
  getSearchResults,
  type BrowseSearchResultItem,
} from "@/lib/api/browse";

export type ProfileListingItem = BrowseSearchResultItem;

interface ProfileListingsTabProps {
  sellerId: string;
  isCurrentUserProfile?: boolean;
}

/** One row per listing id; if duplicates differ by image, keep the row that has a primary image. */
function dedupeListingItems(items: ProfileListingItem[]): ProfileListingItem[] {
  const byId = new Map<string, ProfileListingItem>();
  const order: string[] = [];

  for (const item of items) {
    if (!item.id) continue;
    const prev = byId.get(item.id);
    if (!prev) {
      byId.set(item.id, item);
      order.push(item.id);
      continue;
    }
    const prevImg = prev.images?.[0]?.imageUrl;
    const nextImg = item.images?.[0]?.imageUrl;
    if (nextImg && !prevImg) byId.set(item.id, item);
  }

  return order.map((id) => byId.get(id)!);
}

export function ProfileListingsTab({
  sellerId,
  isCurrentUserProfile = false,
}: ProfileListingsTabProps) {
  const router = useRouter();
  const [items, setItems] = useState<ProfileListingItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreInFlight = useRef(false);

  const handleSelectListing = useCallback((id: string) => {
    window.open(`/listing?id=${id}`, "_blank");
  }, []);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function loadFirst() {
      setIsLoadingInitial(true);
      setItems([]);
      setCursor(null);
      setHasNext(false);
      loadMoreInFlight.current = false;

      try {
        const response = await getSearchResults({ sellerId, pageSize: 18 });
        if (!mounted || ac.signal.aborted) return;
        setItems(dedupeListingItems(response.items));
        setCursor(response.nextCursor);
        setHasNext(Boolean(response.hasNextPage));
      } finally {
        if (mounted && !ac.signal.aborted) setIsLoadingInitial(false);
      }
    }

    loadFirst();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [sellerId]);

  const loadMore = useCallback(async () => {
    if (
      loadMoreInFlight.current ||
      !hasNext ||
      cursor == null ||
      isLoadingInitial
    )
      return;

    loadMoreInFlight.current = true;
    setIsLoadingMore(true);
    try {
      const response = await getSearchResults({
        sellerId,
        cursor,
        pageSize: 18,
      });
      setItems((prev) => dedupeListingItems([...prev, ...response.items]));
      setCursor(response.nextCursor);
      setHasNext(Boolean(response.hasNextPage));
    } catch {
      // keep existing items
    } finally {
      loadMoreInFlight.current = false;
      setIsLoadingMore(false);
    }
  }, [cursor, hasNext, isLoadingInitial, sellerId]);

  useEffect(() => {
    if (!hasNext || isLoadingInitial) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadMoreInFlight.current &&
          !isLoadingMore
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    const el = observerTarget.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [loadMore, hasNext, isLoadingMore, isLoadingInitial]);

  const heading = isCurrentUserProfile ? "My Listings" : "Listings";
  const emptyStateMessage = isCurrentUserProfile
    ? "You have no active listings yet."
    : "This seller has no active listings.";

  return (
    <div className="rounded-xl bg-white shadow-sm p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{heading}</h2>
        {isCurrentUserProfile && items.length > 0 && (
          <button
            type="button"
            onClick={() => router.push("/seller/manageListings")}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Edit/Delete
          </button>
        )}
      </div>

      {isLoadingInitial ? (
        <div className="flex justify-center py-16 text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span>Loading listings...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{emptyStateMessage}</p>
          {isCurrentUserProfile && (
            <p className="mt-2">
              <button
                type="button"
                onClick={() => router.push("/seller/createListing")}
                className="inline text-teal-500 hover:text-teal-600 hover:underline cursor-pointer font-medium"
              >
                Create a listing
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-max">
            {items.map((item) => (
              <CardItem
                key={item.id}
                id={String(item.id)}
                title={item.title}
                imgSrc={item.images?.[0]?.imageUrl}
                price={item.price ?? 0}
                fsa={item.fsa}
                onSelectListing={handleSelectListing}
              />
            ))}
          </div>

          <div
            ref={observerTarget}
            className="w-full py-8 flex justify-center items-center min-h-[4rem]"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
            {!hasNext && items.length > 0 && (
              <p className="text-gray-400 text-sm italic">
                You&apos;ve reached the end of the list.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
