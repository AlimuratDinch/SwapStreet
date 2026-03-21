"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CardItem } from "./CardItem";
import { ListingModal } from "./ListingModal";
import { getSearchResults, SearchParams } from "@/lib/api/browse";

export interface Item {
  id: string;
  title: string;
  price: number;
  fsa: string;
  images?: { imageUrl: string }[];
}

interface InfiniteBrowseProps {
  initialItems: Item[];
  initialCursor: string | null;
  initialHasNext: boolean;
  params: SearchParams; // Pass params from the server component
}

export default function InfiniteBrowse({
  initialItems,
  initialCursor,
  initialHasNext,
  params,
}: InfiniteBrowseProps) {
  // 1. State Management
  const [items, setItems] = useState<Item[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 2. Refs for the observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listingId = searchParams.get("listing");
    setSelectedListingId(listingId);
  }, [searchParams]);

  const handleSelectListing = useCallback(
    (id: string) => {
      setSelectedListingId(id);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("listing", id);
      router.push(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedListingId(null);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("listing");
    const newUrl =
      newParams.toString() === "" ? "?" : `?${newParams.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [searchParams, router]);

  // 3. Reset state when server-side search params change (Filters)
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasNext(initialHasNext);
  }, [initialItems, initialCursor, initialHasNext]);

  // 4. Fetch Logic
  const loadMore = useCallback(async () => {
    if (isLoading || !hasNext || !cursor) return;

    setIsLoading(true);
    try {
      // Ensure your getSearchResults can be called from the client
      const response = await getSearchResults({
        ...params,
        cursor: cursor,
      });

      setItems((prev) => [...prev, ...response.items]);
      setCursor(response.nextCursor);
      setHasNext(response.hasNextPage);
    } catch (error) {
      console.error("Failed to fetch more items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasNext, isLoading, params]);

  // 5. Intersection Observer Setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }, // Trigger when 10% of the loader is visible
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasNext, isLoading]);

  return (
    <main className="flex-1 h-full overflow-y-auto p-6">
      {/* The Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 auto-rows-max">
        {items.map((item, index) => (
          <CardItem
            key={`${item.id}-${index}`} // Composite key to prevent collisions
            id={String(item.id)}
            title={item.title}
            imgSrc={item.images?.[0]?.imageUrl}
            price={item.price ?? 0}
            fsa={item.fsa}
            onSelectListing={handleSelectListing}
          />
        ))}
      </div>

      {/* 6. The Sentinel / Status Message */}
      <div
        ref={observerTarget}
        className="w-full py-10 flex justify-center items-center"
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span>Loading more...</span>
          </div>
        )}

        {!hasNext && items.length > 0 && (
          <p className="text-gray-400 text-sm italic">
            You've reached the end of the list.
          </p>
        )}

        {items.length === 0 && !isLoading && (
          <p className="text-gray-500">
            No items found matching your criteria.
          </p>
        )}
      </div>

      {/* Listing Modal */}
      {selectedListingId && (
        <ListingModal listingId={selectedListingId} onClose={handleCloseModal} />
      )}
    </main>
  );
}
