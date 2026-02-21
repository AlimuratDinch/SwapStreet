"use client";
import React, { useRef } from "react";
import { CardItem } from "./CardItem";
import { useInfiniteSearch } from "../hooks/useInfiniteSearch";
import { useScrollListener } from "../hooks/useScrollListener";

interface Item {
  id: string;
  title: string;
  price: number;
  images?: { imageUrl: string }[];
}

export default function InfiniteBrowse({
  initialItems = [],
  initialCursor = null,
  initialHasNext = true,
}: {
  initialItems?: Item[];
  initialCursor?: string | null;
  initialHasNext?: boolean;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const { items, loading, hasNext, fetchPage } = useInfiniteSearch(
    initialItems,
    initialCursor,
    initialHasNext,
  );

  useScrollListener(containerRef, fetchPage, hasNext && !loading);

  return (
    <main
      ref={containerRef}
      className="pt-24 flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 auto-rows-max"
    >
      {items.map((item) => (
        <CardItem
          key={item.id}
          id={String(item.id)}
          title={item.title}
          imgSrc={item.images?.[0]?.imageUrl}
          price={item.price ?? 0}
          href={`/listing/${item.id}`}
        />
      ))}

      <StatusMessage itemsLength={items.length} loading={loading} />
    </main>
  );
}

function StatusMessage({
  itemsLength,
  loading,
}: {
  itemsLength: number;
  loading: boolean;
}) {
  if (itemsLength === 0 && !loading) {
    return (
      <p className="col-span-full text-center text-gray-500">
        No items available.
      </p>
    );
  }
  if (loading) {
    return (
      <div className="col-span-full text-center py-4">
        Loading more items...
      </div>
    );
  }
  return null;
}
