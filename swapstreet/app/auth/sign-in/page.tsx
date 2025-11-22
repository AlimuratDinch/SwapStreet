"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthInput } from "../AuthFormElements";
import { ImageElement } from "../AuthFormElements";
import { PromptElement } from "../AuthFormElements";

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
      console.log("Attempting Sign In...");
                                      const response = await fetch("http://localhost:8080/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Login failed");
      }

                               const data = await response.json();

      // Store only the access token in sessionStorage
      if (data.accessToken) {
        sessionStorage.setItem("accessToken", data.accessToken);
        console.log("Access token stored:", data.accessToken);
      } else {
        throw new Error("Access token not returned from backend");
      }

      router.push("/browse");
    } catch (err: any) {
      console.error("Error:", err);
                            setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
                                                      className="relative flex min-h-screen justify-center 
              items-start bg-[var(--bg-color)] p-6 overflow-hidden"
    >
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
          {/* Form */}
          <h1 className="mt-12 mb-8 text-center text-3xl font-bold text-[var(--text-color)]">
            Login
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 flex flex-col items-center"
          >
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
            />
            <button
              type="submit"
              className="mt-6 w-1/2 rounded-lg bg-[var(--primary-color)] px-3 py-2 
                       text-sm font-semibold text-white transition 
                       hover:bg-[var(--primary-dark)] hover:cursor-pointer"
            >
              Sign In
            </button>
          </form>

          {/* Error message goes here, **inside the form container** */}
          {error && (
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>
          )}

          {/* Sign Up prompt */}
          <PromptElement
            prompt="Don't have an account?"
            linkText="Sign Up"
            linkHref="/auth/sign-up"
          />
        </div>

        {/* Right: Cloth Image */}
        <ImageElement />
      </div>
    </div>
  );
}
