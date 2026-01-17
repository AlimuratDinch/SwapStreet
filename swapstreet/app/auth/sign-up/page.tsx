"use client";

import { useState } from "react";
import { logger } from "@/components/common/logger";

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-teal-600">Join the sustainable fashion community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={username}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

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
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-medium 
                         py-3 px-4 rounded-lg transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-gray-700">
            Already have an account?{" "}
            <a href="/auth/sign-in" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign In
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
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-emerald-700/80 flex items-center justify-center">
          <div className="text-center text-white px-12 max-w-lg">
            <h2 className="text-4xl font-bold mb-4">Start Your Sustainable Fashion Journey</h2>
            <p className="text-lg text-white/90">
              Join thousands of fashion lovers buying and selling second-hand clothing while making a positive environmental impact.
            </p>
          </div>
        </div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-gray-600 mb-2">
                We've sent a verification link to:
              </p>
              <p className="text-teal-600 font-semibold mb-6 break-all">
                {email}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Click the link in the email to verify your account and get started.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
