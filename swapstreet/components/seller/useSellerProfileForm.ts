"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { uploadImage, City, Province } from "@/lib/api/profile";
import { logger } from "@/components/common/logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const FSA_REGEX = /^[A-Za-z]\d[A-Za-z]$/;
const MINIO_URL =
  process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000/public";

export interface SellerProfileFormPayload {
  firstName: string;
  lastName: string;
  bio?: string;
  cityId: number;
  fsa: string;
  profileImagePath?: string;
  bannerImagePath?: string;
}

export interface SellerProfileFormInitialValues {
  firstName: string;
  lastName: string;
  bio?: string;
  fsa: string;
  cityId: number;
  cityName?: string;
  provinceCode?: string;
  profileImagePath?: string;
  bannerImagePath?: string;
}

export interface UseSellerProfileFormOptions {
  mode: "create" | "edit";
  initialValues?: SellerProfileFormInitialValues | null;
  accessToken: string | null;
  refreshToken?: (() => Promise<string | null>) | null;
  onSubmit: (
    payload: SellerProfileFormPayload,
    accessToken: string,
  ) => Promise<void>;
  onSuccess?: () => void;
}

export function useSellerProfileForm({
  mode,
  initialValues,
  accessToken,
  refreshToken,
  onSubmit,
  onSuccess,
}: UseSellerProfileFormOptions) {
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
  const initialValuesSyncedRef = useRef(false);

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

  useEffect(() => {
    if (mode !== "edit" || !initialValues) {
      initialValuesSyncedRef.current = false;
      return;
    }
    if (initialValuesSyncedRef.current) return;
    initialValuesSyncedRef.current = true;
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setBio(initialValues.bio ?? "");
    setFsa(initialValues.fsa ?? "");
  }, [mode, initialValues]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`${API_URL}/location/provinces`);
        if (res.ok) setProvinces(await res.json());
      } catch (err) {
        logger.error("Failed to fetch provinces", err);
        setError("Failed to load location data. Please refresh the page.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (
      mode !== "edit" ||
      !initialValues?.provinceCode ||
      provinces.length === 0
    )
      return;
    const province = provinces.find((p) => p.code === initialValues.provinceCode);
    if (province) setSelectedProvinceId(province.id);
  }, [mode, initialValues?.provinceCode, provinces]);

  useEffect(() => {
    if (selectedProvinceId) {
      const fetchCities = async () => {
        try {
          const res = await fetch(
            `${API_URL}/location/cities?provinceId=${selectedProvinceId}`,
          );
          if (res.ok) setFilteredCities(await res.json());
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

  useEffect(() => {
    if (
      mode !== "edit" ||
      !initialValues ||
      filteredCities.length === 0 ||
      initialCityPreFilledRef.current
    )
      return;
    const match = filteredCities.find((c) => c.id === initialValues.cityId);
    if (match) {
      setSelectedCityId(initialValues.cityId);
      setCityInputValue(initialValues.cityName ?? match.name);
      initialCityPreFilledRef.current = true;
    }
  }, [mode, initialValues, filteredCities]);

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
        if (!tokenToUse) tokenToUse = (await refreshToken?.()) ?? null;
        if (!tokenToUse) {
          setError(
            mode === "create"
              ? "You must be logged in to create a profile."
              : "You must be logged in to update your profile.",
          );
          return;
        }

        let profileImagePath: string | undefined =
          mode === "edit" ? initialValues?.profileImagePath : undefined;
        let bannerImagePath: string | undefined =
          mode === "edit" ? initialValues?.bannerImagePath : undefined;

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

        await onSubmit(
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            bio: bio.trim() || undefined,
            cityId: selectedCityId,
            fsa: normalizedFsa,
            profileImagePath,
            bannerImagePath,
          },
          tokenToUse,
        );

        setShowSuccess(true);
        onSuccess?.();
      } catch (err) {
        logger.error(
          mode === "create" ? "Failed to create profile" : "Failed to update profile",
          err,
        );
        setError(
          err instanceof Error
            ? err.message
            : mode === "create"
              ? "Failed to create profile. Please try again."
              : "Failed to update profile.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      mode,
      firstName,
      lastName,
      bio,
      selectedCityId,
      fsa,
      avatarFile,
      bannerFile,
      initialValues?.profileImagePath,
      initialValues?.bannerImagePath,
      accessToken,
      refreshToken,
      onSubmit,
      onSuccess,
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

  const currentAvatarUrl =
    avatarPreview ||
    (mode === "edit" && initialValues?.profileImagePath
      ? `${MINIO_URL}/${initialValues.profileImagePath}`
      : "/images/default-avatar-icon.jpg");
  const currentBannerUrl =
    bannerPreview ||
    (mode === "edit" && initialValues?.bannerImagePath
      ? `${MINIO_URL}/${initialValues.bannerImagePath}`
      : "/images/default-seller-banner.png");

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    bio,
    setBio,
    fsa,
    setFsa,
    selectedProvinceId,
    setSelectedProvinceId,
    selectedCityId,
    setSelectedCityId,
    cityInputValue,
    setCityInputValue,
    cityDropdownOpen,
    setCityDropdownOpen,
    provinces,
    filteredCities,
    citiesFilteredByName,
    avatarFile,
    avatarPreview,
    bannerFile,
    bannerPreview,
    avatarInputRef,
    bannerInputRef,
    cropTarget,
    cropPreviewUrl,
    cropFile,
    handleAvatarChange,
    handleBannerChange,
    closeCropModal,
    handleCropConfirm,
    error,
    setError,
    loading,
    loadingData,
    showSuccess,
    handleSubmit,
    currentAvatarUrl,
    currentBannerUrl,
  };
}

export type UseSellerProfileFormReturn = ReturnType<typeof useSellerProfileForm>;
