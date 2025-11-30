"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Define the context type
interface AuthContextProps {
  userId: string | null;
  username: string | null;
  email: string | null;
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
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load token from sessionStorage on mount
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      setAccessToken(token);
      const userData = parseUserDataFromToken(token);
      setUserId(userData.userId);
      setUsername(userData.username);
      setEmail(userData.email);
    }
  }, []);

  const login = (token: string) => {
    sessionStorage.setItem("accessToken", token);
    setAccessToken(token);
    const userData = parseUserDataFromToken(token);
    setUserId(userData.userId);
    setUsername(userData.username);
    setEmail(userData.email);
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    setAccessToken(null);
    setUserId(null);
    setUsername(null);
    setEmail(null);
    router.push("/login");
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{ userId, username, email, accessToken, login, logout, isAuthenticated }}
    >
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
function parseUserDataFromToken(token: string): { userId: string | null; username: string | null; email: string | null } {
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
