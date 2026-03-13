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
  params: SearchParams; // 1. Accept real params from the Server Component
}

export function BrowseLayout({
  initialItems,
  initialCursor,
  initialHasNext,
  params,
}: BrowseLayoutProps) {
  return (
    <SidebarProvider>
      <BrowseSidebar />
      {/* 2. SidebarInset needs h-screen to establish the viewport height */}
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* Sticky/Fixed Header Area */}
        <div className="flex items-center gap-2 border-b p-2 bg-white/80 backdrop-blur-sm z-10">
          <SidebarTrigger />
          <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Browse Listings
          </h1>
        </div>

        {/* 3. The Scroll Container */}
        {/* We give this flex-1 and overflow-hidden so InfiniteBrowse can manage its own scroll internally */}
        <div className="flex-1 relative overflow-hidden">
          <Suspense fallback={<BrowseSkeleton />}>
            <InfiniteBrowse
              key={JSON.stringify(params)} // 4. Key reset: Forces fresh state when filters change
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

/** * Keep the skeleton here, but ensure it matches the
 * grid layout of the actual InfiniteBrowse component
 **/
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
