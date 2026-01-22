"use client";

import React, { useEffect, useMemo, useState } from "react";

function normalizeImageUrl(raw?: string) {
  if (!raw) return raw;
  try {
    const url = new URL(raw, window.location.href);
    const host = url.hostname;
    if (host === "minio" || host.startsWith("minio")) {
      const port = url.port || "9000";
      url.hostname = window.location.hostname;
      url.port = port;
      return url.toString();
    }
    return url.toString();
  } catch (e) {
    return raw;
  }
}

export default function Gallery({ images }: { images: { imageUrl?: string }[] }) {
  const [index, setIndex] = useState(0);
  const total = images?.length ?? 0;

  const safeUrls = useMemo(() => images?.map((i) => normalizeImageUrl(i?.imageUrl)) ?? [], [images]);

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
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <button
          onClick={prev}
          aria-label="previous"
          className="absolute left-2 z-20 bg-white/80 hover:bg-white p-2 rounded-full"
        >
          ◀
        </button>
        <div className="h-full w-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeUrls[index] ?? images[index]?.imageUrl ?? ''}
            alt={`image-${index}`}
            className="max-h-[78vh] max-w-full mx-auto object-contain"
          />
        </div>
        <button
          onClick={next}
          aria-label="next"
          className="absolute right-2 z-20 bg-white/80 hover:bg-white p-2 rounded-full"
        >
          ▶
        </button>

        
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto py-1">
        {safeUrls.map((src, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`min-w-[64px] h-16 rounded overflow-hidden ${i === index ? "ring-2 ring-teal-500" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src || images[i]?.imageUrl ? (
              <img src={src ?? images[i]?.imageUrl} alt={`thumb-${i}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
