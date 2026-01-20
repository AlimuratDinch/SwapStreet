"use client";

import { Header } from "../browse/BrowseElements";
import { useState, useRef, useEffect } from "react";
import { Star, X, Download, Grid, List, Info } from "lucide-react";
import Image from "next/image";

export default function WardrobePage() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showOriginal, setShowOriginal] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [recentResults, setRecentResults] = useState<string[]>([]);
  const [firstListingId, setFirstListingId] = useState<string | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch a valid listing ID
  useEffect(() => {
    const fetchListingId = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(`${API_URL}/api/catalog/items`);
        if (response.ok) {
          const items = await response.json();
          if (items && items.length > 0) {
            setFirstListingId(items[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch listing ID:", err);
      }
    };
    fetchListingId();
  }, []);

  const toggleFavorite = (itemId: number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Mock wardrobe items
  const wardrobeItems = Array(1)
    .fill(null)
    .map((_, i) => ({
      id: i + 1,
      imageUrl: "/images/placeholder.jpg",
      title: `Wardrobe Item ${i + 1}`,
      isFavorite: i === 0,
    }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to upload image");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "TryOn"); // Upload type for try-on images

      const response = await fetch(`${API_URL}/api/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(errorText || "Upload failed");
      }

      const data = (await response.json()) as { url: string };
      setUploadedImage(data.url);
      setShowOriginal(true);

      // Reset file input so user can upload again
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
    }
  };

  const handleTryOn = async () => {
    if (!uploadedImage) {
      setError("Please upload a personal photo first");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to use try-on feature");
        setLoading(false);
        return;
      }

      if (!firstListingId) {
        setError("No listings available. Please wait or create a listing first.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/tryon/virtual-tryon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clothingImageUrl: uploadedImage, // Use the uploaded MinIO URL
          listingId: firstListingId, // Use the fetched valid listing ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Try-on failed");
      }

      const data = await response.json();
      setGeneratedImage(data.url);

      // Add to recent results (keep only last 4)
      setRecentResults((prev) => [data.url, ...prev].slice(0, 4));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCenterNav={false} />

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-[420px] bg-white border-r border-gray-200 h-screen fixed top-16 left-0 p-6 overflow-y-auto">
          {/* Main image - Upload/Result display */}
          <div className="mb-4">
            <div className="flex justify-start mb-2">
              <button
                className="text-gray-600 hover:text-gray-800 relative group"
                aria-label="Upload instructions"
              >
                <Info className="w-4 h-4" />
                <div className="absolute left-0 top-6 z-20 w-72 bg-white text-sm text-gray-700 text-left border border-gray-200 rounded shadow-lg p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                  <p className="mb-1">
                    1) Click the frame to upload your photo.
                  </p>
                  <p className="mb-1">2) Pick an item and hit Try On.</p>
                  <p>3) Toggle Original/Result to compare.</p>
                </div>
              </button>
            </div>
            <div
              role="button"
              tabIndex={!uploadedImage ? 0 : -1}
              onClick={() =>
                !uploadedImage && mainImageInputRef.current?.click()
              }
              onKeyDown={(e) => {
                if (!uploadedImage && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  mainImageInputRef.current?.click();
                }
              }}
              className={`w-full aspect-[2/3] bg-gray-100 rounded flex items-center justify-center relative ${
                !uploadedImage
                  ? "cursor-pointer hover:bg-gray-200 border-4 border-dashed border-gray-600 hover:border-teal-500 shadow"
                  : ""
              }`}
            >
              {uploadedImage || generatedImage ? (
                <Image
                  src={
                    (showOriginal
                      ? uploadedImage
                      : generatedImage || uploadedImage) ?? ""
                  }
                  alt={showOriginal ? "Uploaded photo" : "AI Result"}
                  fill
                  className="object-cover rounded"
                  unoptimized={(() => {
                    const url =
                      (showOriginal
                        ? uploadedImage
                        : generatedImage || uploadedImage) ?? "";
                    return (
                      typeof url === "string" &&
                      (url.startsWith("blob:") ||
                        url.includes("localhost:9000") ||
                        url.includes("minio:9000"))
                    );
                  })()}
                />
              ) : (
                <div className="text-center">
                  <span className="text-gray-700 text-3xl font-semibold">
                    +
                  </span>
                </div>
              )}
            </div>
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Toggle between original and result */}
            {uploadedImage && generatedImage && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    showOriginal
                      ? "bg-teal-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    !showOriginal
                      ? "bg-teal-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Result
                </button>
              </div>
            )}
          </div>

          {/* Error message display */}
          {error && (
            <div className="mt-2 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Try-On Button */}
          <div className="mb-4">
            <button
              onClick={handleTryOn}
              disabled={loading || !uploadedImage}
              className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Try On"}
            </button>
          </div>

          {/* Download button */}
          <div className="flex justify-center mb-6 pb-6 border-b border-gray-200">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Download className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Rectangular image row */}
          {/* Recent AI Results (4 most recent) */}
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative flex-1 aspect-[2/3] bg-gray-200 rounded flex items-center justify-center overflow-hidden"
              >
                {recentResults[i] ? (
                  <Image
                    src={recentResults[i]}
                    alt={`Try-on result ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={(() => {
                      const url = recentResults[i] ?? "";
                      return (
                        typeof url === "string" &&
                        (url.startsWith("blob:") ||
                          url.includes("localhost:9000") ||
                          url.includes("minio:9000"))
                      );
                    })()}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 ml-[420px]">
          {/* View Toggle */}
          <div className="flex justify-end mb-6">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Wardrobe Items Grid */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            {wardrobeItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden group"
              >
                {/* Item Card */}
                <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                  {/* Wishlist Star */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className={`absolute top-3 left-3 p-1 transition-opacity ${
                      favorites.has(item.id)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        favorites.has(item.id)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  {/* Remove Button */}
                  <button className="absolute top-3 right-3 p-1 bg-white rounded-full shadow">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Item Info */}
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
