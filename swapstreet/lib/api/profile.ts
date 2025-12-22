// Profile API client functions

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface CreateProfileRequest {
  firstName: string;
  lastName: string;
  bio?: string;
  cityId: number;  // Changed from locationId to match backend
  fsa: string;
  profileImagePath?: string;
  bannerImagePath?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  locationId?: number;
  fsa?: string;
  profileImagePath?: string;
  bannerImagePath?: string;
  status?: "Online" | "Offline";
}

export interface ProfileResponse {
  id: string;
  status: string;
  verifiedSeller: boolean;
  firstName: string;
  lastName: string;
  rating: number;
  bio?: string;
  locationId: number;
  cityName?: string;
  provinceName?: string;
  provinceCode?: string;
  fsa: string;
  profileImagePath?: string;
  bannerImagePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: number;
  name: string;
  provinceId: number;
  province?: Province;
}

export interface Province {
  id: number;
  name: string;
  code: string;
}

/**
 * Get the authenticated user's profile
 */
export async function getMyProfile(
  accessToken: string,
): Promise<ProfileResponse> {
  const response = await fetch(`${API_URL}/api/profile/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ Error: "Failed to fetch profile" }));
    throw new Error(error.Error || "Failed to fetch profile");
  }

  return response.json();
}

/**
 * Get a user's profile by their ID (public)
 */
export async function getProfileById(userId: string): Promise<ProfileResponse> {
  const response = await fetch(`${API_URL}/api/profile/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ Error: "Profile not found" }));
    throw new Error(error.Error || "Profile not found");
  }

  return response.json();
}

/**
 * Create a profile for the authenticated user
 */
export async function createProfile(
  accessToken: string,
  data: CreateProfileRequest,
): Promise<ProfileResponse> {
  console.log("Creating profile with data:", data);
  
  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        Error: `HTTP error! status: ${response.status}` 
      }));
      console.error("Error response from server:", error);
      throw new Error(error.Error || "Failed to create profile");
    }

    return response.json();
  } catch (error) {
    console.error("Error in createProfile:", error);
    throw error;
  }
}

/**
 * Update the authenticated user's profile
 */
export async function updateProfile(
  accessToken: string,
  data: UpdateProfileRequest,
): Promise<ProfileResponse> {
  const response = await fetch(`${API_URL}/api/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ Error: "Failed to update profile" }));
    throw new Error(error.Error || "Failed to update profile");
  }

  return response.json();
}

/**
 * Check if the authenticated user has a profile
 */
export async function checkProfileExists(
  accessToken: string,
): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/profile/exists`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.exists || false;
}

/**
 * Upload an image to MinIO
 */
export async function uploadImage(
  file: File,
  type: "Profile" | "Banner" | "Listing" | "TryOn",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch(`${API_URL}/api/images/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to upload image" }));
    throw new Error(error.error || "Failed to upload image");
  }

  const data = await response.json();
  return data.url;
}
