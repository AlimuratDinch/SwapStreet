"use client";

import { InputHTMLAttributes } from "react";
import Image from "next/image";
import clothImage from "../../public/images/clothes_login_page.png";
import Link from "next/link";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id?: string; // allow explicit id (otherwise auto-generate from label)
}

export function AuthInput({
  label,
  id,
  className = "",
  ...props
}: AuthInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-4/5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 
                    focus:border-[var(--primary-color)] focus:ring focus:ring-[var(--gradient-end)]
                    ${className}`}
      />
    </div>
  );
}

export function ImageElement() {
  return (
    <div className="w-full md:w-1/2 relative hidden md:block">
      <Image
        src={clothImage}
        alt="Clothing"
        className="object-cover h-full w-full rounded-r-2xl"
        priority
      />
    </div>
  );
}

export function PromptElement({
  prompt,
  linkText,
  linkHref,
}: {
  prompt: string;
  linkText: string;
  linkHref: string;
}) {
  return (
    <p className="mt-6 text-center text-sm text-gray-600">
      {prompt}{" "}
      <Link
        href={linkHref}
        className="ml-1 font-medium text-[var(--primary-color)] 
          hover:text-[var(--primary-dark)] transition"
      >
        {linkText}
      </Link>
    </p>
  );
}
