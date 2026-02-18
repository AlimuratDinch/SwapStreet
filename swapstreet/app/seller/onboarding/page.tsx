"use client";
export const dynamic = "force-dynamic";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import nextDynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Area } from "react-easy-crop";
import { createProfile, uploadImage, City, Province } from "@/lib/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/components/common/logger";

const Cropper = nextDynamic(
  () => import("react-easy-crop").then((mod) => mod.default),
  { ssr: false },
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const FSA_REGEX = /^[A-Za-z]\d[A-Za-z]$/;
const POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

/** Produce a cropped image blob from image URL and crop area in pixels (natural image coords). */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context not available");
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

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

  // City combobox: user types to filter
  const [cityInputValue, setCityInputValue] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Image crop: after file pick, show crop UI before setting avatar/banner
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(
    null,
  );
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string>("");
  const [cropZoom, setCropZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropAreaPixels, setCropAreaPixels] = useState<Area | null>(null);
  const [cropConfirming, setCropConfirming] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Client-side filter cities by name (for combobox)
  const citiesFilteredByName = useMemo(
    () =>
      filteredCities.filter((c) =>
        c.name.toLowerCase().includes(cityInputValue.trim().toLowerCase()),
      ),
    [filteredCities, cityInputValue],
  );

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesUrl = `${API_URL}/location/provinces`;

        const provincesRes = await fetch(provincesUrl);

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
          const citiesUrl = `${API_URL}/location/cities?provinceId=${selectedProvinceId}`;

          const citiesRes = await fetch(citiesUrl);

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
      setSelectedCityId(null);
      setCityInputValue("");
    } else {
      setFilteredCities([]);
      setSelectedCityId(null);
      setCityInputValue("");
    }
  }, [selectedProvinceId]);

  // Open crop step for avatar (any image size; user adjusts crop/zoom)
  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Avatar must be an image file.");
        return;
      }
      setError("");
      if (cropPreviewUrl && cropTarget) {
        if (typeof URL.revokeObjectURL === "function")
          URL.revokeObjectURL(cropPreviewUrl);
      }
      setCropFile(file);
      setCropPreviewUrl(URL.createObjectURL(file));
      setCropTarget("avatar");
      setCropZoom(1);
      setCrop({ x: 0, y: 0 });
      setCropAreaPixels(null);
    },
    [cropPreviewUrl, cropTarget],
  );

  // Open crop step for banner (any image size; user adjusts crop/zoom)
  const handleBannerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Banner must be an image file.");
        return;
      }
      setError("");
      if (cropPreviewUrl && cropTarget) {
        if (typeof URL.revokeObjectURL === "function")
          URL.revokeObjectURL(cropPreviewUrl);
      }
      setCropFile(file);
      setCropPreviewUrl(URL.createObjectURL(file));
      setCropTarget("banner");
      setCropZoom(1);
      setCrop({ x: 0, y: 0 });
      setCropAreaPixels(null);
    },
    [cropPreviewUrl, cropTarget],
  );

  // Close crop modal (Cancel): revoke URL and clear crop state
  const closeCropModal = useCallback(() => {
    if (cropPreviewUrl && typeof URL.revokeObjectURL === "function")
      URL.revokeObjectURL(cropPreviewUrl);
    setCropTarget(null);
    setCropFile(null);
    setCropPreviewUrl("");
    setCropAreaPixels(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }, [cropPreviewUrl]);

  // Confirm crop: produce cropped blob, set avatar/banner file and preview, close modal
  const handleCropConfirm = useCallback(async () => {
    if (!cropTarget || !cropFile || !cropPreviewUrl) return;
    const pixels = cropAreaPixels;
    if (!pixels) {
      setError("Adjust the crop area and try again.");
      return;
    }
    setCropConfirming(true);
    setError("");
    try {
      const blob = await getCroppedImg(cropPreviewUrl, pixels);
      const fileName = cropFile.name.replace(/\.[^.]+$/, "") || "cropped";
      const file = new File([blob], `${fileName}.jpg`, {
        type: "image/jpeg",
      });
      const previewUrl = URL.createObjectURL(blob);
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
      if (typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(cropPreviewUrl);
      setCropTarget(null);
      setCropFile(null);
      setCropPreviewUrl("");
      setCropAreaPixels(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    } catch (err) {
      logger.error("Crop failed", err);
      setError("Failed to crop image. Please try another image.");
    } finally {
      setCropConfirming(false);
    }
  }, [
    cropTarget,
    cropFile,
    cropPreviewUrl,
    cropAreaPixels,
    avatarPreview,
    bannerPreview,
  ]);

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

        setShowSuccess(true);
        setTimeout(() => router.push("/profile"), 2200);
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
      if (cropPreviewUrl && typeof URL.revokeObjectURL === "function")
        URL.revokeObjectURL(cropPreviewUrl);
    };
  }, [avatarPreview, bannerPreview, cropPreviewUrl]);

  // Render form with inputs for profile details and image uploads
  if (loadingData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success overlay: toast + checkmark animation, then redirect
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
                className="w-8 h-8 text-white onboarding-success-check"
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
          <p className="text-lg font-medium text-gray-900">Profile created!</p>
          <p className="text-sm text-gray-500">Taking you to your profile...</p>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .onboarding-success-check { stroke-dasharray: 28; stroke-dashoffset: 28; animation: onboardingDrawCheck 0.5s ease-out 0.3s forwards; }
          @keyframes onboardingDrawCheck { to { stroke-dashoffset: 0; } }
        `,
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      {/* Image crop modal: adjust crop/zoom then confirm */}
      {cropTarget && cropPreviewUrl && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-gray-900">
          <div className="flex-1 relative min-h-0">
            <Cropper
              image={cropPreviewUrl}
              crop={crop}
              zoom={cropZoom}
              rotation={0}
              aspect={cropTarget === "avatar" ? 1 : 3}
              onCropChange={setCrop}
              onZoomChange={setCropZoom}
              onCropComplete={(_area: Area, pixels: Area) =>
                setCropAreaPixels(pixels)
              }
              onCropAreaChange={(_area: Area, pixels: Area) =>
                setCropAreaPixels(pixels)
              }
              minZoom={1}
              maxZoom={3}
              cropShape={cropTarget === "avatar" ? "round" : "rect"}
              showGrid={cropTarget !== "avatar"}
              zoomSpeed={1}
              restrictPosition
              keyboardStep={0.1}
              style={{
                containerStyle: { backgroundColor: "inherit" },
              }}
              classes={{
                containerClassName: "rounded-none",
              }}
              mediaProps={{}}
              cropperProps={{}}
            />
          </div>
          <div className="flex-shrink-0 p-4 bg-gray-900 border-t border-gray-700 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-600 accent-teal-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCropModal}
                disabled={cropConfirming}
                className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={cropConfirming || !cropAreaPixels}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cropConfirming ? "Applying…" : "Apply crop"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">
          Set up your seller profile
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tell buyers a bit about you and your style. You can edit this later.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                type="text"
                id="city"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                id="avatar"
                onChange={handleAvatarChange}
                className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-white hover:file:bg-teal-600"
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
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                id="banner"
                onChange={handleBannerChange}
                className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500 file:px-3 file:py-2 file:text-white hover:file:bg-teal-600"
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
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating profile..." : "Save and continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
