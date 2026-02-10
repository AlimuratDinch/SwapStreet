"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/components/common/logger";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/auth/FormField";
import ErrorMessage from "@/components/auth/ErrorMessage";
import AuthButton from "@/components/auth/AuthButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

    try {
      logger.info("Attempting sign in", { email });

      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.text();
        logger.warn("Login failed", { status: response.status, err });
        throw new Error(err || "Login failed");
      }

      const data = await response.json();

      if (!data.accessToken) {
        logger.error("Access token missing from response");
        throw new Error("Access token not returned from backend");
      }

      sessionStorage.setItem("accessToken", data.accessToken);
      logger.debug("Access token stored");

      router.push("/browse");
    } catch (err: unknown) {
      logger.error("Login error", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to login. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
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

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-gray-700">
          Don't have an account?{" "}
          <a
            href="/auth/sign-up"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Sign Up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
