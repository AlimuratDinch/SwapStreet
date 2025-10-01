"use client";

import { useState } from "react";
import { AuthInput } from "../AuthFormElements";
import { ImageElement } from "../AuthFormElements";
import { PromptElement } from "../AuthFormElements";

export default function RegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Here you would typically make an API call to your backend
      console.log("Signing up with:", { name, email, password });
      // Add your API call here
    } catch (err) {
      setError("Failed to create account. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen justify-center items-start bg-[var(--bg-color)] p-6 overflow-hidden">
      {/* Background design: simple circles with hover grow */}
      {/* Top-left circle: primary-dark with slight orange tint */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full 
                      bg-[rgba(1,108,93,0.15)]  
                      transition-transform duration-500 ease-in-out hover:scale-110"
      ></div>

      {/* Bottom-right circle: primary-dark */}
      <div
        className="absolute bottom-[-100px] right-[-100px] w-72 h-72 rounded-full 
                      bg-[rgba(1,108,93,0.15)]  
                      transition-transform duration-500 ease-in-out hover:scale-110"
      ></div>

      {/* Gradient border wrapper */}
      <div
        className="mt-10 md:mt-16 w-full max-w-5xl rounded-2xl 
                      bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] 
                      p-[3px] shadow-lg flex flex-col md:flex-row overflow-hidden"
      >
        {/* Left: Login Form */}
        <div
          className="relative w-full md:w-1/2 bg-[var(--bg-color)] p-8 flex flex-col 
                        justify-start md:justify-center rounded-2xl md:rounded-l-2xl md:rounded-r-none"
        >
          {/* Brand name in top-left corner */}
          <h2 className="absolute top-4 left-6 text-2xl font-extrabold tracking-wide">
            <span className="text-[var(--accent-color)]">Swap</span>
            <span className="text-[var(--primary-dark)] italic">Street!</span>
          </h2>

          {/* Login Heading */}
          <h1 className="mt-12 mb-8 text-center text-3xl font-bold text-[var(--text-color)]">
            Register
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 flex flex-col items-center"
          >
            {error && (
              <div className="w-4/5 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <AuthInput
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <AuthInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            <AuthInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />

            <button
              type="submit"
              className="mt-6 w-1/2 rounded-lg bg-[var(--primary-color)] px-3 py-2 
                         text-sm font-semibold text-white transition 
                         hover:bg-[var(--primary-dark)] hover:cursor-pointer"
            >
              Sign Up
            </button>
          </form>

          {/* Sign Up prompt */}
          <PromptElement
            prompt="Already have an account?"
            linkText="Sign In"
            linkHref="/sign-in"
          />
        </div>

        {/* Right: Cloth Image */}
        <ImageElement />
      </div>
    </div>
  );
}
