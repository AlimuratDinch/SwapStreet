"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { Header } from "@/app/browse/BrowseElements";
import { Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type MyListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: string;
  images: { imageUrl: string | null; displayOrder: number }[];
};

export default function DeleteListingPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function fetchMyListings() {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/listings/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.Error || "Failed to load your listings");
      }
      const data = await res.json();
      setListings(data.items ?? []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyListings();
  }, [accessToken]);

  const handleDeleteClick = (id: string) => {
    setConfirmId(id);
  };

  const handleConfirmCancel = () => {
    setConfirmId(null);
  };

  const handleConfirmDelete = async (id: string) => {
    if (!accessToken) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`${API_URL}/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.Error || "Failed to delete listing");
      }
      setListings((prev) => prev.filter((l) => l.id !== id));
      setConfirmId(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  };

  const firstImage = (listing: MyListing) => {
    const img = listing.images?.[0];
    return img?.imageUrl || "/images/default-seller-banner.png";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-10">
        <h1 className="text-2xl font-semibold text-gray-900">
          Delete a listing
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Remove a listing from your profile. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back to profile
        </button>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-center text-gray-500">
            Loading your listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center text-gray-500">
            <p>You have no listings.</p>
            <p className="mt-2 text-sm">
              Create one from{" "}
              <button
                type="button"
                onClick={() => router.push("/seller/createListing")}
                className="text-blue-600 hover:underline"
              >
                Create listing
              </button>{" "}
              or go back to your profile.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={firstImage(listing)}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    unoptimized={
                      firstImage(listing).startsWith("http") &&
                      firstImage(listing).includes("minio")
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-gray-900 truncate">
                    {listing.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    ${Number(listing.price).toFixed(2)} CAD
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {confirmId === listing.id ? (
                    <>
                      <span className="text-sm text-gray-600">
                        Delete this listing?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(listing.id)}
                        disabled={deletingId === listing.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === listing.id ? "Deleting..." : "Yes, delete"}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCancel}
                        disabled={deletingId === listing.id}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(listing.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                      aria-label={`Delete ${listing.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
