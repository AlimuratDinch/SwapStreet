// app/(auth)/browse/page.tsx
import { Sidebar, CardItem, Header } from "../BrowseElements";

async function fetchClothingItems(categoryId?: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const url = categoryId
      ? `${apiUrl}/api/catalog/categories/${categoryId}`
      : `${apiUrl}/api/catalog/items`;
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include"
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    // If fetching category, extract items from CategoryResponse
    return categoryId ? data.items : data;
  } catch (error) {
    console.error("Failed to fetch clothing items:", error);
    return [];
  }
}

export default async function BrowsePage({ searchParams }: { searchParams: { category?: string } }) {
  const items = await fetchClothingItems(searchParams.category);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="pt-24 flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {items.length > 0 ? (
            items.map((item: { id: number; title: string; description: string; imageUrl: string }) => (
              <CardItem
                key={item.id}
                title={item.title}
                description={item.description}
                imgSrc={item.imageUrl}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No items available. Try adding a new listing!
            </p>
          )}
        </main>
      </div>
      <button className="fixed bottom-5 right-5 w-13 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl">
        +
      </button>
    </div>
  );
}