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


interface BrowseLayoutProps {
  initialItems: Item[];
  initialCursor: string | null;
  initialHasNext: boolean;
}

export function BrowseLayout({
  initialItems,
  initialCursor,
  initialHasNext,
}: BrowseLayoutProps) {
  return (
    <SidebarProvider>
      <BrowseSidebar />
      <SidebarInset className="flex flex-col">
        <div className="flex items-center gap-2 border-b p-2 pt-20">
          <SidebarTrigger />
        </div>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<BrowseSkeleton />}>
            <InfiniteBrowse
              initialItems={initialItems}
              initialCursor={initialCursor}
              initialHasNext={initialHasNext}
            />
          </Suspense>
        </div>
      </SidebarInset>
      <CreateListingFAB />
    </SidebarProvider>
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
