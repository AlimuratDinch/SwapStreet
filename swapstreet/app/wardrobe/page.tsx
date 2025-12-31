"use client";

import { Header } from "../browse/BrowseElements";
import { useState, useRef } from "react";

export default function WardrobePage() {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded test item with valid GUID
  const testItem = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    imageUrl: "/images/test.jpg",
    title: "Vintage Blue Jeans",
    price: 24.99,
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to upload image");
        setUploadLoading(false);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setUploadedImage(data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadLoading(false);
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        setError("Please log in to use try-on feature");
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
          listingId: testItem.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Try-on failed");
      }

      const data = await response.json();
      setGeneratedImage(data.url);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-24 px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Virtual Try On (TESTING ZONE)</h1>

        {/* Upload Section */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">1. Upload Your Photo</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              {uploadedImage ? (
                <div className="w-32 h-40 mb-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded photo"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-40 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-teal-500 bg-gray-50"
                >
                  <span className="text-gray-500 text-sm text-center px-2">
                    Click to upload
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:bg-gray-400"
            >
              {uploadLoading ? "Uploading..." : "Choose Photo"}
            </button>
          </div>
        </div>

        {/* Try-On Section */}
        <div className="flex gap-8">
          {/* Try-On Button */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">2. Confirm</h2>
            <div className="bg-white rounded-lg p-4 shadow">
              <button
                onClick={handleTryOn}
                disabled={loading || !uploadedImage}
                className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Try On"}
              </button>
            </div>
          </div>

          {/* Generated Result */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">3. Result</h2>
            <div className="bg-white rounded-lg p-4 shadow">
              {error && (
                <div className="text-red-600 mb-4 p-4 bg-red-50 rounded">
                  {error}
                </div>
              )}
              {generatedImage ? (
                <div className="relative aspect-square">
                  <img
                    src={generatedImage}
                    alt="Try-on result"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gray-100 rounded text-gray-500">
                  {loading ? "Generating..." : "Click 'Try On' to see result"}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
