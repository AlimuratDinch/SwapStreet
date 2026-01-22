import { Sidebar, Header } from "./BrowseElements";
import InfiniteBrowse from "./InfiniteBrowse";

type SearchParams = {
  minPrice?: string;
  maxPrice?: string;
  categoryId?: string;
  conditions?: string;
};

function getApiBase() {
  return (
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  );
}

function buildSearchUrl(resolvedParams: SearchParams, extras?: Record<string, string>) {
  const params = new URLSearchParams();
  if (resolvedParams.minPrice) params.set("minPrice", resolvedParams.minPrice);
  if (resolvedParams.maxPrice) params.set("maxPrice", resolvedParams.maxPrice);
  if (resolvedParams.categoryId) params.set("categoryId", resolvedParams.categoryId);
  if (resolvedParams.conditions) params.set("conditions", resolvedParams.conditions);
  if (extras) {
    Object.entries(extras).forEach(([k, v]) => params.set(k, v));
  }
  const apiUrl = getApiBase();
  return `${apiUrl}/api/search/search${params.toString() ? `?${params.toString()}` : ""}`;
}

export async function fetchClothingItems(searchParams: Promise<SearchParams>) {
  try {
    const resolvedParams = await searchParams;
    const url = buildSearchUrl(resolvedParams);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return [];
  }
}

// helper: fetches raw search response (items + cursor)
export async function fetchSearchPage(searchParams: Promise<SearchParams>) {
  try {
    const resolvedParams = await searchParams;
    const url = buildSearchUrl(resolvedParams, { limit: "18" });
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);
    return {
      items,
      nextCursor: data?.nextCursor ?? null,
      hasNextPage: Boolean(data?.hasNextPage),
    };
  } catch (error) {
    console.error("Failed to fetch search page:", error);
    return { items: [], nextCursor: null, hasNextPage: false };
  }
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // Fetch first page of items
  const {
    items: initialItems,
    nextCursor,
    hasNextPage,
  } = await fetchSearchPage(searchParams);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore - dynamic client component props */}
        <InfiniteBrowse
          initialItems={initialItems}
          initialCursor={nextCursor}
          initialHasNext={hasNextPage}
        />
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
