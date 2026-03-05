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
      setTimeout(() => router.push("/profile"), 1500);
    },
  });

  const { loadingData, showSuccess } = form;

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
          <p className="text-sm text-gray-500">
            Taking you back to your profile...
          </p>
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
          title="Edit your seller profile"
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
