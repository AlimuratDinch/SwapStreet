import { Sidebar, Header } from "./BrowseElements";
import InfiniteBrowse from "./InfiniteBrowse";

export async function fetchClothingItems(
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    conditions?: string;
  }>,
) {
  try {
    const params = new URLSearchParams();
    const resolvedParams = await searchParams;
    if (resolvedParams.minPrice)
      params.set("minPrice", resolvedParams.minPrice);
    if (resolvedParams.maxPrice)
      params.set("maxPrice", resolvedParams.maxPrice);
    if (resolvedParams.categoryId)
      params.set("categoryId", resolvedParams.categoryId);
    if (resolvedParams.conditions)
      params.set("conditions", resolvedParams.conditions);
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const url = `${apiUrl}/api/search/search${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

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
export async function fetchSearchPage(
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    conditions?: string;
  }>,
) {
  try {
    const params = new URLSearchParams();
    const resolvedParams = await searchParams;
    if (resolvedParams.minPrice)
      params.set("minPrice", resolvedParams.minPrice);
    if (resolvedParams.maxPrice)
      params.set("maxPrice", resolvedParams.maxPrice);
    if (resolvedParams.categoryId)
      params.set("categoryId", resolvedParams.categoryId);
    if (resolvedParams.conditions)
      params.set("conditions", resolvedParams.conditions);
    params.set("limit", "18");
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const url = `${apiUrl}/api/search/search${params.toString() ? `?${params.toString()}` : ""}`;
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

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    conditions?: string;
  }>;
}) {
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
