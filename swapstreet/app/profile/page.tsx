"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile, ProfileResponse } from "@/lib/api/profile";
import { Header } from "@/app/browse/BrowseElements";
import { Phone, Mail, MapPin, Star } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const {  accessToken } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
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
              You haven't created a profile yet. Create one to get started with SwapStreet!
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
    ? `${profile.cityName}, ${profile.provinceCode || ""}`
    : "Location not set";

  // Generate MinIO URL for images
  const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000/public";
  const profileImageUrl = profile.profileImagePath
    ? `${minioUrl}/${profile.profileImagePath}`
    : "/images/default-avatar-icon.jpg";
  const bannerImageUrl = profile.bannerImagePath
    ? `${minioUrl}/${profile.bannerImagePath}`
    : "/images/default-seller-banner.png";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eae9ea" }}>
      <Header />
      
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-8">
        {/* Banner and Profile Section */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          {/* Banner Image */}
          <div className="relative h-48 sm:h-64 bg-gray-200">
            <Image
              src={bannerImageUrl}
              alt="Profile Banner"
              fill
              className="object-cover"
              unoptimized={typeof bannerImageUrl === "string" && bannerImageUrl.startsWith("blob:")}
            />
          </div>

          {/* Profile Info Container */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="relative -mt-16 mb-4">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <Image
                  src={profileImageUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                  unoptimized={typeof profileImageUrl === "string" && profileImageUrl.startsWith("blob:")}
                />
              </div>
            </div>

            {/* Name and Rating */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                {fullName}
              </h1>
              <div className="flex items-center gap-1">
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
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <Phone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">Not available</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">Not available</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <MapPin className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">{location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section - Placeholder */}
        <div className="mt-6 rounded-xl bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Listings</h2>
          <div className="text-center py-12 text-gray-500">
            <p>Your listings will appear here</p>
            <p className="text-sm mt-2">Listing functionality coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
