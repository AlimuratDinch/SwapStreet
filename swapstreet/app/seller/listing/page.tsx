"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SellerListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category options
  const categories = {
    Shirts: ["T-shirts", "Polos", "Blouses", "Shirts", "Sweaters"],
    Pants: ["Jeans", "Trousers", "Shorts", "Leggings", "Joggers"],
    Dresses: ["Long", "Short", "Mid-length", "Mini", "Maxi"],
    Accessories: ["Shoes", "Bags", "Jewelry", "Hats", "Scarves"],
    Portables: [
      "Backpacks",
      "Tote Bags",
      "Messenger Bags",
      "Wallets",
      "Purses",
    ],
  };

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setSubcategory(""); // Reset subcategory when category changes
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubcategory(e.target.value);
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

    if (!category) {
      setError("Please select a category.");
      setIsSubmitting(false);
      return;
    }

    if (!subcategory) {
      setError("Please select a subcategory.");
      setIsSubmitting(false);
      return;
    }

    try {
      const listingData = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        price,
        category,
        subcategory,
        images: imagePreviews,
        timestamp: new Date().toISOString(),
        status: "active",
      };

      // Save to localStorage
      // TODO: Change this code to save to the database

      const existingListings = JSON.parse(
        localStorage.getItem("seller:listings") || "[]",
      );
      existingListings.push(listingData);
      localStorage.setItem("seller:listings", JSON.stringify(existingListings));

      // Redirect to seller profile
      router.push("/profile");
      // router.back();
    } catch (err) {
      console.error("Failed to save listing:", err);
      setError("Failed to save listing. Please try again.");
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

        {/* Category and Subcategory */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={handleCategoryChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="subcategory"
              className="block text-sm font-medium text-gray-700"
            >
              Subcategory *
            </label>
            <select
              id="subcategory"
              value={subcategory}
              onChange={handleSubcategoryChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!category}
            >
              <option value="" disabled>
                {category ? "Select a subcategory" : "Select a category first"}
              </option>
              {category &&
                categories[category as keyof typeof categories].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>
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
                      typeof preview === "string" && preview.startsWith("blob:")
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
