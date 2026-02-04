"use client";
import { Suspense } from "react";
import { Sidebar, Header } from "./BrowseElements";
import InfiniteBrowse from "./InfiniteBrowse";

export default function BrowsePage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}>
          <Sidebar />
        </Suspense>
        <Suspense>
          <InfiniteBrowse />
        </Suspense>
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
