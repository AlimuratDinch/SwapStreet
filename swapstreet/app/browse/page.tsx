"use client";
import { Suspense } from "react";
import { Sidebar, Header } from "./BrowseElements";
import InfiniteBrowse from "./InfiniteBrowse";

export default function BrowsePage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}>
          <Sidebar />
        </Suspense>
        <Suspense>
          <InfiniteBrowse />
        </Suspense>
      </div>
      <div className="fixed bottom-4 right-4">
        <a href="/seller/createListing">
          <button className="bg-teal-400 hover:bg-teal-500 text-white font-bold w-12 h-12 rounded-full shadow-lg transition duration-150 ease-in-out">
            +
          </button>
        </a>
      </div>
    </div>
  );
}

// Helper to fetch clothing items (used for tests)
type SearchParams = { [key: string]: string | undefined } | undefined;

export async function fetchClothingItems(
  searchParamsPromise: Promise<SearchParams>,
) {
  const params = await searchParamsPromise;
  try {
    const q = new URLSearchParams();
    if (params?.minPrice) q.set("minPrice", params.minPrice);
    if (params?.maxPrice) q.set("maxPrice", params.maxPrice);
    if (params?.q) q.set("q", params.q);

    const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const base = envBase || "";
    const url = `${base}/api/search/search${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch (err) {
    console.error("Failed to fetch clothing items:", err);
    return [];
  }
}

export async function fetchSearchPage(
  searchParamsPromise: Promise<SearchParams>,
) {
  const params = await searchParamsPromise;
  try {
    const q = new URLSearchParams();
    q.set("limit", "18");
    if (params?.cursor) q.set("cursor", params.cursor);
    if (params?.minPrice) q.set("minPrice", params.minPrice);
    if (params?.maxPrice) q.set("maxPrice", params.maxPrice);
    if (params?.q) q.set("q", params.q);

    const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const base = envBase || "";
    const url = `${base}/api/search/search?${q.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      return { items: data, nextCursor: null, hasNextPage: false };
    }
    return {
      items: data.items ?? [],
      nextCursor: data.nextCursor ?? null,
      hasNextPage: !!data.hasNextPage,
    };
  } catch {
    return { items: [], nextCursor: null, hasNextPage: false };
  }
}
