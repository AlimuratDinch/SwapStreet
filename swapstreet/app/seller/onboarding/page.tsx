"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProfile, uploadImage, City, Province } from "@/lib/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/components/common/logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const FSA_REGEX = /^[A-Za-z]\d[A-Za-z]$/;
const POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, refreshToken } = useAuth();

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
    null,
  );
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  // Data from backend
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesRes = await fetch(`${API_URL}/api/location/provinces`);

        if (provincesRes.ok) {
          const provincesData = await provincesRes.json();
          setProvinces(provincesData);
        }
      } catch (err) {
        logger.error("Failed to fetch provinces", err);
        setError("Failed to load location data. Please refresh the page.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      const fetchCities = async () => {
        try {
          const citiesRes = await fetch(
            `${API_URL}/api/location/cities?provinceId=${selectedProvinceId}`,
          );

          if (citiesRes.ok) {
            const citiesData = await citiesRes.json();
            setFilteredCities(citiesData);
          }
        } catch (err) {
          logger.error("Failed to fetch cities", err);
          setError("Failed to load cities. Please try again.");
        }
      };

      fetchCities();
      setSelectedCityId(null); // Reset city selection when province changes
    } else {
      setFilteredCities([]);
      setSelectedCityId(null);
    }
  }, [selectedProvinceId]);

  // File input change handlers (validate image and create preview URL)
  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) {
        setAvatarFile(null);
        if (avatarPreview && typeof URL.revokeObjectURL === "function")
          URL.revokeObjectURL(avatarPreview);
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
      if (avatarPreview && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(avatarPreview);
      const nextUrl = URL.createObjectURL(file);
      setAvatarPreview(nextUrl);
    },
    [avatarPreview],
  );

  const handleBannerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) {
        setBannerFile(null);
        if (bannerPreview && typeof URL.revokeObjectURL === "function")
          URL.revokeObjectURL(bannerPreview);
        setBannerPreview("");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Banner must be an image file.");
        return;
      }
      setError("");
      setBannerFile(file);
      if (bannerPreview && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(bannerPreview);
      const nextUrl = URL.createObjectURL(file);
      setBannerPreview(nextUrl);
    },
    [bannerPreview],
  );

  // Submit handler: validate inputs, upload images, create profile via API
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        // Validation
        if (!firstName.trim()) {
          setError("Please enter your first name.");
          return;
        }
        if (!lastName.trim()) {
          setError("Please enter your last name.");
          return;
        }
        if (!selectedCityId) {
          setError("Please select a city.");
          return;
        }

        // Extract FSA from postal code (first 3 characters)
        let fsa = "";
        if (postalCode) {
          if (!POSTAL_REGEX.test(postalCode.trim())) {
            setError(
              "Please enter a valid Canadian postal code (e.g., A1A 1A1).",
            );
            return;
          }
          // Extract first 3 characters and remove spaces
          fsa = postalCode
            .trim()
            .replace(/\s|-/g, "")
            .substring(0, 3)
            .toUpperCase();
          if (!FSA_REGEX.test(fsa)) {
            setError("Invalid postal code format.");
            return;
          }
        } else {
          setError(
            "Postal code is required to determine your Forward Sortation Area (FSA).",
          );
          return;
        }

        // Ensure we have an access token (attempt refresh once if missing)
        let tokenToUse = accessToken;
        if (!tokenToUse) {
          tokenToUse = await refreshToken();
        }
        if (!tokenToUse) {
          setError("You must be logged in to create a profile.");
          return;
        }

        // Upload images if provided
        let profileImagePath: string | undefined;
        let bannerImagePath: string | undefined;

        if (avatarFile) {
          profileImagePath = await uploadImage(
            tokenToUse,
            avatarFile,
            "Profile",
            refreshToken,
          );
        }

        if (bannerFile) {
          bannerImagePath = await uploadImage(
            tokenToUse,
            bannerFile,
            "Banner",
            refreshToken,
          );
        }

        // Create profile
        const profileData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim() || undefined,
          cityId: selectedCityId!, // Non-null assertion since we validated above
          fsa: fsa,
          profileImagePath,
          bannerImagePath,
        };

        logger.debug("Profile data being sent", { profileData });
        await createProfile(tokenToUse, profileData, refreshToken);

        // Redirect to profile page
        router.push("/profile");
      } catch (err: unknown) {
        logger.error("Failed to create profile", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create profile. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      firstName,
      lastName,
      bio,
      selectedCityId,
      postalCode,
      avatarFile,
      bannerFile,
      router,
      accessToken,
      refreshToken,
    ],
  );

  // Cleanup any created object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(avatarPreview);
      if (bannerPreview && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, bannerPreview]);

  // Render form with inputs for profile details and image uploads
  if (loadingData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
        {!accessToken && !isAuthenticated && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
            It looks like you're not signed in. If you're already signed, try
            refreshing this page.
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="first-name"
              className="block text-sm font-medium text-gray-700"
            >
              First name
            </label>
            <input
              type="text"
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="last-name"
              className="block text-sm font-medium text-gray-700"
            >
              Last name
            </label>
            <input
              type="text"
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="province"
              className="block text-sm font-medium text-gray-700"
            >
              Province
            </label>
            <select
              id="province"
              value={selectedProvinceId || ""}
              onChange={(e) =>
                setSelectedProvinceId(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
              disabled={loading}
            >
              <option value="" disabled>
                Select province
              </option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              City
            </label>
            <select
              id="city"
              value={selectedCityId || ""}
              onChange={(e) =>
                setSelectedCityId(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
              disabled={loading || !selectedProvinceId}
            >
              <option value="" disabled>
                {selectedProvinceId ? "Select city" : "Select province first"}
              </option>
              {filteredCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="postal-code"
              className="block text-sm font-medium text-gray-700"
            >
              Postal code
            </label>
            <input
              type="text"
              id="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              placeholder="A1A 1A1"
              maxLength={7}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
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
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-gray-700"
            >
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-24 w-24 rounded-full object-cover ring-1 ring-gray-200"
                />
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="banner"
              className="block text-sm font-medium text-gray-700"
            >
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
            disabled={loading}
            className="rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating profile..." : "Save and continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
