"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface AuthContextProps {
  userId: string | null;
  username: string | null;
  email: string | null;
  accessToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  authLoaded: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  // Helper to update state from token
  const updateAuthState = useCallback((token: string) => {
    sessionStorage.setItem("accessToken", token);
    setAccessToken(token);
    const userData = parseUserDataFromToken(token);
    setUserId(userData.userId);
    setUsername(userData.username);
    setEmail(userData.email);
  }, []);

  const login = (token: string) => {
    updateAuthState(token);
  };

  const logout = useCallback(async () => {
    try {
      // We need the current token because of the [Authorize] attribute on your backend
      const token = sessionStorage.getItem("accessToken");

      // 1. Hit the backend logout endpoint
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          // REQUIRED: Matches [Authorize] on backend
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // REQUIRED: Allows the browser to receive the "Delete Cookie" instruction
        credentials: "include",
      });
    } catch (error) {
      // If the token is already expired, the backend might return 401.
      // We catch the error so we can still clean up the frontend.
      console.warn("Backend logout failed or token already expired", error);
    } finally {
      // 2. Clear client-side data
      sessionStorage.removeItem("accessToken");

      // 3. Reset React State
      setAccessToken(null);
      setUserId(null);
      setUsername(null);
      setEmail(null);

      // 4. Send user to the landing page
      router.push("/");
    }
  }, [router]);

  const refreshToken = async (): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // Crucial: Sends the HttpOnly Refresh Cookie
      });

      if (!response.ok) {
        logout();
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        updateAuthState(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch (error) {
      logout();
      return null;
    }
  };

  // Silent Refresh: Used only on mount to check for existing session
  const attemptSilentRefresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) updateAuthState(data.accessToken);
      }
    } catch (err) {
      console.warn("Silent refresh failed (User likely guest)");
    } finally {
      console.log("authLoaded set to true");
      setAuthLoaded(true); // Finalize loading regardless of outcome
    }
  }, [API_URL, updateAuthState]);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      updateAuthState(token);
      setAuthLoaded(true);
    } else {
      attemptSilentRefresh();
    }
  }, [updateAuthState, attemptSilentRefresh]);

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        userId,
        username,
        email,
        accessToken,
        login,
        logout,
        refreshToken,
        isAuthenticated,
        authLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

function parseUserDataFromToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: payload.sub ?? null,
      username: payload.username ?? null,
      email: payload.email ?? null,
    };
  } catch {
    return { userId: null, username: null, email: null };
  }
}
