"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/components/common/logger";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/auth/FormField";
import ErrorMessage from "@/components/auth/ErrorMessage";
import AuthButton from "@/components/auth/AuthButton";

function parseApiError(text: string, fallback: string): string {
  try {
    const json = JSON.parse(text);
    if (json.status === 400) return "Invalid email or password.";
    if (json.error && typeof json.error === "string") return json.error;
  } catch {
    if (text && !text.startsWith("{")) return text;
  }
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, authLoaded } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- AUTO-CHECK REDIRECT ---
  useEffect(() => {
    if (authLoaded && isAuthenticated) {
      logger.info("User already authenticated, redirecting to browse");
      router.replace("/browse");
    }
  }, [authLoaded, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

    try {
      logger.info("Attempting sign in", { email });
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        logger.warn("Login failed", { status: response.status, text });
        throw new Error(parseApiError(text, "Login failed. Please try again."));
      }

      const data = await response.json();
      if (!data.accessToken) {
        throw new Error("Access token not returned from backend");
      }

      login(data.accessToken);
      // Using replace here prevents the user from clicking "back" into the login form
      router.replace("/browse");
    } catch (err: unknown) {
      logger.error("Login error", err);
      setError(err instanceof Error ? err.message : "Failed to login.");
    } finally {
      setLoading(false);
    }
  };

  // --- PREVENT FORM FLICKER ---
  // 1. If we are still hitting the /refresh endpoint (!authLoaded)
  // 2. OR if we just found out the user is logged in (isAuthenticated)
  // DO NOT show the form. This kills the 1-second "flash".
  if (!authLoaded || isAuthenticated) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center space-y-4 h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          <p className="text-gray-500">
            {!authLoaded ? "Verifying session..." : "Redirecting..."}
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-teal-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage message={error} />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <AuthButton disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </AuthButton>
        </form>

        <p className="mt-8 text-center text-sm text-gray-700">
          Don't have an account?{" "}
          <a href="/auth/sign-up" className="text-teal-600 hover:text-teal-700 font-medium">
            Sign Up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}