"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clothImage from "../../../app/images/clothes_login_page.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in with:", { email, password });
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
          {/* Brand name in top-left corner */}
          <h2 className="absolute top-4 left-6 text-2xl font-extrabold tracking-wide">
            <span className="text-[var(--accent-color)]">Swap</span>
            <span className="text-[var(--primary-dark)] italic">Street!</span>
          </h2>

          {/* Login Heading */}
          <h1 className="mt-12 mb-8 text-center text-3xl font-bold text-[var(--text-color)]">
            Login
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 flex flex-col items-center"
          >
            <div className="w-4/5">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 
                           focus:border-[var(--primary-color)] focus:ring focus:ring-[var(--gradient-end)]"
              />
            </div>

            <div className="w-4/5">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 
                           focus:border-[var(--primary-color)] focus:ring focus:ring-[var(--gradient-end)]"
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-1/2 rounded-lg bg-[var(--primary-color)] px-3 py-2 
                         text-sm font-semibold text-white transition 
                         hover:bg-[var(--primary-dark)] hover:cursor-pointer"
            >
              Sign In
            </button>
          </form>

          {/* Sign Up prompt */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Do not have an account?{" "}
            <Link
              href="/sign-up"
              className="ml-1 font-medium text-[var(--primary-color)] 
                         hover:text-[var(--primary-dark)] transition"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Right: Cloth Image */}
        <div className="w-full md:w-1/2 relative hidden md:block">
          <Image
            src={clothImage}
            alt="Clothing"
            className="object-cover h-full w-full rounded-r-2xl"
            priority
          />
        </div>
      </div>
    </div>
  );
}
