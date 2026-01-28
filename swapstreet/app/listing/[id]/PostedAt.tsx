"use client";

import React, { useEffect, useState } from "react";

function timeAgoLabel(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (isNaN(seconds)) return "";
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function PostedAt({ iso }: { iso?: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!iso) {
      setLabel("");
      return;
    }
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      setLabel(iso);
      return;
    }

    const update = () => setLabel(`${timeAgoLabel(d)} (${d.toLocaleString()})`);
    update();
    const t = setInterval(update, 30 * 1000);
    return () => clearInterval(t);
  }, [iso]);

  return <div className="text-gray-200">{label}</div>;
}
