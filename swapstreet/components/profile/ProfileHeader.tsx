"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Pencil, MapPin, CalendarDays, BadgeCheck } from "lucide-react";
import type { ProfileResponse } from "@/lib/api/profile";

export type ProfileTab = "listings" | "friends" | "reviews";

interface ProfileHeaderProps {
  profile: ProfileResponse;
  fullName: string;
  location: string | null;
  memberSince: string;
  profileImageUrl: string;
  bannerImageUrl: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function ProfileHeader({
  profile,
  fullName,
  location,
  memberSince,
  profileImageUrl,
  bannerImageUrl,
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Banner Image */}
      <div className="relative h-48 sm:h-64 bg-gray-200">
        <Image
          src={bannerImageUrl}
          alt="Profile Banner"
          fill
          className="object-cover"
          unoptimized={bannerImageUrl.startsWith("blob:")}
        />
      </div>

      {/* Profile Info Container */}
      <div className="relative px-6 pb-0">
        {/* Profile Picture */}
        <div className="relative -mt-16 mb-3">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg">
            <Image
              src={profileImageUrl}
              alt={fullName}
              fill
              className="object-cover"
              unoptimized={profileImageUrl.startsWith("blob:")}
            />
          </div>
        </div>

        {/* Name, Rating and Edit button */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {fullName}
              </h1>
              {/* TODO: NO FEATURE TO VERIFY USERS YET */}
              <BadgeCheck
                className={`h-6 w-6 shrink-0 ${profile.verifiedSeller ? "text-teal-500" : "text-gray-300"}`}
                aria-label={
                  profile.verifiedSeller ? "Verified seller" : "Not verified"
                }
              />
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.floor(profile.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                ({profile.rating.toFixed(1)})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Member since {memberSince}
              </span>
            </div>
            {profile.bio && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push("/seller/profile/edit")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 mt-2">
          {(["listings", "friends", "reviews"] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors focus:outline-none ${
                activeTab === tab
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
