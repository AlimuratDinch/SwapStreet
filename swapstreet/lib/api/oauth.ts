const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface LinkedAccount {
  provider: "google" | "facebook" | "apple";
  email: string;
  linkedAt: string;
}

export interface LinkedAccountsResponse {
  linkedAccounts: LinkedAccount[];
}

/**
 * Fetch all linked OAuth accounts for the current user
 */
export async function getLinkedAccounts(
  accessToken: string
): Promise<LinkedAccountsResponse> {
  const response = await fetch(`${API_URL}/auth/linked-accounts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Failed to fetch linked accounts: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Unlink an OAuth provider from the current user's account
 * Note: Backend should validate that user has at least one auth method remaining
 */
export async function unlinkAccount(
  provider: "google" | "facebook" | "apple",
  accessToken: string
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_URL}/auth/linked-accounts/${provider}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to unlink account: ${response.status}`);
  }

  return response.json();
}

/**
 * Initiate OAuth linking for an existing authenticated user
 * This redirects to the OAuth provider
 */
export function initiateOAuthLink(provider: "google" | "facebook" | "apple") {
  window.location.href = `${API_URL}/auth/link-${provider}`;
}

/**
 * Initiate OAuth sign-in flow
 * Redirects to backend which will redirect to OAuth provider
 */
export function initiateOAuthSignIn(
  provider: "google" | "facebook" | "apple",
  isSignUp = false
) {
  const signupParam = isSignUp ? "?signup=true" : "";
  window.location.href = `${API_URL}/auth/${provider}${signupParam}`;
}
