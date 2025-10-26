"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PROVINCES: { label: string; value: string }[] = [
  { label: "Alberta (AB)", value: "AB" },
  { label: "British Columbia (BC)", value: "BC" },
  { label: "Manitoba (MB)", value: "MB" },
  { label: "New Brunswick (NB)", value: "NB" },
  { label: "Newfoundland and Labrador (NL)", value: "NL" },
  { label: "Nova Scotia (NS)", value: "NS" },
  { label: "Northwest Territories (NT)", value: "NT" },
  { label: "Nunavut (NU)", value: "NU" },
  { label: "Ontario (ON)", value: "ON" },
  { label: "Prince Edward Island (PE)", value: "PE" },
  { label: "Quebec (QC)", value: "QC" },
  { label: "Saskatchewan (SK)", value: "SK" },
  { label: "Yukon (YT)", value: "YT" },
];

const POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

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

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
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
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const nextUrl = URL.createObjectURL(file);
    setAvatarPreview(nextUrl);
  }, [avatarPreview]);

  const handleBannerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setBannerFile(null);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerPreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Banner must be an image file.");
      return;
    }
    setError("");
    setBannerFile(file);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    const nextUrl = URL.createObjectURL(file);
    setBannerPreview(nextUrl);
  }, [bannerPreview]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
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
    if (postalCode && !POSTAL_REGEX.test(postalCode.trim())) {
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
  }, [name, city, province, postalCode, bio, avatarPreview, bannerPreview, router]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, bannerPreview]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">
        Set up your seller profile
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Tell buyers a bit about you and your style. You can edit this later.
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

        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
            Display name
          </label>
          <input
            type="text"
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you in the wild world of SwapStreet?"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
            />
          </div>
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Province
            </label>
            <select
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
            >
              <option value="" disabled>
                Select a province/territory
              </option>
              {PROVINCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">
              Postal code (optional)
            </label>
            <input
              type="text"
              id="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              placeholder="A1A 1A1"
              maxLength={7}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={`Brag a little! What makes your mini shop special? \nShare your style and what you sell!`}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
              Avatar image
            </label>
            <input
              type="file"
              accept="image/*"
              id="avatar"
              onChange={handleAvatarChange}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary-color)] file:px-3 file:py-2 file:text-white hover:file:bg-[var(--primary-dark)]"
            />
            {avatarPreview && (
              <div className="mt-3">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-24 w-24 rounded-full object-cover ring-1 ring-gray-200"
                />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="banner" className="block text-sm font-medium text-gray-700">
              Banner image
            </label>
            <input
              type="file"
              accept="image/*"
              id="banner"
              onChange={handleBannerChange}
              className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary-color)] file:px-3 file:py-2 file:text-white hover:file:bg-[var(--primary-dark)]"
            />
            {bannerPreview && (
              <div className="mt-3">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="h-24 w-full rounded-md object-cover ring-1 ring-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
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
