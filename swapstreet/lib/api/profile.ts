// Profile API client functions

import { logger } from "@/components/common/logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface CreateProfileRequest {
  firstName: string;
  lastName: string;
  bio?: string;
  cityId: number; // Changed from locationId to match backend
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
  const response = await fetch(`${API_URL}/profile/me`, {
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
  const response = await fetch(`${API_URL}/profile/${userId}`, {
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
/**
 * Helper function to make authenticated requests with automatic token refresh
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit,
  refreshTokenFn?: () => Promise<string | null>,
): Promise<Response> {
  let response = await fetch(url, options);

  // If we get a 401 and have a refresh function, try to refresh the token
  if (response.status === 401 && refreshTokenFn) {
    logger.warn("Token expired, attempting to refresh...");
    const newToken = await refreshTokenFn();

    if (newToken) {
      // Update the Authorization header with the new token
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${newToken}`);

      // Retry the request with the new token
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

export async function createProfile(
  accessToken: string,
  data: CreateProfileRequest,
  refreshTokenFn?: () => Promise<string | null>,
): Promise<ProfileResponse> {
  const requestBody = JSON.stringify(data);

  logger.debug("Creating profile", {
    url: `${API_URL}/profile`,
    method: "POST",
    hasAccessToken: !!accessToken,
    data,
  });

  try {
    const response = await authenticatedFetch(
      `${API_URL}/profile`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: requestBody,
      },
      refreshTokenFn,
    );

    if (!response.ok) {
      let errorMessage = `Failed to create profile (HTTP ${response.status})`;

      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        // If we already tried to refresh and still got 401, the refresh failed
        errorMessage =
          "Authentication failed. Your session may have expired. Please log in again.";
      } else {
        try {
          const responseText = await response.text();

          logger.error("Error response received", {
            status: response.status,
            statusText: response.statusText,
            responseText: responseText.substring(0, 200),
            responseTextLength: responseText.length,
          });

          let errorData;
          try {
            errorData = JSON.parse(responseText);
            logger.debug("Parsed error data", {
              errorData,
              keys: Object.keys(errorData),
              hasError: !!errorData.Error,
              hasErrorField: !!errorData.error,
              hasMessage: !!errorData.message,
              hasErrors: !!errorData.errors,
            });
          } catch (parseErr) {
            logger.error("Failed to parse error response as JSON", parseErr);
            // If it's not JSON, use the text as the error message
            errorMessage =
              responseText || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
          }

          // Handle different error response formats
          if (errorData.Error) {
            errorMessage = errorData.Error;
            logger.debug("Using errorData.Error", { errorMessage });
          } else if (errorData.error) {
            errorMessage = errorData.error;
            logger.debug("Using errorData.error", { errorMessage });
          } else if (errorData.message) {
            errorMessage = errorData.message;
            logger.debug("Using errorData.message", { errorMessage });
          } else if (errorData.errors) {
            // Handle ModelState validation errors (ASP.NET Core format)
            logger.debug("Found errorData.errors", {
              errors: errorData.errors,
            });
            if (typeof errorData.errors === "object") {
              const validationErrors = Object.entries(errorData.errors)
                .map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return `${key}: ${value.join(", ")}`;
                  }
                  return `${key}: ${value}`;
                })
                .join("; ");
              errorMessage = validationErrors || errorMessage;
              logger.debug("Using validation errors", { errorMessage });
            }
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
            logger.debug("Using errorData as string", { errorMessage });
          } else {
            // If we can't parse it, show the whole object
            errorMessage = JSON.stringify(errorData);
            logger.debug("Using stringified errorData", { errorMessage });
          }
        } catch (parseError) {
          logger.error("Exception in error handling", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }

      logger.error("Profile creation failed", {
        errorMessage,
        status: response.status,
      });

      // Temporary: Show alert for debugging (remove after fixing)
      if (process.env.NODE_ENV === "development") {
        alert(
          `Profile Creation Failed (${response.status}):\n\n${errorMessage}\n\nCheck console for details.`,
        );
      }

      throw new Error(errorMessage);
    }

    // Only call json() if response is ok and body hasn't been consumed
    if (response.ok) {
      try {
        const result = await response.json();
        logger.debug("Profile creation response", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
        return result;
      } catch (jsonError) {
        logger.error("Failed to parse success response as JSON", jsonError);
        throw new Error("Invalid response from server");
      }
    } else {
      // This shouldn't happen since we handle !response.ok above
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: unknown) {
    logger.error("Error in createProfile", error);
    // If it's already an Error object, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it in an Error
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Failed to create profile";
    throw new Error(errorMessage);
  }
}

/**
 * Update the authenticated user's profile
 */
export async function updateProfile(
  accessToken: string,
  data: UpdateProfileRequest,
): Promise<ProfileResponse> {
  const response = await fetch(`${API_URL}/profile`, {
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
  const response = await fetch(`${API_URL}/profile/exists`, {
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
  accessToken: string,
  file: File,
  type: "Profile" | "Banner" | "Listing" | "TryOn",
  refreshTokenFn?: () => Promise<string | null>,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await authenticatedFetch(
    `${API_URL}/images/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: formData,
    },
    refreshTokenFn,
  );

  if (!response.ok) {
    let errorMessage = "Failed to upload image";

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.Error) {
        errorMessage = errorData.Error;
      }
    } catch {
      if (response.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      }
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.url;
}
