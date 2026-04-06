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

function BrowseContent() {
  const searchParams = useSearchParams();

  const [initialData, setInitialData] = useState<{
    items: Item[];
    nextCursor: string | null;
    hasNextPage: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentParams: SearchParams = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      condition: searchParams.get("condition") || undefined,
      size: searchParams.get("size") || undefined,
      brand: searchParams.get("brand") || undefined,
      colour: searchParams.get("colour") || undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
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
        if (isMounted) setInitialData(data);
      } catch (error) {
        console.error("Initial fetch failed:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [currentParams]);

  return (
    <SidebarInset className="flex flex-col flex-1 overflow-hidden">
      <div className="sticky top-0 z-10 flex h-10 items-center border-b px-2 bg-white shrink-0">
        <SidebarTrigger />
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <BrowseSkeleton />
        ) : (
          <InfiniteBrowse
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

export default function BrowsePage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden pt-16">
        <SidebarProvider defaultOpen={true}>
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

function BrowseSkeleton() {
  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 overflow-hidden">
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
