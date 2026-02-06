"use client";

export const dynamic = "force-dynamic";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { CardItem } from "./BrowseElements";

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
  const [items, setItems] = useState<Item[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasNext, setHasNext] = useState<boolean>(initialHasNext);
  const seenIdsRef = useRef<Set<string>>(
    new Set(initialItems.map((i) => String(i.id))),
  );
  const [loading, setLoading] = useState(false);
  const retryRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchPage = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const q = new URLSearchParams();
      q.set("limit", "18");
      const prevCursor = cursor;
      if (cursor) q.set("cursor", cursor);
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
          nextCursor === prevCursor ||
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
          if (mountedRef.current) setLoading(false);
          fetchPage();
        }, backoff);
        // clear timeout on unmount
        if (!mountedRef.current) clearTimeout(t);
      } else {
        if (mountedRef.current) {
          setHasNext(false);
          setLoading(false);
        }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cursor, hasNext, loading]);

  useEffect(() => {
    // initial load only if no initial items
    if (items.length === 0) fetchPage();
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
