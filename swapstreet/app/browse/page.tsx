import { Sidebar, CardItem, Header } from "./BrowseElements";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FetchResult {
  items: any[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export async function fetchClothingItems(
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    conditions?: string;
    page?: string;
  }>,
): Promise<FetchResult> {
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
    if (resolvedParams.page) params.set("page", resolvedParams.page);

    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const url = `${apiUrl}/api/catalog/items${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    // Handle paginated response: { items: [...], pagination: {...} }
    if (Array.isArray(data)) {
      return { items: data };
    }

    return {
      items: data.items || [],
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return { items: [] };
  }
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: {
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    conditions?: string;
  };
}) {
  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
    if (searchParams.categoryId)
      params.set("categoryId", searchParams.categoryId);
    if (searchParams.conditions)
      params.set("conditions", searchParams.conditions);
    params.set("page", page.toString());
    return params.toString();
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-8">
      {currentPage > 1 && (
        <Link
          href={`?${buildQueryString(currentPage - 1)}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
        >
          <ChevronLeft size={20} />
          Previous
        </Link>
      )}

      <div className="flex items-center gap-2">
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {currentPage < totalPages && (
        <Link
          href={`?${buildQueryString(currentPage + 1)}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
        >
          Next
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    conditions?: string;
    page?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const { items, pagination } = await fetchClothingItems(searchParams);
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="pt-24 flex-1 overflow-y-auto p-6 flex flex-col">
          <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 auto-rows-max">
            {items.length > 0 ? (
              items.map(
                (item: {
                  id: number;
                  title: string;
                  description: string;
                  imageUrl: string;
                  condition: string;
                  price: number;
                }) => (
                  <CardItem
                    key={item.id}
                    title={item.title}
                    imgSrc={item.imageUrl}
                    price={item.price ?? 0}
                  />
                ),
              )
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No items available.
              </p>
            )}
          </main>

          {items.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={resolvedParams}
            />
          )}
        </div>
      </div>
    </div>
  );
}
