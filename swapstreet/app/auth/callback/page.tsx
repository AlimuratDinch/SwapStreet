"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/components/common/logger";
import AuthLayout from "@/components/auth/AuthLayout";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, authLoaded } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (authLoaded && isAuthenticated) {
      logger.info("User already authenticated, redirecting to browse");
      router.replace("/browse");
      return;
    }

    if (!authLoaded) {
      return;
    }

    const accessToken = searchParams.get("accessToken");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      const errorMessage =
        errorDescription || errorParam || "Authentication failed";
      logger.warn("OAuth callback error", { error: errorParam, errorDescription });
      setError(errorMessage);
      setIsProcessing(false);
      return;
    }

    if (!accessToken) {
      logger.error("OAuth callback missing both accessToken and error");
      setError("Invalid authentication response. Please try again.");
      setIsProcessing(false);
      return;
    }

    try {
      logger.info("OAuth callback successful, logging in user");
      login(accessToken);
      
      setTimeout(() => {
        router.replace("/browse");
      }, 100);
    } catch (err) {
      logger.error("Failed to process OAuth callback", err);
      setError("Failed to complete authentication. Please try again.");
      setIsProcessing(false);
    }
  }, [authLoaded, isAuthenticated, searchParams, login, router]);

  if (!authLoaded || isProcessing) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center space-y-4 h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          <p className="text-gray-500">Completing authentication...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
            >
              Back to Sign In
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return null;
}
