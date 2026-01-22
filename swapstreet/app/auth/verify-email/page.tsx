"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { logger } from "@/components/common/logger";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token && email) {
      verifyEmail(token, email);
    } else {
      setStatus("error");
      setErrorMessage("Missing verification token or email");
    }
    // (Skip lint verification under since verifying only once)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  const verifyEmail = async (
    verificationToken: string,
    verificationEmail: string,
  ) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token: verificationToken,
          email: verificationEmail,
        }),
      });

      if (response.ok) {
        setStatus("success");
        logger.info("Email verification successful");

        // Redirect to sign-in page after 3 seconds
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 3000);
      } else {
        const data = await response.json();
        const error = data.Error || "Email verification failed";
        setStatus("error");
        setErrorMessage(error);
        logger.error("Email verification failed", { error });
      }
    } catch (err: unknown) {
      setStatus("error");
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to verify email. Please try again.";
      setErrorMessage(errorMsg);
      logger.error("Email verification error", err);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        logger.info("Verification email resent successfully");
      } else {
        const data = await response.json();
        const error = data.Error || "Failed to resend verification email";
        setErrorMessage(error);
        logger.error("Failed to resend verification email", { error });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to resend verification email";
      setErrorMessage(errorMsg);
      logger.error("Resend verification email error", err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      {/* Logo - Top Left */}
      <div className="fixed top-0 left-0 p-6 z-10">
        <h2 className="text-2xl font-bold">
          <span className="text-teal-600">SWAP</span>
          <span className="text-gray-900">STREET</span>
        </h2>
      </div>

      {/* Center Content */}
      <div className="w-full max-w-md px-8">
        {/* Verifying State */}
        {status === "verifying" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="animate-spin">
                <svg
                  className="w-12 h-12 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to sign in...
            </p>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-red-600 text-sm mb-6">{errorMessage}</p>
            <p className="text-sm text-gray-600 mb-6">
              The verification link may have expired or is invalid.
            </p>
            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  Verification email sent! Please check your inbox.
                </p>
              </div>
            )}
            <div className="space-y-3">
              {email && (
                <button
                  onClick={resendVerificationEmail}
                  disabled={isResending}
                  className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 px-4 py-3 
                             text-sm font-semibold text-white transition"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
              <button
                onClick={() => router.push("/auth/sign-up")}
                className="w-full rounded-lg bg-gray-200 hover:bg-gray-300 px-4 py-3 
                           text-sm font-semibold text-gray-700 transition"
              >
                Go to Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
