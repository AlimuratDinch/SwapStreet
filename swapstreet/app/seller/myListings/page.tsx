"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/common/Header";
import { Trash2 } from "lucide-react";
import { getSearchResults } from "@/lib/api/browse";
import { getMyProfile } from "@/lib/api/profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type ListingItem = {
  id: string;
  title: string;
  price: number;
  images?: { imageUrl: string | null }[];
};

export default function MyListingsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getMyProfile(accessToken);
        const { items } = await getSearchResults({
          sellerId: profile.id,
          pageSize: 50,
        });
        const mapped: ListingItem[] = (items ?? []).map(
          (i: {
            id: string;
            title: string;
            price: number;
            images?: { imageUrl: string | null }[];
          }) => ({
            id: i.id,
            title: i.title,
            price: i.price,
            images: i.images,
          }),
        );
        setListings(mapped);
      } catch (e) {
        console.error(e);
        setError("Failed to load listings");
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, accessToken]);

  const handleDeleteClick = (id: string) => {
    setConfirmId(id);
  };

  const handleConfirmCancel = () => {
    setConfirmId(null);
  };

  const handleConfirmDelete = async (id: string) => {
    if (!accessToken) {
      router.push("/auth/sign-in");
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
        setConfirmId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(
          data?.Error || "Could not delete listing. It may not be yours.",
        );
      }
    } catch (e) {
      console.error(e);
      setError("Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  };

  const firstImage = (item: ListingItem) => {
    const img = item.images?.[0]?.imageUrl;
    return img || "/images/default-seller-banner.png";
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="mx-auto max-w-4xl px-4 pt-24 pb-10 text-center">
          <p className="text-gray-600">
            Please sign in to view and manage listings.
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth/sign-in")}
            className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-white hover:bg-teal-600"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Listings
          </h1>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Back to profile
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-center text-gray-500">
            Loading listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center text-gray-500">
            <p>No listings found.</p>
            <p className="mt-2 text-sm">
              <button
                type="button"
                onClick={() => router.push("/seller/createListing")}
                className="text-teal-500 hover:underline"
              >
                Create a listing
              </button>
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {listings.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={firstImage(item)}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized={
                      firstImage(item).startsWith("http") &&
                      firstImage(item).includes("minio")
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-gray-900 truncate">
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    ${Number(item.price).toFixed(2)} CAD
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {confirmId === item.id ? (
                    <>
                      <span className="text-sm text-gray-600">
                        Delete this listing?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting..." : "Yes, delete"}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCancel}
                        disabled={deletingId === item.id}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                      aria-label={`Delete ${item.title}`}
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
