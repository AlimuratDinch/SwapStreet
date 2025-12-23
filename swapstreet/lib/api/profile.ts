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
    console.log("Token expired, attempting to refresh...");
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
  console.log("=== CREATE PROFILE REQUEST ===");
  console.log("URL:", `${API_URL}/api/profile`);
  console.log("Method: POST");
  console.log("Headers:", {
    Authorization: `Bearer ${accessToken?.substring(0, 20)}...`,
    "Content-Type": "application/json",
  });
  console.log("Body:", requestBody);
  console.log("Data object:", data);
  
  try {
    const response = await authenticatedFetch(
      `${API_URL}/api/profile`,
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

    console.log("=== CREATE PROFILE RESPONSE ===");
    console.log("Status:", response.status, response.statusText);
    console.log("OK:", response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to create profile (HTTP ${response.status})`;
      
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        // If we already tried to refresh and still got 401, the refresh failed
        errorMessage = "Authentication failed. Your session may have expired. Please log in again.";
      } else {
        try {
          const responseText = await response.text();
          
          // Log to console with explicit markers
          console.error("-------------------------------- ERROR RESPONSE START --------------------------------");
          console.error("Status:", response.status);
          console.error("Status Text:", response.statusText);
          console.error("Raw response text:", responseText);
          console.error("Response text length:", responseText.length);
          console.error("Response text type:", typeof responseText);
          
          // Also show in alert for debugging (remove after fixing)
          if (responseText) {
            console.error("Response preview:", responseText.substring(0, 200));
          }
          
          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.error("✅ Successfully parsed JSON");
            console.error("Parsed error data:", errorData);
            console.error("Error data keys:", Object.keys(errorData));
            console.error("Error data type:", typeof errorData);
            
            // Log all possible error fields
            console.error("errorData.Error:", errorData.Error);
            console.error("errorData.error:", errorData.error);
            console.error("errorData.message:", errorData.message);
            console.error("errorData.errors:", errorData.errors);
          } catch (parseErr) {
            console.error("Failed to parse JSON:", parseErr);
            console.error("Response was not valid JSON");
            // If it's not JSON, use the text as the error message
            errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
          }
          
          // Handle different error response formats
          if (errorData.Error) {
            errorMessage = errorData.Error;
            console.error("Using errorData.Error:", errorMessage);
          } else if (errorData.error) {
            errorMessage = errorData.error;
            console.error("Using errorData.error:", errorMessage);
          } else if (errorData.message) {
            errorMessage = errorData.message;
            console.error("Using errorData.message:", errorMessage);
          } else if (errorData.errors) {
            // Handle ModelState validation errors (ASP.NET Core format)
            console.error("Found errorData.errors:", errorData.errors);
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
              console.error("Using validation errors:", errorMessage);
            }
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
            console.error("Using errorData as string:", errorMessage);
          } else {
            // If we can't parse it, show the whole object
            errorMessage = JSON.stringify(errorData);
            console.error("Using stringified errorData:", errorMessage);
          }
          
          console.error("-------------------------------- ERROR RESPONSE END --------------------------------");
        } catch (parseError) {
          console.error("Exception in error handling:", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      // Make error message more visible
      console.error("FINAL ERROR MESSAGE:", errorMessage);
      
      // Temporary: Show alert for debugging (remove after fixing)
      if (process.env.NODE_ENV === "development") {
        alert(`Profile Creation Failed (${response.status}):\n\n${errorMessage}\n\nCheck console for details.`);
      }
      
      throw new Error(errorMessage);
    }

    // Only call json() if response is ok and body hasn't been consumed
    if (response.ok) {
      try {
        return await response.json();
      } catch (jsonError) {
        console.error("Failed to parse success response as JSON:", jsonError);
        throw new Error("Invalid response from server");
      }
    } else {
      // This shouldn't happen since we handle !response.ok above
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: any) {
    console.error("Error in createProfile:", error);
    // If it's already an Error object, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it
    throw new Error(error?.message || "Failed to create profile");
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
  accessToken: string,
  file: File,
  type: "Profile" | "Banner" | "Listing" | "TryOn",
  refreshTokenFn?: () => Promise<string | null>,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await authenticatedFetch(
    `${API_URL}/api/images/upload`,
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
