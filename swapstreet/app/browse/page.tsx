"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/common/Header";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";
import { CreateListingFAB } from "./components/CreateListingFAB";
import InfiniteBrowse, { Item } from "./components/InfiniteBrowse";
import { getSearchResults, SearchParams } from "@/lib/api/browse";

/**
 * BROWSE CONTENT COMPONENT
 * Separated to handle useSearchParams within a Suspense boundary.
 */
function BrowseContent() {
  const searchParams = useSearchParams();

  // Explicitly typing state to avoid @typescript-eslint/no-explicit-any
  const [initialData, setInitialData] = useState<{
    items: Item[];
    nextCursor: string | null;
    hasNextPage: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize currentParams to fix react-hooks/exhaustive-deps
  // This ensures the object reference only changes when the actual query changes
  const currentParams: SearchParams = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      // Add other filters here as they are implemented in browse.ts
      lat: searchParams.get("lat")
        ? parseFloat(searchParams.get("lat")!)
        : undefined,
      lng: searchParams.get("lng")
        ? parseFloat(searchParams.get("lng")!)
        : undefined,
      radiusKm: searchParams.get("radiusKm")
        ? parseFloat(searchParams.get("radiusKm")!)
        : undefined,
    }),
    [searchParams],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchInitial() {
      setIsLoading(true);
      try {
        const data = await getSearchResults(currentParams);
        if (isMounted) {
          setInitialData(data);
        }
      } catch (error) {
        console.error("Initial fetch failed:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [currentParams]); // Correctly depends on memoized currentParams

  return (
    <SidebarInset className="flex flex-col flex-1 overflow-hidden">
      <div className="flex h-10 items-center border-b px-2 bg-white shrink-0">
        <SidebarTrigger />
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <BrowseSkeleton />
        ) : (
          <InfiniteBrowse
            // Unique key ensures the component re-mounts/resets on filter change
            key={searchParams.toString()}
            initialItems={initialData?.items || []}
            initialCursor={initialData?.nextCursor || null}
            initialHasNext={initialData?.hasNextPage || false}
            params={currentParams}
          />
        )}
      </div>
    </SidebarInset>
  );
}

/**
 * MAIN PAGE COMPONENT
 */
export default function BrowsePage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <SidebarProvider defaultOpen={true}>
          {/* Next.js 15 requires useSearchParams to be inside Suspense 
              to avoid de-opting the entire page into client-side rendering.
          */}
          <Suspense fallback={<div className="w-64 border-r bg-white" />}>
            <Sidebar />
          </Suspense>

          <Suspense fallback={<BrowseSkeleton />}>
            <BrowseContent />
          </Suspense>

          <CreateListingFAB />
        </SidebarProvider>
      </div>
    </div>
  );
}

/** SKELETONS **/

function BrowseSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-square bg-gray-200 animate-pulse rounded-md" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}
