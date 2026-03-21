"use client";
export const dynamic = "force-dynamic";
import { Header } from "@/components/common/Header";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Area } from "react-easy-crop";
import { useAuth } from "@/contexts/AuthContext";
import {
  readWardrobeItems,
  removeWardrobeItem,
  WARDROBE_STORAGE_KEY,
  type WardrobeItem,
} from "./wardrobeStorage";
import { CropModal } from "@/components/wardrobe/CropModal";
import { Sidebar } from "@/components/wardrobe/Sidebar";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { ListingModal } from "@/app/browse/components/ListingModal";

export default function WardrobePage() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentResults, setRecentResults] = useState<string[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isViewingRecentResult, setIsViewingRecentResult] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isRemoving, setIsRemoving] = useState<Set<string>>(new Set());
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [photoMode, setPhotoMode] = useState<"upload" | "model">("upload");
  const [selectedGender, setSelectedGender] = useState<
    "male" | "female" | null
  >(null);
  const [selectedSkinTone, setSelectedSkinTone] = useState<
    "light" | "medium" | "dark" | null
  >(null);
  const [selectedBodyType, setSelectedBodyType] = useState<
    "slim" | "average" | "plus" | null
  >(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const [frameAspect, setFrameAspect] = useState<number>(2 / 3);
  const { accessToken: ctxToken, refreshToken } = useAuth();

  useEffect(() => {
    const el = imageFrameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setFrameAspect(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  const authedFetch = useCallback(
    async (url: string, options: RequestInit): Promise<Response> => {
      const token = ctxToken || sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Please log in to continue");
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        const newToken = await refreshToken();
        if (!newToken) throw new Error("Session expired. Please log in again.");
        return fetch(url, {
          ...options,
          headers: {
            ...(options.headers as Record<string, string>),
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
      return res;
    },
    [ctxToken, refreshToken],
  );

  const modelImagePath =
    selectedGender && selectedSkinTone && selectedBodyType
      ? `/images/wardrobe/${selectedGender}-${selectedSkinTone}-${selectedBodyType}.png`
      : null;

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
      // Reorder items: favorited items at top, unfavorited at bottom
      setWardrobeItems((items) => {
        const favorited = items.filter((i) => newSet.has(i.id));
        const unfavorited = items.filter((i) => !newSet.has(i.id));
        return [...favorited, ...unfavorited];
      });
      return newSet;
    });
  };

  const handleRemoveFromWardrobe = async (itemId: string) => {
    if (isRemoving.has(itemId)) return;
    setIsRemoving((prev) => new Set(prev).add(itemId));
    try {
      const res = await authedFetch(`${API_URL}/wishlist/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 404) {
        const errBody = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Failed to remove from wishlist:", res.status, errBody);
        return;
      }
      setWardrobeItems(removeWardrobeItem(itemId));
      setSelectedItemId((prev) => (prev === itemId ? null : prev));
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

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);

    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const getCroppedImage = async (
    src: string,
    pixelCrop: Area,
  ): Promise<Blob> => {
    const img = document.createElement("img");
    img.src = src;
    await new Promise((res) => {
      img.onload = res;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );
    return new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.92),
    );
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setUploadProgress(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedImage(cropSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");
      formData.append("type", "TryOn");

      const response = await authedFetch(`${API_URL}/images/upload`, {
        method: "POST",
        credentials: "include",
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
      setUploadedImage(data.url);
      setShowOriginal(true);
      setGeneratedImage(null);
      setIsViewingRecentResult(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
    } finally {
      setUploadProgress(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const handleTryOn = async () => {
    if (photoMode === "upload" && !uploadedImage) {
      setError("Please upload a personal photo first");
      return;
    }
    if (photoMode === "model" && !modelImagePath) {
      setError("Please complete model selection first");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setIsViewingRecentResult(false);

    try {
      const token = ctxToken || sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to use try-on feature");
        setLoading(false);
        return;
      }

      if (!selectedItemId) {
        setError("Please select an item from your wardrobe first.");
        setLoading(false);
        return;
      }

      if (photoMode === "model" && modelImagePath) {
        setUploadProgress(true);
        try {
          const modelResponse = await fetch(modelImagePath);
          const blob = await modelResponse.blob();
          const file = new File(
            [blob],
            `model-${selectedGender}-${selectedSkinTone}-${selectedBodyType}.png`,
            { type: "image/png" },
          );
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "TryOn");
          const uploadResponse = await authedFetch(`${API_URL}/images/upload`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload model image");
          }
          const uploadData = await uploadResponse.json();
          setUploadedImage(uploadData.url);
        } finally {
          setUploadProgress(false);
        }
      }

      const selectedItem = wardrobeItems.find(
        (item) => item.id === selectedItemId,
      );
      if (!selectedItem?.imageUrl) {
        setError("Selected item has no image.");
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
          clothingImageUrl: selectedItem.imageUrl,
          listingId: selectedItemId,
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
      setIsViewingRecentResult(false);

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
    const imageToDownload = showOriginal
      ? photoMode === "model"
        ? modelImagePath
        : uploadedImage
      : generatedImage;

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
    if (photoMode === "model") {
      setSelectedGender(null);
      setSelectedSkinTone(null);
      setSelectedBodyType(null);
    }
    setUploadedImage(null);
    setGeneratedImage(null);
    setShowOriginal(true);
    setError(null);
    setIsViewingRecentResult(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <CropModal
        cropSrc={cropSrc}
        crop={crop}
        zoom={zoom}
        frameAspect={frameAspect}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={setCroppedAreaPixels}
        onConfirm={handleCropConfirm}
        onClose={() => setCropSrc(null)}
      />

      <Sidebar
        photoMode={photoMode}
        uploadedImage={uploadedImage}
        generatedImage={generatedImage}
        modelImagePath={modelImagePath}
        showOriginal={showOriginal}
        uploadProgress={uploadProgress}
        loading={loading}
        isViewingRecentResult={isViewingRecentResult}
        selectedItemId={selectedItemId}
        selectedGender={selectedGender}
        selectedSkinTone={selectedSkinTone}
        selectedBodyType={selectedBodyType}
        recentResults={recentResults}
        error={error}
        imageFrameRef={imageFrameRef}
        mainImageInputRef={mainImageInputRef}
        onPhotoModeUpload={() => {
          setPhotoMode("upload");
          setGeneratedImage(null);
          setShowOriginal(true);
        }}
        onPhotoModeModel={() => {
          setPhotoMode("model");
          setUploadedImage(null);
          setGeneratedImage(null);
          setShowOriginal(true);
        }}
        onUploadClick={() => mainImageInputRef.current?.click()}
        onRemoveClick={handleReupload}
        onImageKeyDown={(e) => {
          if (
            photoMode === "upload" &&
            !uploadedImage &&
            !generatedImage &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            mainImageInputRef.current?.click();
          }
        }}
        onImageUpload={handleImageUpload}
        onGenderChange={setSelectedGender}
        onSkinToneChange={setSelectedSkinTone}
        onBodyTypeChange={setSelectedBodyType}
        onResetGender={() => {
          setSelectedGender(null);
          setSelectedSkinTone(null);
          setSelectedBodyType(null);
        }}
        onResetSkinTone={() => {
          setSelectedSkinTone(null);
          setSelectedBodyType(null);
        }}
        onResetBodyType={() => setSelectedBodyType(null)}
        onShowOriginal={() => setShowOriginal(true)}
        onShowResult={() => setShowOriginal(false)}
        onSelectRecentResult={(img) => {
          setGeneratedImage(img);
          setShowOriginal(false);
          setUploadedImage(null);
          setIsViewingRecentResult(true);
        }}
        onTryOn={handleTryOn}
        onDownload={handleDownload}
      />

      <main className="flex-1 p-8 ml-[420px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Wardrobe</h2>
        </div>

        <WardrobeGrid
          items={wardrobeItems}
          selectedItemId={selectedItemId}
          favorites={favorites}
          isRemoving={isRemoving}
          onSelectItem={(id) =>
            setSelectedItemId(id === selectedItemId ? null : id)
          }
          onToggleFavorite={toggleFavorite}
          onRemoveItem={handleRemoveFromWardrobe}
          onViewDetails={(id) => setSelectedListingId(id)}
        />
        {selectedListingId && (
          <ListingModal
            listingId={selectedListingId}
            onClose={() => setSelectedListingId(null)}
          />
        )}
      </main>
    </div>
  );
}
