"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clothImage from "../../../app/images/cloths_login_page.png"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in with:", { email, password });
  };

  return (
    <div className="relative flex min-h-screen justify-center items-start bg-white p-6 overflow-hidden">
      {/* Background design */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#dfc27d] to-[#80cdc1] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-72 h-72 rounded-full bg-gradient-to-tr from-[#80cdc1] to-[#dfc27d] opacity-30 animate-pulse"></div>

      {/* Gradient border wrapper */}
      <div className="mt-16 w-full max-w-5xl rounded-2xl bg-gradient-to-br from-[#dfc27d] to-[#80cdc1] p-[3px] shadow-lg flex overflow-hidden">
        {/* Left: Login Form */}
        <div className="w-1/2 bg-white p-8 flex flex-col justify-center">
          <h1 className="mb-6 text-center text-3xl font-bold text-black">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[rgba(53,151,143,1)] focus:ring focus:ring-[rgba(128,205,193,1)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[rgba(53,151,143,1)] focus:ring focus:ring-[rgba(128,205,193,1)]"
              />
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-lg bg-[#018571] px-4 py-2 font-semibold text-white transition hover:bg-[#016c5d]"
            >
              Sign In
            </button>
          </form>

          {/* Sign Up prompt */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Do not have an account?{" "}
            <Link
              href="/sign-up"
              className="ml-1 font-medium text-[#018571] hover:text-[#016c5d] transition"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Right: Cloth Image */}
        <div className="w-1/2 relative">
          <Image
            src={clothImage}
            alt="Clothing"
            className="object-cover h-full w-full"
            priority
          />
        </div>
      </div>
    </div>
  );
}
