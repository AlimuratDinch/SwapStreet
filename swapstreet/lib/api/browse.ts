// lib/api/browse.ts
export type SearchParams = {
  q?: string;
  cursor?: string;
  category?: string;
  condition?: string;
  size?: string;
  brand?: string;
  colour?: string;
  maxPrice?: number;
  minPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  /** Seller profile id — uses Postgres-backed search on the API. */
  sellerId?: string;
  pageSize?: number;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

/** Normalized listing row from GET /search/search (browse + profile grids). */
export type BrowseSearchResultItem = {
  id: string;
  title: string;
  price: number;
  fsa: string;
  images?: { imageUrl: string }[];
};

export function parseBrowseSearchResultItem(
  raw: unknown,
): BrowseSearchResultItem {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { id: "", title: "", price: 0, fsa: "" };
  }
  const r = raw as Record<string, unknown>;
  const fsa =
    typeof r.fsa === "string" ? r.fsa : typeof r.FSA === "string" ? r.FSA : "";
  const images = Array.isArray(r.images) ? r.images : undefined;
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    price: Number(r.price ?? 0),
    fsa,
    images: images as BrowseSearchResultItem["images"],
  };
}

export type SearchResultsPayload = {
  items: BrowseSearchResultItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export async function getSearchResults(
  params: SearchParams,
): Promise<SearchResultsPayload> {
  try {
    const q = new URLSearchParams();

    if (params.q) q.set("Query", params.q);
    if (params.cursor) q.set("Cursor", params.cursor);
    if (params.category) q.set("Category", params.category);
    if (params.condition) q.set("Condition", params.condition);
    if (params.size) q.set("Size", params.size);
    if (params.brand) q.set("Brand", params.brand);
    if (params.colour) q.set("Colour", params.colour);
    if (params.maxPrice) q.set("MaxPrice", params.maxPrice.toString());
    if (params.minPrice) q.set("MinPrice", params.minPrice.toString());
    if (params.lat != null) q.set("Lat", params.lat.toString());
    if (params.lng != null) q.set("Lng", params.lng.toString());
    if (params.radiusKm != null) q.set("RadiusKm", params.radiusKm.toString());
    if (params.sellerId) q.set("SellerId", params.sellerId);

    const pageSize = params.pageSize ?? 18;
    q.set("PageSize", String(Math.min(Math.max(pageSize, 1), 50)));

    const res = await fetch(`${API_BASE}/search/search?${q.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return { items: [], nextCursor: null, hasNextPage: false };

    const data = (await res.json()) as {
      items?: unknown;
      nextCursor?: string | null;
      hasNextPage?: unknown;
    };

    const rawItems = Array.isArray(data.items) ? data.items : [];

    return {
      items: rawItems.map(parseBrowseSearchResultItem),
      nextCursor: data.nextCursor ?? null,
      // Strict boolean so a stray JSON string never enables infinite scroll incorrectly.
      hasNextPage: data.hasNextPage === true,
    };
  } catch {
    return { items: [], nextCursor: null, hasNextPage: false };
  }
}
