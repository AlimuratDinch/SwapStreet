"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [error, setError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview("");
      return;
    }
    // Basic client-side validation
    if (!file.type.startsWith("image/")) {
      setError("Avatar must be an image file.");
      return;
    }
    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setBannerFile(null);
      setBannerPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Banner must be an image file.");
      return;
    }
    setError("");
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Minimal validation
    if (!name.trim()) {
      setError("Please enter a display name.");
      return;
    }

    // TODO: Replace with proper implementation to upload files and save seller profile
    const payload = {
      name,
      location,
      bio,
      avatarFileName: avatarFile?.name ?? null,
      bannerFileName: bannerFile?.name ?? null,
    };
    console.log("Creating seller profile:", payload);

    // After save, navigate to home for now.
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Set up your seller profile</h1>
      <p className="mt-1 text-sm text-gray-600">Tell buyers a bit about you and your style. You can edit this later.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Alex Johnson"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your style and what you sell"
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Avatar image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary-color)] file:px-3 file:py-2 file:text-white hover:file:bg-[var(--primary-dark)]"
            />
            {avatarPreview && (
              <div className="mt-3">
                <img src={avatarPreview} alt="Avatar preview" className="h-24 w-24 rounded-full object-cover ring-1 ring-gray-200" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Banner image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary-color)] file:px-3 file:py-2 file:text-white hover:file:bg-[var(--primary-dark)]"
            />
            {bannerPreview && (
              <div className="mt-3">
                <img src={bannerPreview} alt="Banner preview" className="h-24 w-full rounded-md object-cover ring-1 ring-gray-200" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Skip for now
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
          >
            Save and continue
          </button>
        </div>
      </form>
    </div>
  );
}
