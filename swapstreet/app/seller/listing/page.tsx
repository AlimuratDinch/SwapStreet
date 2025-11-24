"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerListingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [images, setImages] = useState<
    Array<{
      file: File;
      preview: string;
      displayOrder: number;
      forTryon: boolean;
    }>
  >([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check authentication and fetch tags
  useEffect(() => {
    // ============================================
    // TEMPORARY: Authentication check disabled for testing
    // TODO: Re-enable before production deployment
    // ============================================
    // const token = localStorage.getItem('accessToken');
    // if (!token) {
    //   setError("You must be logged in to create a listing.");
    //   setTimeout(() => router.push('/login'), 2000);
    //   return;
    // }
    // setAccessToken(token);
    // ============================================

    const token = localStorage.getItem("accessToken");
    setAccessToken(token);

    // Fetch tags from backend
    const fetchTags = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/tags");
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data = await response.json();
        setTags(data);
      } catch (err) {
        console.error("Error fetching tags:", err);
        setError("Failed to load tags. Please refresh the page.");
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, [router]);

  // Handle form input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTagId(e.target.value || null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      setError("You can upload a maximum of 5 images.");
      return;
    }

    const newImages = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      displayOrder: images.length + index,
      forTryon: false,
    }));

    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, displayOrder: i }));
    setImages(newImages);
  };

  const toggleForTryon = (index: number) => {
    const newImages = [...images];
    newImages[index].forTryon = !newImages[index].forTryon;
    setImages(newImages);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[index],
    ];

    // Update display orders
    newImages.forEach((img, i) => {
      img.displayOrder = i;
    });

    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!name.trim()) {
      setError("Please enter a name for your listing.");
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

    try {
      // TODO: Upload images to MinIO first and get image paths
      // For now, creating listing with placeholder image paths
      const listingImages = images.map((img, index) => ({
        imagePath: `placeholder_${index}.jpg`, // Will be replaced with actual MinIO path
        displayOrder: img.displayOrder,
        forTryon: img.forTryon,
      }));

      // Create listing via backend API
      const response = await fetch("http://localhost:8080/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: price,
          tagId: tagId,
          images: listingImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create listing: ${response.statusText}`,
        );
      }

      const createdItem = await response.json();
      console.log("Listing created successfully:", createdItem);

      // Redirect to seller profile or item page
      router.push("/seller/me");
    } catch (err) {
      console.error("Failed to save listing:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save listing. Please try again.",
      );
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

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
      >
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Listing Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter a descriptive name for your listing"
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

        {/* Tag */}
        <div>
          <label
            htmlFor="tag"
            className="block text-sm font-medium text-gray-700"
          >
            Tag (Optional)
          </label>
          <select
            id="tag"
            value={tagId || ""}
            onChange={handleTagChange}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingTags}
          >
            <option value="">
              {isLoadingTags ? "Loading tags..." : "Select a tag (optional)"}
            </option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
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
          {images.length > 0 && (
            <div className="mt-4 space-y-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Image {index + 1}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-blue-600">
                          (Primary)
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={image.forTryon}
                          onChange={() => toggleForTryon(index)}
                          className="rounded border-gray-300"
                        />
                        Virtual Try-On
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0}
                      className="rounded bg-gray-100 p-1 text-xs hover:bg-gray-200 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, "down")}
                      disabled={index === images.length - 1}
                      className="rounded bg-gray-100 p-1 text-xs hover:bg-gray-200 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="rounded-full bg-red-500 p-1 text-white text-xs hover:bg-red-600 h-6 w-6"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
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
    </div>
  );
}
