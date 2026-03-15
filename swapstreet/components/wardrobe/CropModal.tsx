import { X } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface CropModalProps {
  cropSrc: string | null;
  crop: { x: number; y: number };
  zoom: number;
  frameAspect: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedAreaPixels: Area) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function CropModal({
  cropSrc,
  crop,
  zoom,
  frameAspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onConfirm,
  onClose,
}: CropModalProps) {
  if (!cropSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Crop your photo</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="relative w-full h-[480px] bg-gray-900">
          <Cropper
            image={cropSrc}
            crop={crop}
            zoom={zoom}
            aspect={frameAspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={(_, croppedPixels) => onCropComplete(croppedPixels)}
          />
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="flex-1 accent-teal-500"
            />
          </div>
          <button
            onClick={onConfirm}
            className="w-full bg-teal-500 text-white py-2.5 rounded-lg font-medium hover:bg-teal-600 transition-colors"
          >
            Use this crop
          </button>
        </div>
      </div>
    </div>
  );
}
