"use client";

export const dynamic = "force-dynamic";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { CardItem } from "./BrowseElements";
import { useSearchParams } from "next/navigation";

type Item = {
  id: string;
  title: string;
  price: number;
  images?: { imageUrl: string }[];
};

export default function InfiniteBrowse({
  initialItems = [],
  initialCursor = null,
  initialHasNext = true,
}: {
  initialItems?: Item[];
  initialCursor?: string | null;
  initialHasNext?: boolean;
}) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasNext, setHasNext] = useState<boolean>(initialHasNext);
  const seenIdsRef = useRef<Set<string>>(
    new Set(initialItems.map((i) => String(i.id))),
  );
  const [loading, setLoading] = useState(false);
  const retryRef = useRef(0);
  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // Build query params from URL
  const buildQueryParams = useCallback(
    (cursorValue: string | null = null) => {
      const q = new URLSearchParams();
      q.set("PageSize", "18");

      // Add search query - TRIM IT!
      const query = searchParams.get("Query");
      if (query && query.trim()) q.set("Query", query.trim());

      // Add filters
      const minPrice = searchParams.get("minPrice");
      if (minPrice) q.set("minPrice", minPrice);

      const maxPrice = searchParams.get("maxPrice");
      if (maxPrice) q.set("maxPrice", maxPrice);

      const categoryId = searchParams.get("categoryId");
      if (categoryId) q.set("categoryId", categoryId);

      const conditions = searchParams.get("conditions");
      if (conditions) q.set("conditions", conditions);

      const size = searchParams.get("size");
      if (size) q.set("size", size);

      // Add cursor if provided
      if (cursorValue) q.set("Cursor", cursorValue);

      return q;
    },
    [searchParams],
  );

  const fetchPage = useCallback(async () => {
    if (loading || !hasNext || fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

      const q = buildQueryParams(cursor);
      const res = await fetch(`${API_URL}/search/search?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pageItems: Item[] = Array.isArray(data) ? data : (data.items ?? []);

      // Deduplicate items by id
      const newItems = pageItems.filter((pi) => {
        const idStr = String(pi.id);
        if (seenIdsRef.current.has(idStr)) return false;
        seenIdsRef.current.add(idStr);
        return true;
      });

      if (mountedRef.current) setItems((prev) => [...prev, ...newItems]);
      const nextCursor = data.nextCursor ?? null;

      // Stop if no new items or cursor hasn't advanced
      if (mountedRef.current) {
        if (
          nextCursor === cursor ||
          (pageItems.length > 0 && newItems.length === 0)
        ) {
          setHasNext(false);
        } else {
          setHasNext(Boolean(data.hasNextPage));
        }
        setCursor(nextCursor);
      }
    } catch (err) {
      console.error("Failed to load page", err);
      retryRef.current = (retryRef.current ?? 0) + 1;
      const tries = retryRef.current;
      if (tries <= 3) {
        const backoff = 1000 * tries;
        const t = setTimeout(() => {
          if (!mountedRef.current) return;
          if (mountedRef.current) {
            setLoading(false);
            fetchInProgressRef.current = false;
          }
          fetchPage();
        }, backoff);
        if (!mountedRef.current) clearTimeout(t);
      } else {
        if (mountedRef.current) {
          setHasNext(false);
          setLoading(false);
          fetchInProgressRef.current = false;
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [cursor, hasNext, loading, buildQueryParams]);

  // Reset when search params change
  useEffect(() => {
    // Reset everything when URL params change
    setItems([]);
    setCursor(null);
    setHasNext(true);
    seenIdsRef.current.clear();
    retryRef.current = 0;
    setLoading(false);
    fetchInProgressRef.current = false;

    // Trigger new search
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Re-run when URL params change

  const lastFetchRef = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleScroll = useCallback(() => {
    if (!hasNext || loading) return;
    if (Date.now() - lastFetchRef.current < 500) return;
    const el = containerRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      lastFetchRef.current = Date.now();
      fetchPage();
    }
  }, [hasNext, loading, fetchPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <main
      ref={containerRef}
      className="pt-24 flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 auto-rows-max"
    >
      {items.map((item) => (
        <CardItem
          key={item.id}
          title={item.title}
          imgSrc={item.images?.[0]?.imageUrl}
          price={item.price ?? 0}
          href={`/listing/${item.id}`}
        />
      ))}

      {items.length === 0 && !loading && (
        <p className="col-span-full text-center text-gray-500">
          No items available.
        </p>
      )}

      {loading && <div className="col-span-full text-center">Loading...</div>}
    </main>
  );
}
