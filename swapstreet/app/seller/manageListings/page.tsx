"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Edit2, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface Listing {
  id: string;
  title: string;
  price: number;
  images?: Array<{ id: string; imageUrl: string }>;
}

export default function ManageListingsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchListings() {
      if (!accessToken) return;

      setIsLoading(true);
      try {
        // 1. fetch current user profile ID
        const profileRes = await fetch(`${API_URL}/profile/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!profileRes.ok) {
          throw new Error("Failed to load profile");
        }

        const profile = await profileRes.json();
        const profileId = profile.id;

        // 2. fetch listings (of current user)
        const listingsRes = await fetch(
          `${API_URL}/search/search?sellerId=${profileId}&pageSize=100`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!listingsRes.ok) {
          throw new Error(`API error: ${listingsRes.status}`);
        }

        const data = await listingsRes.json();
        setListings(data.items || []);
        setError("");
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load listings",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [accessToken]);

  const handleDelete = async (listingId: string) => {
    if (!accessToken) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/listings/${listingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          errorText || `Failed to delete listing (${res.status})`,
        );
      }

      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setDeleteConfirm(null);
      setError("");
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/profile")}
          className="mb-6 flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Listings
          </h1>
          <p className="text-gray-600 mb-6">Edit or delete your listings</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
                <p className="text-gray-600">Loading listings...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No listings to manage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  {/* Image */}
                  {listing.images?.[0] && (
                    <img
                      src={listing.images[0].imageUrl}
                      alt={listing.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {listing.title}
                    </h3>
                    <p className="text-teal-600 font-medium">
                      ${listing.price}
                    </p>
                  </div>

                  {/* Actions */}
                  {deleteConfirm === listing.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={isDeleting}
                        className="px-3 py-1 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/seller/editListing?id=${listing.id}`)
                        }
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        title="Edit listing"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(listing.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete listing"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
