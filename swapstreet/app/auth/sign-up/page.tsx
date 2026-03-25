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

export default function RegistrationPage() {
  const router = useRouter();
  const { isAuthenticated, authLoaded } = useAuth();

  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToCookies, setAgreedToCookies] = useState(false); // NEW STATE
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);

  useEffect(() => {
    if (authLoaded && isAuthenticated) {
      router.replace("/browse");
    }
  }, [authLoaded, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // --- VALIDATIONS ---
    if (!agreedToCookies) {
      setError("You must agree to the Cookie Policy and Terms to continue.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Failed to create account.";
        try {
          const json = JSON.parse(text);
          message = json.error || json.title || text;
        } catch {
          if (text) message = text;
        }
        throw new Error(message);
      }

      logger.info("Register successful - showing email sent message");
      setShowEmailSentModal(true);
    } catch (err: unknown) {
      logger.error("Registration error", err);
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-teal-600">Join the sustainable fashion community</p>
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

{/* COOKIE & LEGAL AGREEMENT CHECKBOX */}
<div className="flex items-start space-x-3 py-2">
  <input
    id="cookie-agreement"
    type="checkbox"
    checked={agreedToCookies}
    onChange={(e) => setAgreedToCookies(e.target.checked)}
    className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
  />
  <label htmlFor="cookie-agreement" className="text-sm text-gray-600 cursor-pointer select-none">
    I agree to the use of cookies for session management and acknowledge the{" "}
    <a 
      href="/privacy" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-teal-600 hover:underline font-medium"
    >
      Privacy Policy
    </a>{" "}
    and{" "}
    <a 
      href="/terms" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-teal-600 hover:underline font-medium"
    >
      Terms of Service
    </a>.
  </label>
</div>

          <AuthButton disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </AuthButton>
        </form>

        <p className="mt-8 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <a href="/auth/sign-in" className="text-teal-600 hover:text-teal-700 font-medium">
            Sign In
          </a>
        </p>
      </div>

      {/* Modal remains the same */}
      {showEmailSentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
            <p className="text-gray-600 mb-2">Verification link sent to:</p>
            <p className="text-teal-600 font-semibold mb-6 break-all">{email}</p>
            <p className="text-sm text-gray-500">
              Please verify your email to access SwapStreet.
            </p>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}