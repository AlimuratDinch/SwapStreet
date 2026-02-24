"use client";

import React, { useCallback, useEffect, useState } from "react";
import nextDynamic from "next/dynamic";
import type { Area } from "react-easy-crop";
import { logger } from "@/components/common/logger";

const Cropper = nextDynamic(
  () => import("react-easy-crop").then((mod) => mod.default),
  { ssr: false },
);

// Produce a cropped image blob from image URL and crop area in pixels.
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context not available");
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

export interface ImageCropModalProps {
  open: boolean;
  imageUrl: string;
  aspect: number;
  cropShape: "round" | "rect";
  onConfirm: (file: File) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
  /** Original file name (without extension) for the cropped output file name. */
  sourceFileName?: string;
}

export default function ImageCropModal({
  open,
  imageUrl,
  aspect,
  cropShape,
  onConfirm,
  onCancel,
  onError,
  sourceFileName = "cropped",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Reset crop state when modal opens or image changes
  useEffect(() => {
    if (open && imageUrl) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropAreaPixels(null);
      setConfirming(false);
    }
  }, [open, imageUrl]);

  const handleConfirm = useCallback(async () => {
    if (!imageUrl || !cropAreaPixels) {
      onError?.("Adjust the crop area and try again.");
      return;
    }
    setConfirming(true);
    onError?.("");
    try {
      const blob = await getCroppedImg(imageUrl, cropAreaPixels);
      const fileName = sourceFileName.replace(/\.[^.]+$/, "") || "cropped";
      const file = new File([blob], `${fileName}.jpg`, {
        type: "image/jpeg",
      });
      onConfirm(file);
    } catch (err) {
      logger.error("Crop failed", err);
      onError?.("Failed to crop image. Please try another image.");
    } finally {
      setConfirming(false);
    }
  }, [imageUrl, cropAreaPixels, sourceFileName, onConfirm, onError]);

  if (!open || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-gray-900">
      <div className="flex-1 relative min-h-0">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={0}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area: Area, pixels: Area) =>
            setCropAreaPixels(pixels)
          }
          onCropAreaChange={(_area: Area, pixels: Area) =>
            setCropAreaPixels(pixels)
          }
          minZoom={1}
          maxZoom={3}
          cropShape={cropShape}
          showGrid={cropShape !== "round"}
          zoomSpeed={1}
          restrictPosition
          keyboardStep={0.1}
          style={{
            containerStyle: { backgroundColor: "inherit" },
          }}
          classes={{
            containerClassName: "rounded-none",
          }}
          mediaProps={{}}
          cropperProps={{}}
        />
      </div>
      <div className="flex-shrink-0 p-4 bg-gray-900 border-t border-gray-700 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-600 accent-teal-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || !cropAreaPixels}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? "Applying…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
