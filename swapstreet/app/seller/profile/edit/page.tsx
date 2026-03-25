"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile, updateProfile } from "@/lib/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/components/common/logger";
import { Header } from "@/components/common/Header";
import { useSellerProfileForm } from "@/components/seller/useSellerProfileForm";
import { SellerProfileForm } from "@/components/seller/SellerProfileForm";
import type { ProfileResponse } from "@/lib/api/profile";

export default function EditSellerProfilePage() {
  const router = useRouter();
  const { accessToken, refreshToken } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    getMyProfile(accessToken)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("Failed to load profile", err);
          setProfileError(
            err instanceof Error ? err.message : "Failed to load profile.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const form = useSellerProfileForm({
    mode: "edit",
    initialValues: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          bio: profile.bio,
          fsa: profile.fsa,
          cityId: profile.cityId,
          cityName: profile.cityName,
          provinceCode: profile.provinceCode,
          profileImagePath: profile.profileImagePath,
          bannerImagePath: profile.bannerImagePath,
        }
      : null,
    accessToken,
    refreshToken,
    onSubmit: async (payload, token) => {
      await updateProfile(token, payload);
    },
    onSuccess: () => {
      router.push("/profile?updated=true");
    },
  });

  const { loadingData } = form;

  if (!accessToken) {
    router.replace("/profile");
    return null;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 gap-4 px-4">
          <p className="text-gray-600">{profileError}</p>
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

  if (profile && loadingData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-10">
        <SellerProfileForm
          {...form}
          idPrefix="edit"
          title="Edit your profile"
          subtitle="Update your details below. Changes are saved when you click Save changes."
          submitLabel={form.loading ? "Saving..." : "Save changes"}
          cancelButton={{
            label: "Cancel",
            onClick: () => router.push("/profile"),
          }}
        />
      </div>
    </div>
  );
}
