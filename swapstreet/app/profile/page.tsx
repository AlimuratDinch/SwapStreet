"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile, ProfileResponse } from "@/lib/api/profile";
import { Header } from "@/components/common/Header";
import { ProfileHeader, ProfileTab } from "@/components/profile/ProfileHeader";
import { ProfileListingsTab } from "@/components/profile/ProfileListingsTab";
import { ProfileReviewsTab } from "@/components/profile/ProfileReviewsTab";

function ProfileSuccessToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (searchParams.get("updated") === "true") {
      setShowToast(true);
      router.replace("/profile");
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-xl bg-gray-100 px-5 py-3 text-black shadow-lg z-50 transition-all duration-500 ${
        showToast
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 shrink-0">
        <svg
          className="w-4 h-4 text-white"
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
      <span className="text-sm font-medium">Profile updated successfully!</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("listings");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setError("No access token available");
        setLoading(false);
        return;
      }

      try {
        const data = await getMyProfile(accessToken);
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load profile";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 gap-4 px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Profile Found
            </h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t created a profile yet. Create one to get started
              with SwapStreet!
            </p>
            <button
              onClick={() => router.push("/seller/onboarding")}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const location = profile.cityName
    ? `${profile.cityName}${
        profile.provinceCode ? `, ${profile.provinceCode}` : ""
      }`
    : null;
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
  });
  const profileImageUrl = profile.profileImagePath
    ? profile.profileImagePath
    : "/images/default-avatar-icon.jpg";
  const bannerImageUrl = profile.bannerImagePath
    ? profile.bannerImagePath
    : "/images/default-seller-banner.png";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />

      <div className="mx-auto max-w-6xl px-4 pt-24 pb-8">
        <ProfileHeader
          profile={profile}
          fullName={fullName}
          location={location}
          memberSince={memberSince}
          profileImageUrl={profileImageUrl}
          bannerImageUrl={bannerImageUrl}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-4">
          {activeTab === "listings" && <ProfileListingsTab />}
          {activeTab === "reviews" && <ProfileReviewsTab />}
        </div>
      </div>

      <Suspense fallback={null}>
        <ProfileSuccessToast />
      </Suspense>
    </div>
  );
}
