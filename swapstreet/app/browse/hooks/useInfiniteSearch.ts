"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
// Import the centralized fetcher
import { getSearchResults, SearchParams } from "@/lib/api/browse";

export function useInfiniteSearch<T>(
  initialItems: T[],
  initialCursor: string | null,
  initialHasNext: boolean,
) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<T[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);

  const isFirstRender = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchPage = useCallback(
    async (currentCursor: string | null, isReset: boolean = false) => {
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      setLoading(true);

      try {
        // Construct params object for getSearchResults
        const params: SearchParams = {
          q: searchParams.get("q") || undefined,
          cursor: currentCursor || undefined,
          lat: searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined,
          lng: searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined,
          radiusKm: searchParams.get("radiusKm") ? parseFloat(searchParams.get("radiusKm")!) : undefined,
        };

        // Use the centralized fetcher from browse.ts (it will call locationFilter when lat/lng present)
        const data = await getSearchResults(params);

        setItems((prev) => (isReset ? data.items : [...prev, ...data.items]));
        setCursor(data.nextCursor);
        setHasNext(data.hasNextPage);
      } catch (err) {
        console.error("Infinite Search Error:", err);
        setHasNext(false);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [searchParams], // Hook now relies on the searchParams and browse.ts logic
  );

  // RESET LOGIC: When the user types a new search query
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // When search params change, reset the list and fetch from the start
    fetchPage(null, true);
  }, [searchParams, fetchPage]);

  return {
    items,
    loading,
    hasNext,
    fetchPage: () => fetchPage(cursor),
  };
}
