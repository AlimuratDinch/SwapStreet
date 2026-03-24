"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile, ProfileResponse } from "@/lib/api/profile";
import { Header } from "@/components/common/Header";
import { ProfilePageContent } from "@/components/profile/ProfilePageContent";
import type { ProfileTab } from "@/components/profile/ProfileHeader";

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
        <ProfilePageContent
          profile={null}
          fullName=""
          location={null}
          memberSince=""
          profileImageUrl=""
          bannerImageUrl=""
          activeTab="listings"
          onTabChange={() => {}}
          loading={true}
          error={null}
          isCurrentUserProfile={true}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <Header />
        <ProfilePageContent
          profile={null}
          fullName=""
          location={null}
          memberSince=""
          profileImageUrl=""
          bannerImageUrl=""
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loading={false}
          error={error}
          isCurrentUserProfile={true}
        />
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const location = profile.cityName
    ? `${profile.cityName}${profile.provinceCode ? `, ${profile.provinceCode}` : ""}`
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

      <ProfilePageContent
        profile={profile}
        fullName={fullName}
        location={location}
        memberSince={memberSince}
        profileImageUrl={profileImageUrl}
        bannerImageUrl={bannerImageUrl}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={false}
        error={null}
        isCurrentUserProfile={true}
      />

      <Suspense fallback={null}>
        <ProfileSuccessToast />
      </Suspense>
    </div>
  );
}
