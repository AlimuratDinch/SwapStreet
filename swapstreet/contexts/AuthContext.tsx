"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Define the context type
interface AuthContextProps {
  userId: string | null;
  accessToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load token from sessionStorage on mount
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      setAccessToken(token);
      setUserId(parseUserIdFromToken(token));
    }
  }, []);

  const login = (token: string) => {
    sessionStorage.setItem("accessToken", token);
    setAccessToken(token);
    setUserId(parseUserIdFromToken(token));
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    setAccessToken(null);
    setUserId(null);
    router.push("/login");
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{ userId, accessToken, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Simple JWT parser (just for frontend state)
function parseUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
