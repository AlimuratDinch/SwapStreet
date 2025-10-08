"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
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
    if (!city.trim()) {
      setError("Please enter your city.");
      return;
    }
    if (!province) {
      setError("Please select a province.");
      return;
    }

    // Postal code optional, but if provided validate Canadian format (A1A 1A1 or A1A1A1)
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (postalCode && !postalRegex.test(postalCode.trim())) {
      setError("Please enter a valid Canadian postal code (e.g., A1A 1A1).");
      return;
    }

    // TODO: Replace with proper implementation to upload files and save seller profile
    try {
      const location = `${city.trim()}, ${province}${postalCode ? ", " + postalCode.trim().toUpperCase() : ""}`;
      const data = {
        name,
        location,
        city: city.trim(),
        province,
        postalCode: postalCode.trim().toUpperCase() || null,
        bio,
        avatarUrl: avatarPreview || null,
        bannerUrl: bannerPreview || null,
        timestamp: Date.now(),
      };
      localStorage.setItem("seller:me", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to cache onboarding data", err);
    }

    // Redirect user to their profile page
    router.push("/seller/me?init=1");
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
            placeholder="What should we call you in the wild world of SwapStreet?"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Province</label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
            >
              <option value="" disabled>
                Select a province/territory
              </option>
              <option value="AB">Alberta (AB)</option>
              <option value="BC">British Columbia (BC)</option>
              <option value="MB">Manitoba (MB)</option>
              <option value="NB">New Brunswick (NB)</option>
              <option value="NL">Newfoundland and Labrador (NL)</option>
              <option value="NS">Nova Scotia (NS)</option>
              <option value="NT">Northwest Territories (NT)</option>
              <option value="NU">Nunavut (NU)</option>
              <option value="ON">Ontario (ON)</option>
              <option value="PE">Prince Edward Island (PE)</option>
              <option value="QC">Quebec (QC)</option>
              <option value="SK">Saskatchewan (SK)</option>
              <option value="YT">Yukon (YT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal code (optional)</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              placeholder="A1A 1A1"
              maxLength={7}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={`Brag a little! What makes your mini shop special? \nShare your style and what you sell!`}
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
