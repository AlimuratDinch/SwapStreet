import { Sidebar, CardItem, Header } from "./BrowseElements";

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/catalog/items${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      cache: "no-store",
      // credentials: "include",
    });
    console.log("URL used:", url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return [];
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
  const items = await fetchClothingItems(searchParams);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="pt-24 flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
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
                  description={item.description}
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
      </div>
      <a
        href="/add"
        className="fixed bottom-5 right-5 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl"
      >
        +
      </a>
    </div>
  );
}
