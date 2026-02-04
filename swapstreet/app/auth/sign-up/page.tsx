"use client";

import { useState } from "react";
import { logger } from "@/components/common/logger";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/auth/FormField";
import ErrorMessage from "@/components/auth/ErrorMessage";
import AuthButton from "@/components/auth/AuthButton";

export default function RegistrationPage() {
  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to create account");
      }

      await response.json();

      logger.info("Register successful - showing email sent message");

      // Show the email sent modal
      setShowEmailSentModal(true);
    } catch (err: unknown) {
      logger.error("Registration error", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-teal-600">
            Join the sustainable fashion community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage message={error} />

          <FormField
            id="name"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            minLength={8}
          />

          <FormField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />

          <AuthButton>Sign Up</AuthButton>
        </form>

        {/* Sign In Link */}
        <p className="mt-8 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <a
            href="/auth/sign-in"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Sign In
          </a>
        </p>
      </div>

      {/* Email Sent Modal */}
      {showEmailSentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-teal-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-2">
                We've sent a verification link to:
              </p>
              <p className="text-teal-600 font-semibold mb-6 break-all">
                {email}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Click the link in the email to verify your account and get
                started.
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
