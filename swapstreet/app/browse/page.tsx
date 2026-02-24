import { Suspense } from "react";
// Adjust these import paths based on your actual folder structure
import { Header } from "@/components/common/Header";
import { Sidebar } from "./components/Sidebar";
import { CreateListingFAB } from "./components/CreateListingFAB";
import InfiniteBrowse from "./components/InfiniteBrowse";
import { getSearchResults, SearchParams } from "@/lib/api/browse";

/**
 * Next.js 15 Server Component
 * This handles the initial data fetch and layout.
 */
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // 1. Wait for URL search params (Next.js 15 requirement)
  const params = await searchParams;

  // 2. Pre-fetch initial data on the server
  // This prevents the "blank page then loading spinner" effect
  const initialData = await getSearchResults(params);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 3. Global Navigation */}
      <Header showCenterNav={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* 4. Filter Sidebar - Wrapped in Suspense for URL param read safety */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        {/* 5. Main Content Area */}
        <Suspense fallback={<BrowseSkeleton />}>
          <InfiniteBrowse
            initialItems={initialData.items}
            initialCursor={initialData.nextCursor}
            initialHasNext={initialData.hasNextPage}
          />
        </Suspense>
      </div>

      {/* 6. Floating Action Button */}
      <CreateListingFAB />
    </div>
  );
}

/** SKELETONS FOR LOADING STATES **/

function SidebarSkeleton() {
  return (
    <aside className="w-64 bg-[#d9d9d9] border-r p-4 pt-24 h-screen animate-pulse">
      <div className="h-10 bg-gray-300 rounded mb-6" />
      <div className="h-6 w-1/2 bg-gray-300 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded" />
        <div className="h-4 bg-gray-300 rounded w-5/6" />
      </div>
    </aside>
  );
}

function BrowseSkeleton() {
  return (
    <main className="pt-24 flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-square bg-gray-200 animate-pulse rounded-md" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
        </div>
      ))}
    </main>
  );
}
