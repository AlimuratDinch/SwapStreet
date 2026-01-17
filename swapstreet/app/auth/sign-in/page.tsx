"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/components/common/logger";

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

    try {
      logger.info("Attempting sign in", { email });

      const response = await fetch("http://localhost:8080/api/auth/signin", {
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
    <div className="flex min-h-screen">
      {/* Logo - Top Left */}
      <div className="fixed top-0 left-0 p-6 z-10">
        <h2 className="text-2xl font-bold">
          <span className="text-teal-600">SWAP</span>
          <span className="text-gray-900">STREET</span>
        </h2>
      </div>

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-teal-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium 
                         py-3 px-4 rounded-lg transition-colors shadow-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-gray-700">
            Don't have an account?{" "}
            <a href="/auth/sign-up" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Background */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `url('/images/login&signup.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-emerald-700/80"></div>
      </div>
    </div>
  );
}
