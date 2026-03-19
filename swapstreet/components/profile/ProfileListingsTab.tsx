import Link from "next/link";

export function ProfileListingsTab() {
  return (
    <div className="rounded-xl bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">My Listings</h2>
        <Link
          href="/seller/myListings"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Edit listings
        </Link>
      </div>
      <div className="text-center py-12 text-gray-500">
        <p>Your listings will appear here</p>
        <p className="text-sm mt-2">Listing functionality coming soon</p>
      </div>
    </div>
  );
}
