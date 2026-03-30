"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft } from "lucide-react";
import {
  CATEGORIES,
  COLOURS,
  CONDITIONS,
  SIZES,
  BRANDS,
} from "../../browse/components/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type PendingListingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  colour: string;
  condition: string;
  size: string;
  brand: string;
  images: Array<{ id: string; imageUrl: string }>;
}

type EnumSelectConfig = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
};

export default function EditListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const listingId = searchParams.get("id");

  const [listingData, setListingData] = useState<ListingDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingListingImage[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ id: string; imageUrl: string }>
  >([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [colour, setColour] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [brand, setBrand] = useState<string>("");

  const enumSelects: EnumSelectConfig[] = [
    {
      label: "Category *",
      value: category,
      onChange: setCategory,
      placeholder: "Select category",
      options: CATEGORIES,
    },
    {
      label: "Brand *",
      value: brand,
      onChange: setBrand,
      placeholder: "Select brand",
      options: BRANDS,
    },
    {
      label: "Condition *",
      value: condition,
      onChange: setCondition,
      placeholder: "Select condition",
      options: CONDITIONS,
    },
    {
      label: "Size *",
      value: size,
      onChange: setSize,
      placeholder: "Select size",
      options: SIZES,
    },
    {
      label: "Colour *",
      value: colour,
      onChange: setColour,
      placeholder: "Select colour",
      options: COLOURS,
    },
  ];

  // Get listing data
  useEffect(() => {
    async function fetchListing() {
      if (!listingId || !accessToken) return;

      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/search/listing/${listingId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load listing");
        }

        const data = await res.json();
        setListingData(data);
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price);
        setCategory(data.category);
        setColour(data.colour);
        setCondition(data.condition);
        setSize(data.size);
        setBrand(data.brand);
        setExistingImages(data.images || []);
      } catch (err) {
        console.error(err);
        setError("Could not load listing");
      } finally {
        setIsLoading(false);
      }
    }

    fetchListing();
  }, [listingId, accessToken]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const additions: PendingListingImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (existingImages.length + pendingImages.length + additions.length > 5) {
      additions.forEach((a) => {
        if (typeof globalThis.URL?.revokeObjectURL === "function") {
          globalThis.URL.revokeObjectURL(a.previewUrl);
        }
      });
      setError("You can upload a maximum of 5 images total.");
      return;
    }

    setPendingImages((prev) => [...prev, ...additions]);
  };

  const removeExistingImage = (id: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed && typeof globalThis.URL?.revokeObjectURL === "function") {
        globalThis.URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const uploadNewImages = async () => {
    for (const { file } of pendingImages) {
      const imageFormData = new FormData();
      imageFormData.append("File", file);
      imageFormData.append("Type", "Listing");
      imageFormData.append("ListingId", listingId || "");

      const res = await fetch(`${API_URL}/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: imageFormData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Image upload failed");
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const failValidation = (message: string) => {
      setError(message);
      setIsSubmitting(false);
    };

    const validations = [
      { invalid: !listingId, message: "Listing ID missing." },
      { invalid: !title.trim(), message: "Please enter a title." },
      { invalid: !description.trim(), message: "Please enter a description." },
      { invalid: !price || price <= 0, message: "Please enter a valid price." },
      {
        invalid: existingImages.length + pendingImages.length === 0,
        message: "Please keep at least one image or upload new ones.",
      },
      { invalid: !category, message: "Please select a category." },
      { invalid: !brand, message: "Please select a brand." },
      { invalid: !condition, message: "Please select a condition." },
      { invalid: !size, message: "Please select a size." },
      { invalid: !colour, message: "Please select a colour." },
    ];

    const firstError = validations.find((item) => item.invalid);
    if (firstError) {
      failValidation(firstError.message);
      return;
    }

    try {
      // Upload new images
      if (pendingImages.length > 0) {
        await uploadNewImages();
      }

      // Update listing
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        price,
        category,
        brand,
        condition,
        size,
        colour,
      };

      const res = await fetch(`${API_URL}/listings/${listingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update listing");
      }

      router.push("/seller/manageListings");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/seller/manageListings")}
          className="mb-6 flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Listing
          </h1>
          <p className="text-gray-600 mb-6">Update your listing details</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blue Vintage Sweater"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item, condition, fit, etc."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price ?? ""}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* ENUMS */}
            <div className="grid grid-cols-2 gap-4">
              {enumSelects.map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Images
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.imageUrl}
                        alt="Listing"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Images (max 5 total)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-gray-600">
                    <p className="font-medium">Click to upload images</p>
                    <p className="text-sm text-gray-500">
                      or drag and drop
                    </p>
                  </div>
                </label>
              </div>

              {pendingImages.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {pendingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.previewUrl}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingImage(img.id)}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/seller/manageListings")}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
