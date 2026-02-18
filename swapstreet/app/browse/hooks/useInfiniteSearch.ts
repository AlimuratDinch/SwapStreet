"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export function useInfiniteSearch(
  initialItems: any[],
  initialCursor: string | null,
  initialHasNext: boolean,
) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);

  const isFirstRender = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchPage = useCallback(
    async (currentCursor: string | null) => {
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      setLoading(true);

      try {
        const q = new URLSearchParams();
        q.set("Query", searchParams.get("q") || "");
        q.set("MinPrice", searchParams.get("minPrice") || "");
        q.set("MaxPrice", searchParams.get("maxPrice") || "");
        q.set("PageSize", "18");
        if (currentCursor) q.set("Cursor", currentCursor);

        const res = await fetch(`/api/search/search?${q.toString()}`);
        const data = await res.json();

        setItems((prev) => [...prev, ...(data.items ?? [])]);
        setCursor(data.nextCursor);
        setHasNext(data.hasNextPage);
      } catch (err) {
        setHasNext(false);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [searchParams],
  );

  // RESET LOGIC
  useEffect(() => {
    // IMPORTANT: Skip reset on mount so we keep the server-side items
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setItems([]);
    setCursor(null);
    setHasNext(true);
    fetchPage(null);
  }, [searchParams, fetchPage]);

  return { items, loading, hasNext, fetchPage: () => fetchPage(cursor) };
}
