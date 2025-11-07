"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [condition, setCondition] = useState<string>("Good");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);


  // Check authentication and fetch categories
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("You must be logged in to create a listing.");
      // Optionally redirect to login after a delay
      setTimeout(() => router.push('/login'), 2000);
      return;
    }
    setAccessToken(token);

    // Fetch categories from backend
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/catalog/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please refresh the page.");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [router]);

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
    const selectedId = Number(e.target.value);
    const selectedCategory = categories.find(cat => cat.id === selectedId);
    
    setCategoryId(selectedId);
    setCategory(selectedCategory?.name || "");
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

    if (!condition) {
      setError("Please select a condition.");
      setIsSubmitting(false);
      return;
    }

    if (!images.length) {
      setError("Please upload at least one image.");
      setIsSubmitting(false);
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      setIsSubmitting(false);
      return;
    }

    try {
      // TODO: Upload images to MinIO first
      // For now, using a placeholder image URL
      const imageUrl = imagePreviews[0] || "https://via.placeholder.com/400";

      // Create listing via backend API
      const response = await fetch("http://localhost:8080/api/catalog/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: Backend doesn't have auth middleware yet, but including for future
          ...(accessToken && { "Authorization": `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          condition: condition,
          price: price,
          imageUrl: imageUrl,
          categoryId: categoryId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create listing: ${response.statusText}`);
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
          : "Failed to save listing. Please try again."
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

        {/* Condition */}
        <div>
          <label
            htmlFor="condition"
            className="block text-sm font-medium text-gray-700"
          >
            Condition *
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="New">New - Never used, with tags</option>
            <option value="Like New">Like New - Excellent condition, barely used</option>
            <option value="Good">Good - Normal wear, no major flaws</option>
            <option value="Fair">Fair - Visible wear, some flaws</option>
            <option value="Poor">Poor - Significant wear or damage</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category *
          </label>
          <select
            id="category"
            value={categoryId || ""}
            onChange={handleCategoryChange}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoadingCategories}
          >
            <option value="" disabled>
              {isLoadingCategories ? "Loading categories..." : "Select a category"}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
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
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full rounded-lg object-cover ring-1 ring-gray-200"
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
