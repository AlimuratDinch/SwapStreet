// lib/api/browse.ts
export type SearchParams = {
  q?: string;
  cursor?: string;
  category?: string;
  condition?: string;
  size?: string;
  brand?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost"
).replace(/\/$/, "");

export async function getSearchResults(params: SearchParams) {
  try {
    const q = new URLSearchParams();

    if (params.q) q.set("Query", params.q);
    if (params.cursor) q.set("Cursor", params.cursor);
    if (params.category) q.set("Category", params.category);
    if (params.condition) q.set("Condition", params.condition);
    if (params.size) q.set("Size", params.size);
    if (params.brand) q.set("Brand", params.brand);
    if (params.lat != null) q.set("Lat", params.lat.toString());
    if (params.lng != null) q.set("Lng", params.lng.toString());
    if (params.radiusKm != null) q.set("RadiusKm", params.radiusKm.toString());

    q.set("PageSize", "18");

    const res = await fetch(`${API_BASE}/search/search?${q.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return { items: [], nextCursor: null, hasNextPage: false };

    const data = await res.json();

    return {
      items: data.items ?? [],
      nextCursor: data.nextCursor ?? null,
      hasNextPage: !!data.hasNextPage,
    };
  } catch (err) {
    return { items: [], nextCursor: null, hasNextPage: false };
  }
}
