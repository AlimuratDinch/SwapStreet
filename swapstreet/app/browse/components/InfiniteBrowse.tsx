"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CardItem } from "./CardItem";
import {
  getSearchResults,
  getLocationLabelByFsa,
  SearchParams,
  type BrowseSearchResultItem,
} from "@/lib/api/browse";

export type Item = BrowseSearchResultItem;

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
  const [locationLabels, setLocationLabels] = useState<Record<string, string>>(
    {},
  );

  const router = useRouter();

  // 2. Refs for the observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleSelectListing = useCallback((id: string) => {
    window.open(`/listing?id=${id}`, "_blank");
  }, []);

  // 3. Reset state when server-side search params change (Filters)
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasNext(initialHasNext);
  }, [initialItems, initialCursor, initialHasNext]);

  useEffect(() => {
    let isCancelled = false;

    const uniqueFsas = Array.from(
      new Set(items.map((item) => item.fsa).filter((fsa) => Boolean(fsa))),
    );

    const missingFsas = uniqueFsas.filter((fsa) => !locationLabels[fsa]);
    if (missingFsas.length === 0) return;

    const resolveLocations = async () => {
      const entries = await Promise.all(
        missingFsas.map(
          async (fsa) => [fsa, await getLocationLabelByFsa(fsa)] as const,
        ),
      );

      if (isCancelled) return;

      setLocationLabels((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    };

    void resolveLocations();

    return () => {
      isCancelled = true;
    };
  }, [items, locationLabels]);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-max">
        {items.map((item, index) => (
          <CardItem
            key={`${item.id}-${index}`} // Composite key to prevent collisions
            id={String(item.id)}
            title={item.title}
            imgSrc={item.images?.[0]?.imageUrl}
            price={item.price ?? 0}
            fsa={item.fsa}
            locationLabel={locationLabels[item.fsa] ?? item.fsa}
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
    </main>
  );
}
