"use client";

import { useRouter } from "next/navigation";
import { ProfileHeader, ProfileTab } from "./ProfileHeader";
import { ProfileListingsTab } from "./ProfileListingsTab";
import { ProfileReviewsTab } from "./ProfileReviewsTab";
import type { ProfileResponse } from "@/lib/api/profile";

interface ProfilePageContentProps {
  profile: ProfileResponse | null;
  fullName: string;
  location: string | null;
  memberSince: string;
  profileImageUrl: string;
  bannerImageUrl: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  loading: boolean;
  error: string | null;
  isCurrentUserProfile?: boolean;
}

export function ProfilePageContent({
  profile,
  fullName,
  location,
  memberSince,
  profileImageUrl,
  bannerImageUrl,
  activeTab,
  onTabChange,
  loading,
  error,
  isCurrentUserProfile = false,
}: ProfilePageContentProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <div className="flex items-center justify-center pt-32">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
        <div className="flex flex-col items-center justify-center pt-32 gap-4 px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Profile Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error ||
                (isCurrentUserProfile
                  ? "You haven't created a profile yet. Create one to get started with SwapStreet!"
                  : "This seller profile is not available.")}
            </p>
            {isCurrentUserProfile && (
              <button
                onClick={() => router.push("/seller/onboarding")}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium"
              >
                Create Profile
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-8">
      <ProfileHeader
        profile={profile}
        fullName={fullName}
        location={location}
        memberSince={memberSince}
        profileImageUrl={profileImageUrl}
        bannerImageUrl={bannerImageUrl}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showEditProfile={isCurrentUserProfile}
      />

      <div className="mt-6">
        {activeTab === "listings" && (
          <ProfileListingsTab
            sellerId={profile.id}
            isCurrentUserProfile={isCurrentUserProfile}
          />
        )}
        {activeTab === "reviews" && (
          <ProfileReviewsTab profileId={profile.id} />
        )}
      </div>
    </div>
  );
}
