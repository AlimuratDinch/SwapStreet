"use client";

import { Suspense } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BrowseSidebar } from "./Sidebar";
import InfiniteBrowse from "./InfiniteBrowse";
import { CreateListingFAB } from "./CreateListingFAB";
import { Item } from "./InfiniteBrowse";
import { SearchParams } from "@/lib/api/browse";

interface BrowseLayoutProps {
  initialItems: Item[];
  initialCursor: string | null;
  initialHasNext: boolean;
  params: SearchParams;
}

export function BrowseLayout({
  initialItems,
  initialCursor,
  initialHasNext,
  params,
}: BrowseLayoutProps) {
  return (
    // pt-16 pushes the entire sidebar layout below the fixed navbar (adjust if your navbar is taller/shorter)
    <SidebarProvider className="pt-16 min-h-[calc(100vh-4rem)] ">
      <BrowseSidebar />

      <SidebarInset className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sticky header with trigger — sits just below the navbar */}
<div className="sticky top-16 z-10 flex items-center gap-2 border-b px-3 py-2 bg-white/80 backdrop-blur-sm">
  <SidebarTrigger className="h-8 w-8 flex items-center justify-center border rounded-md hover:bg-gray-100 transition-colors" />
  <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
    Browse Listings
  </h1>
</div>

        {/* Scroll container */}
        <div className="flex-1 relative overflow-hidden">
          <Suspense fallback={<BrowseSkeleton />}>
            <InfiniteBrowse
              key={JSON.stringify(params)}
              initialItems={initialItems}
              initialCursor={initialCursor}
              initialHasNext={initialHasNext}
              params={params}
            />
          </Suspense>
        </div>
      </SidebarInset>

      <CreateListingFAB />
    </SidebarProvider>
  );
}

export function BrowseSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-square bg-gray-200 animate-pulse rounded-md" />
          <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}