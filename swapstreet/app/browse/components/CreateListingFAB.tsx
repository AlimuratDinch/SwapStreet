import Link from "next/link";
import { Plus } from "lucide-react";

export function CreateListingFAB() {
  return (
    <div className="fixed bottom-6 right-6 z-[110]">
      <Link href="/seller/createListing">
        <button
          className="bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
          aria-label="Create Listing"
        >
          <Plus className="w-8 h-8" />
        </button>
      </Link>
    </div>
  );
}
