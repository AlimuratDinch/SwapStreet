
export const dynamic = 'force-dynamic';
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
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
      setItems((prev) => [...prev, ...newItems]);
      const nextCursor = data.nextCursor ?? null;

      // Stop if no new items or cursor hasn't advanced
      if (
        nextCursor === prevCursor ||
        (pageItems.length > 0 && newItems.length === 0)
      ) {
        setHasNext(false);
      } else {
        setHasNext(Boolean(data.hasNextPage));
      }
      setCursor(nextCursor);
    } catch (err) {
      console.error("Failed to load page", err);
      setHasNext(false); // Stop infinite retries on error
    } finally {
      setLoading(false);
    }
  }, [cursor, hasNext, loading]);

  useEffect(() => {
    // initial load only if no initial items
    if (items.length === 0) fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) fetchPage();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage]);

  return (
    <main className="pt-24 flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 auto-rows-max">
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

      <div ref={sentinelRef} className="col-span-full h-6" />
      {loading && <div className="col-span-full text-center">Loading...</div>}
    </main>
  );
}
