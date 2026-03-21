"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/common/Header";
import { getProfileById, ProfileResponse } from "@/lib/api/profile";
import { ProfilePageContent } from "@/components/profile/ProfilePageContent";
import type { ProfileTab } from "@/components/profile/ProfileHeader";

export default function SellerProfilePage() {
  const params = useParams<{ id: string }>();
  const sellerId = params?.id;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("listings");

  useEffect(() => {
    if (!sellerId) {
      setError("Seller not found.");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    getProfileById(sellerId)
      .then((data) => {
        if (mounted) {
          setProfile(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (mounted) {
          const msg =
            e instanceof Error ? e.message : "Failed to load seller profile.";
          setError(msg);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [sellerId]);

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : "Seller";
  const location = profile?.cityName
    ? `${profile.cityName}${profile.provinceCode ? `, ${profile.provinceCode}` : ""}`
    : null;
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
      })
    : "Unknown";
  const profileImageUrl = profile?.profileImagePath
    ? profile.profileImagePath
    : "/images/default-avatar-icon.jpg";
  const bannerImageUrl = profile?.bannerImagePath
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
        loading={isLoading}
        error={error}
        isCurrentUserProfile={false}
      />
    </div>
  );
}
