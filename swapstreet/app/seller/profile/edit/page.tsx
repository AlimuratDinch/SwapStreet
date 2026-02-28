"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getMyProfile,
  updateProfile,
  uploadImage,
  City,
  Province,
  ProfileResponse,
} from "@/lib/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/components/common/logger";
import ImageCropModal from "@/components/image/ImageCropModal";
import { Header } from "@/components/common/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const FSA_REGEX = /^[A-Za-z]\d[A-Za-z]$/;
const minioUrl =
  process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000/public";

export default function EditSellerProfilePage() {
  const router = useRouter();
  const { accessToken, refreshToken } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
    null,
  );
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [fsa, setFsa] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [cityInputValue, setCityInputValue] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(
    null,
  );
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string>("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const initialCityPreFilledRef = useRef(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const citiesFilteredByName = useMemo(
    () =>
      filteredCities.filter((c) =>
        c.name.toLowerCase().includes(cityInputValue.trim().toLowerCase()),
      ),
    [filteredCities, cityInputValue],
  );

  // Fetch profile and provinces on mount
  useEffect(() => {
    if (!accessToken) {
      setLoadingData(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [profileRes, provincesRes] = await Promise.all([
          getMyProfile(accessToken),
          fetch(`${API_URL}/location/provinces`).then((r) =>
            r.ok ? r.json() : [],
          ),
        ]);
        if (cancelled) return;
        setProfile(profileRes);
        setProvinces(provincesRes);
        setFirstName(profileRes.firstName);
        setLastName(profileRes.lastName);
        setBio(profileRes.bio ?? "");
        setFsa(profileRes.fsa ?? "");
        const province = provincesRes.find(
          (p: Province) => p.code === profileRes.provinceCode,
        );
        if (province) {
          setSelectedProvinceId(province.id);
        }
      } catch (err) {
        if (cancelled) return;
        logger.error("Failed to load profile or provinces", err);
        setError(
          err instanceof Error ? err.message : "Failed to load profile.",
        );
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      const fetchCities = async () => {
        try {
          const citiesRes = await fetch(
            `${API_URL}/location/cities?provinceId=${selectedProvinceId}`,
          );
          if (citiesRes.ok) {
            const citiesData = await citiesRes.json();
            setFilteredCities(citiesData);
          }
        } catch (err) {
          logger.error("Failed to fetch cities", err);
        }
      };
      fetchCities();
      setSelectedCityId(null);
      setCityInputValue("");
    } else {
      setFilteredCities([]);
      setSelectedCityId(null);
      setCityInputValue("");
    }
  }, [selectedProvinceId]);

  // Pre-fill city when cities for profile's province are loaded
  useEffect(() => {
    if (
      !profile ||
      filteredCities.length === 0 ||
      initialCityPreFilledRef.current
    )
      return;
    const match = filteredCities.find((c) => c.id === profile.cityId);
    if (match) {
      setSelectedCityId(profile.cityId);
      setCityInputValue(profile.cityName ?? match.name);
      initialCityPreFilledRef.current = true;
    }
  }, [profile, filteredCities]);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Avatar must be an image file.");
        return;
      }
      setError("");
      if (cropPreviewUrl && cropTarget && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(cropPreviewUrl);
      setCropFile(file);
      setCropPreviewUrl(URL.createObjectURL(file));
      setCropTarget("avatar");
    },
    [cropPreviewUrl, cropTarget],
  );

  const handleBannerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Banner must be an image file.");
        return;
      }
      setError("");
      if (cropPreviewUrl && cropTarget && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(cropPreviewUrl);
      setCropFile(file);
      setCropPreviewUrl(URL.createObjectURL(file));
      setCropTarget("banner");
    },
    [cropPreviewUrl, cropTarget],
  );

  const closeCropModal = useCallback(() => {
    if (cropPreviewUrl && typeof URL.revokeObjectURL === "function")
      URL.revokeObjectURL(cropPreviewUrl);
    setCropTarget(null);
    setCropFile(null);
    setCropPreviewUrl("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }, [cropPreviewUrl]);

  const handleCropConfirm = useCallback(
    (file: File) => {
      if (!cropTarget) return;
      const previewUrl = URL.createObjectURL(file);
      if (cropTarget === "avatar") {
        if (avatarPreview && typeof URL.revokeObjectURL === "function")
          URL.revokeObjectURL(avatarPreview);
        setAvatarFile(file);
        setAvatarPreview(previewUrl);
      } else {
        if (bannerPreview && typeof URL.revokeObjectURL === "function")
          URL.revokeObjectURL(bannerPreview);
        setBannerFile(file);
        setBannerPreview(previewUrl);
      }
      if (cropPreviewUrl && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(cropPreviewUrl);
      setCropTarget(null);
      setCropFile(null);
      setCropPreviewUrl("");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    },
    [cropTarget, cropPreviewUrl, avatarPreview, bannerPreview],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
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
        const normalizedFsa = fsa.trim().toUpperCase();
        if (!normalizedFsa) {
          setError("FSA is required.");
          return;
        }
        if (!FSA_REGEX.test(normalizedFsa)) {
          setError("Please enter a valid FSA (e.g., M5V).");
          return;
        }

        let tokenToUse = accessToken;
        if (!tokenToUse) tokenToUse = await refreshToken?.() ?? null;
        if (!tokenToUse) {
          setError("You must be logged in to update your profile.");
          return;
        }

        let profileImagePath: string | undefined = profile?.profileImagePath;
        let bannerImagePath: string | undefined = profile?.bannerImagePath;

        if (avatarFile) {
          profileImagePath = await uploadImage(
            tokenToUse,
            avatarFile,
            "Profile",
            refreshToken ?? undefined,
          );
        }
        if (bannerFile) {
          bannerImagePath = await uploadImage(
            tokenToUse,
            bannerFile,
            "Banner",
            refreshToken ?? undefined,
          );
        }

        await updateProfile(tokenToUse, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim() || undefined,
          cityId: selectedCityId,
          fsa: normalizedFsa,
          profileImagePath,
          bannerImagePath,
        });

        setShowSuccess(true);
        setTimeout(() => router.push("/profile"), 1500);
      } catch (err) {
        logger.error("Failed to update profile", err);
        setError(
          err instanceof Error ? err.message : "Failed to update profile.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      firstName,
      lastName,
      bio,
      selectedCityId,
      fsa,
      avatarFile,
      bannerFile,
      profile,
      accessToken,
      refreshToken,
      router,
    ],
  );

  useEffect(() => {
    return () => {
      if (avatarPreview && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(avatarPreview);
      if (bannerPreview && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(bannerPreview);
      if (cropPreviewUrl && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(cropPreviewUrl);
    };
  }, [avatarPreview, bannerPreview, cropPreviewUrl]);

  if (!accessToken) {
    router.replace("/profile");
    return null;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 gap-4 px-4">
          <p className="text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-lg bg-teal-500 px-4 py-2 text-white hover:bg-teal-600"
          >
            Back to profile
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
        style={{ backgroundColor: "#eae9ea" }}
      >
        <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-10 shadow-lg border border-gray-200">
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-40" />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-teal-500">
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-900">Profile updated!</p>
          <p className="text-sm text-gray-500">Taking you back to your profile...</p>
        </div>
      </div>
    );
  }

  const currentAvatarUrl = avatarPreview
    ? avatarPreview
    : profile?.profileImagePath
      ? `${minioUrl}/${profile.profileImagePath}`
      : "/images/default-avatar-icon.jpg";
  const currentBannerUrl = bannerPreview
    ? bannerPreview
    : profile?.bannerImagePath
      ? `${minioUrl}/${profile.bannerImagePath}`
      : "/images/default-seller-banner.png";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />
      <ImageCropModal
        open={!!(cropTarget && cropPreviewUrl)}
        imageUrl={cropPreviewUrl}
        aspect={cropTarget === "avatar" ? 1 : 3}
        cropShape={cropTarget === "avatar" ? "round" : "rect"}
        onConfirm={handleCropConfirm}
        onCancel={closeCropModal}
        onError={setError}
        sourceFileName={cropFile?.name}
      />

      <div className="mx-auto max-w-3xl px-4 pt-24 pb-10">
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit your seller profile
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your details below. Changes are saved when you click Save changes.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
        >
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="edit-first-name" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                type="text"
                id="edit-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="edit-last-name" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                type="text"
                id="edit-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="edit-province" className="block text-sm font-medium text-gray-700">
                Province
              </label>
              <select
                id="edit-province"
                value={selectedProvinceId ?? ""}
                onChange={(e) =>
                  setSelectedProvinceId(
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
            <div className="relative">
              <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="edit-city"
                value={cityInputValue}
                onChange={(e) => {
                  setCityInputValue(e.target.value);
                  setCityDropdownOpen(true);
                }}
                onFocus={() => selectedProvinceId && setCityDropdownOpen(true)}
                onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                placeholder={
                  selectedProvinceId
                    ? "Type to search city..."
                    : "Select province first"
                }
                disabled={loading || !selectedProvinceId}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                autoComplete="off"
              />
              {cityDropdownOpen && selectedProvinceId && (
                <ul
                  className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  role="listbox"
                >
                  {citiesFilteredByName.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      No matching city
                    </li>
                  ) : (
                    citiesFilteredByName.map((c) => (
                      <li
                        key={c.id}
                        role="option"
                        aria-selected={selectedCityId === c.id}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedCityId(c.id);
                          setCityInputValue(c.name);
                          setCityDropdownOpen(false);
                        }}
                      >
                        {c.name}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            <div>
              <label htmlFor="edit-fsa" className="block text-sm font-medium text-gray-700">
                FSA
              </label>
              <input
                type="text"
                id="edit-fsa"
                value={fsa}
                onChange={(e) => setFsa(e.target.value.toUpperCase())}
                placeholder="A1A"
                maxLength={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What makes your mini shop special?"
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="edit-avatar" className="block text-sm font-medium text-gray-700">
                Avatar image
              </label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                id="edit-avatar"
                onChange={handleAvatarChange}
                className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-white hover:file:bg-teal-600"
              />
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAvatarUrl}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover ring-1 ring-gray-200"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-banner" className="block text-sm font-medium text-gray-700">
                Banner image
              </label>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                id="edit-banner"
                onChange={handleBannerChange}
                className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-white hover:file:bg-teal-600"
              />
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentBannerUrl}
                  alt="Banner"
                  className="h-24 w-full rounded-md object-cover ring-1 ring-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
