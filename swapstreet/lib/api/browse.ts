// lib/api/browse.ts
export type SearchParams = {
  q?: string;
  cursor?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost"
).replace(/\/$/, "");

export async function getSearchResults(params: SearchParams) {
  try {
    // If location params provided, call the locationFilter endpoint
    if (typeof params.lat === "number" && typeof params.lng === "number") {
      const lat = params.lat;
      const lng = params.lng;
      const radius = params.radiusKm ?? 20;

      const res = await fetch(
        `${API_BASE}/locationFilter?userLat=${lat}&userLon=${lng}&radiusKm=${radius}`,
        { cache: "no-store" },
      );

      if (!res.ok) return { items: [], nextCursor: null, hasNextPage: false };

      const data = await res.json();

      // locationFilter returns a simple list; no pagination
      return { items: data ?? [], nextCursor: null, hasNextPage: false };
    }

    const q = new URLSearchParams();

    if (params.q) q.set("Query", params.q); // The C# code uses request.Query
    if (params.cursor) q.set("Cursor", params.cursor);
    q.set("PageSize", "18");

    const res = await fetch(`${API_BASE}/search/search?${q.toString()}`, {
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
