"use client";
export const dynamic = "force-dynamic";
import { Header } from "../browse/BrowseElements";
import { useState, useRef, useEffect } from "react";
import { Star, X, Download, Grid, List, Info, Upload } from "lucide-react";
import Image from "next/image";
import {
  readWardrobeItems,
  removeWardrobeItem,
  WARDROBE_STORAGE_KEY,
  type WardrobeItem,
} from "./wardrobeStorage";

export default function WardrobePage() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showOriginal, setShowOriginal] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentResults, setRecentResults] = useState<string[]>([]);
  const [firstListingId, setFirstListingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isRemoving, setIsRemoving] = useState<Set<string>>(new Set());
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);

  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  // Fetch a valid listing ID
  useEffect(() => {
    const fetchListingId = async () => {
      try {
        const response = await fetch(`${API_URL}/search/search`, {
          credentials: "include", // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          const items = Array.isArray(data) ? data : (data?.items ?? []);
          if (items && items.length > 0) {
            setFirstListingId(items[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch listing ID:", err);
      }
    };
    fetchListingId();
  }, [API_URL]);

  useEffect(() => {
    setWardrobeItems(readWardrobeItems());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WARDROBE_STORAGE_KEY) {
        setWardrobeItems(readWardrobeItems());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleFavorite = (itemId: string) => {
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

  const handleRemoveFromWardrobe = async (itemId: string) => {
    if (isRemoving.has(itemId)) return;
    setIsRemoving((prev) => new Set(prev).add(itemId));
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        console.error("Missing access token for wishlist request.");
        return;
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
      const res = await fetch(`${apiUrl}/wishlist/${itemId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok && res.status !== 404) {
        const errBody = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Failed to remove from wishlist:", res.status, errBody);
        return;
      }
      setWardrobeItems(removeWardrobeItem(itemId));
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    } finally {
      setIsRemoving((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress(true);

    try {
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to upload images");
        setUploadProgress(false);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        setUploadProgress(false);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB");
        setUploadProgress(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "TryOn");

      const response = await fetch(`${API_URL}/images/upload`, {
        method: "POST",
        credentials: "include", // Include cookies
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(
          errorData.error || errorData.message || "Upload failed",
        );
      }

      const data = await response.json();

      // The backend returns the URL with the presigned URL
      setUploadedImage(data.url);
      setShowOriginal(true);
      setGeneratedImage(null); // Reset generated image when uploading new photo

      // Reset file input
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = "";
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
    } finally {
      setUploadProgress(false);
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
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to use try-on feature");
        setLoading(false);
        return;
      }

      if (!firstListingId) {
        setError(
          "No listings available. Please wait or create a listing first.",
        );
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/tryon/virtual-tryon`, {
        method: "POST",
        credentials: "include", // Include cookies
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clothingImageUrl: uploadedImage,
          listingId: firstListingId,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Try-on failed" }));
        throw new Error(
          errorData.error || errorData.message || "Try-on failed",
        );
      }

      const data = await response.json();
      setGeneratedImage(data.url);
      setShowOriginal(false); // Automatically show result

      // Add to recent results (keep only last 4)
      setRecentResults((prev) => [data.url, ...prev].slice(0, 4));
    } catch (err: unknown) {
      console.error("Try-on error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const imageToDownload = showOriginal ? uploadedImage : generatedImage;

    if (!imageToDownload) {
      setError("No image to download");
      return;
    }

    try {
      const response = await fetch(imageToDownload);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = showOriginal ? "original.jpg" : "tryon-result.jpg";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download image");
    }
  };

  const handleReupload = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setShowOriginal(true);
    setError(null);
    mainImageInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showCenterNav={false} />

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-[420px] bg-white border-r border-gray-200 h-screen fixed top-16 left-0 p-6 overflow-y-auto">
          {/* Info tooltip */}
          <div className="mb-4">
            <div className="flex justify-start mb-2">
              <button
                className="text-gray-600 hover:text-gray-800 relative group"
                aria-label="Upload instructions"
              >
                <Info className="w-4 h-4" />
                <div className="absolute left-0 top-6 z-20 w-72 bg-white text-sm text-gray-700 text-left border border-gray-200 rounded shadow-lg p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                  <p className="mb-2 font-medium">How to use:</p>
                  <p className="mb-1">
                    1. Click the frame to upload your photo
                  </p>
                  <p className="mb-1">2. Pick an item and click Try On</p>
                  <p>3. Toggle Original/Result to compare</p>
                </div>
              </button>
            </div>

            {/* Main image - Upload/Result display */}
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
              className={`w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative ${
                !uploadedImage
                  ? "cursor-pointer hover:bg-gray-200 border-4 border-dashed border-gray-300 hover:border-teal-500 transition-colors"
                  : ""
              }`}
            >
              {uploadProgress ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : uploadedImage || generatedImage ? (
                <>
                  <Image
                    src={
                      (showOriginal
                        ? uploadedImage
                        : generatedImage || uploadedImage) ?? ""
                    }
                    alt={showOriginal ? "Uploaded photo" : "AI Result"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Re-upload button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReupload();
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                    title="Upload new photo"
                  >
                    <Upload className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Upload Your Photo</p>
                  <p className="text-sm text-gray-500 mt-1">Click to browse</p>
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
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    showOriginal
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    !showOriginal
                      ? "bg-teal-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Result
                </button>
              </div>
            )}
          </div>

          {/* Error message display */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {error}
            </div>
          )}

          {/* Try-On Button */}
          <div className="mb-4">
            <button
              onClick={handleTryOn}
              disabled={loading || !uploadedImage || uploadProgress}
              className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                "Try On"
              )}
            </button>
          </div>

          {/* Download button */}
          <div className="flex justify-center mb-6 pb-6 border-b border-gray-200">
            <button
              onClick={handleDownload}
              disabled={!uploadedImage && !generatedImage}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Recent AI Results */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Recent Results
            </h3>
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`relative flex-1 aspect-[2/3] rounded-lg overflow-hidden ${
                    recentResults[i] ? "bg-gray-100" : "bg-gray-200"
                  }`}
                >
                  {recentResults[i] ? (
                    <Image
                      src={recentResults[i]}
                      alt={`Try-on result ${i + 1}`}
                      fill
                      className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setGeneratedImage(recentResults[i]);
                        setShowOriginal(false);
                      }}
                      unoptimized
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 ml-[420px]">
          {/* Header with View Toggle */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Wardrobe</h2>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200"
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200"
                }`}
                title="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Wardrobe Items Grid */}
          <div
            className={`grid gap-6 mb-12 ${
              viewMode === "grid" ? "grid-cols-4" : "grid-cols-1"
            }`}
          >
            {wardrobeItems.length === 0 && (
              <div className="col-span-full text-center text-gray-500">
                Your wardrobe is empty. Add items from Browse.
              </div>
            )}
            {wardrobeItems.map((item) => {
              const safePrice = Number.isFinite(item.price) ? item.price : 0;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <div
                    className={`relative bg-gray-100 flex items-center justify-center ${
                      viewMode === "grid" ? "aspect-square" : "w-32 h-32"
                    }`}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`absolute top-3 left-3 p-1.5 bg-white/80 rounded-full transition-all ${
                        favorites.has(item.id)
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          favorites.has(item.id)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleRemoveFromWardrobe(item.id)}
                      className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from wardrobe"
                      disabled={isRemoving.has(item.id)}
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${safePrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
