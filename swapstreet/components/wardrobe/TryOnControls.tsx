import { Download } from "lucide-react";

interface TryOnControlsProps {
  photoMode: "upload" | "model";
  modelImagePath: string | null;
  uploadedImage: string | null;
  generatedImage: string | null;
  selectedItemId: string | null;
  loading: boolean;
  uploadProgress: boolean;
  onTryOn: () => void;
  onDownload: () => void;
}

export function TryOnControls({
  photoMode,
  modelImagePath,
  uploadedImage,
  generatedImage,
  selectedItemId,
  loading,
  uploadProgress,
  onTryOn,
  onDownload,
}: TryOnControlsProps) {
  const canTryOn = photoMode === "upload" ? uploadedImage : modelImagePath;
  const canDownload = (photoMode === "model" ? modelImagePath : uploadedImage) || generatedImage;

  if (!canTryOn && !canDownload) return null;

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={onTryOn}
        disabled={loading || !canTryOn || !selectedItemId || uploadProgress}
        className="flex-1 bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Processing...
          </span>
        ) : (
          "Try On"
        )}
      </button>
      <button
        onClick={onDownload}
        disabled={!canDownload}
        className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Download image"
      >
        <Download className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}
