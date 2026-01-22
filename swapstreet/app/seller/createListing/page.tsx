"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function SellerListingPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileId, setProfileId] = useState<string>("");
  const [fsa, setFsa] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState(true);

  async function uploadListingImages(listingId: string) {
    for (const file of images) {
      const imageFormData = new FormData();
      imageFormData.append("File", file);
      imageFormData.append("Type", "Listing");
      imageFormData.append("ListingId", listingId);

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
  }

  // Fetch profile info for profileId and FSA
  useEffect(() => {
    async function fetchProfile() {
      if (!accessToken) return;
      setProfileLoading(true);
      try {
        const res = await fetch(`${API_URL}/profile/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfileId(data.id);
        setFsa(data.fsa);
      } catch (error) {
        console.error(error);
        setError("Could not load profile info. Please refresh or re-login.");
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, [accessToken]);

  // Handle form input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(value ? Number(value) : null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files];

    if (newImages.length > 5) {
      setError("You can upload a maximum of 5 images.");
      return;
    }

    setImages(newImages);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!title.trim()) {
      setError("Please enter a title.");
      setIsSubmitting(false);
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description.");
      setIsSubmitting(false);
      return;
    }
    if (!price || price <= 0) {
      setError("Please enter a valid price.");
      setIsSubmitting(false);
      return;
    }
    if (!images.length) {
      setError("Please upload at least one image.");
      setIsSubmitting(false);
      return;
    }
    if (!profileId) {
      setError("Profile ID missing. Please refresh or re-login.");
      setIsSubmitting(false);
      return;
    }
    if (!fsa) {
      setError("FSA missing. Please refresh or re-login.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Title", title.trim());
      formData.append("Description", description.trim());
      formData.append("Price", price?.toString() ?? "0");
      formData.append("ProfileId", profileId);
      formData.append("FSA", fsa);

      const response = await fetch(`${API_URL}/api/listings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || "Failed to create listing");
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      const listingId = data.id;

      await uploadListingImages(listingId);

      // Redirect to browse
      router.push("/browse");
    } catch (error) {
      console.error(error);
      setError("Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">
        Create a new listing
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Add a new item to your product catalog.
      </p>

      {error && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      {profileLoading ? (
        <div className="mt-8 text-center text-gray-500">
          Loading profile info...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
        >
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter a descriptive title for your item"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe your item in detail. Include condition, size, brand, etc."
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price (CAD) *
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="price"
                type="number"
                value={price || ""}
                onChange={handlePriceChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-7 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label
              htmlFor="images"
              className="block text-sm font-medium text-gray-700"
            >
              Images * (Max 5 images)
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
            />

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative h-32 w-full">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="rounded-lg object-cover ring-1 ring-gray-200"
                      unoptimized={
                        typeof preview === "string" &&
                        preview.startsWith("blob:")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden fields for profileId and FSA */}
          <input type="hidden" name="profileId" value={profileId} />
          <input type="hidden" name="fsa" value={fsa} />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
