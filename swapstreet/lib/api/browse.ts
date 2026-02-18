// lib/api/browse.ts
export type SearchParams = {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  cursor?: string;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export async function getSearchResults(params: SearchParams) {
  try {
    const q = new URLSearchParams();

    if (params.q) q.set("Query", params.q); // The C# code uses request.Query
    if (params.cursor) q.set("Cursor", params.cursor);
    if (params.minPrice) q.set("MinPrice", params.minPrice);
    if (params.maxPrice) q.set("MaxPrice", params.maxPrice);
    q.set("PageSize", "18");

    const res = await fetch(`${API_BASE}/api/search/search?${q.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return { items: [], nextCursor: null, hasNextPage: false };

    const data = await res.json();

    // The C# code returns an object with { items, nextCursor, hasNextPage }
    return {
      items: data.items ?? [],
      nextCursor: data.nextCursor ?? null,
      hasNextPage: !!data.hasNextPage,
    };
  } catch (err) {
    return { items: [], nextCursor: null, hasNextPage: false };
  }
}
