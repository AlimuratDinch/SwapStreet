"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

function normalizeImageUrl(raw?: string) {
  if (!raw) return raw;
  try {
    const url = new URL(raw, window.location.href);
    const host = url.hostname;
    if (host === "minio" || host.startsWith("minio")) {
      return url.toString();
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export default function Gallery({
  images,
}: {
  images: { imageUrl?: string }[];
}) {
  const [index, setIndex] = useState(0);
  const total = images?.length ?? 0;

  const safeUrls = useMemo(
    () => images?.map((i) => normalizeImageUrl(i?.imageUrl)) ?? [],
    [images],
  );

  useEffect(() => {
    if (index >= safeUrls.length) setIndex(0);
  }, [safeUrls.length, index]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-400">No images</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-visible">
      {/* Blurred background image */}
      {safeUrls[index] ? (
        <Image
          src={safeUrls[index] ?? images[index]?.imageUrl ?? ""}
          alt={`background-${index}`}
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          className="absolute -top-96 -left-96 -right-96 object-cover blur-2xl scale-300 z-0"
        />
      ) : null}

      <div className="flex-1 bg-black/0 overflow-hidden flex items-center justify-center relative pt-2 z-10">
        {/* Main image on top */}
        <div className="absolute inset-0 flex items-center justify-center">
          {safeUrls[index] ? (
            <Image
              src={safeUrls[index] ?? images[index]?.imageUrl ?? ""}
              alt={`image-${index}`}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="max-h-full max-w-full" />
          )}
        </div>
        <button
          onClick={prev}
          aria-label="previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-2 rounded-full"
        >
          ◀
        </button>
        <button
          onClick={next}
          aria-label="next"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-2 rounded-full"
        >
          ▶
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto py-2 justify-center bg-black/0 z-10">
        {safeUrls.map((src, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`min-w-[64px] h-16 rounded overflow-hidden ${i === index ? "ring-2 ring-teal-500" : ""}`}
          >
            {src || images[i]?.imageUrl ? (
              <Image
                src={src ?? images[i]?.imageUrl ?? ""}
                alt={`thumb-${i}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
