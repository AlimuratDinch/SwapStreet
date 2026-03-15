import Image from "next/image";
import { X, Upload } from "lucide-react";

interface ImageDisplayProps {
  photoMode: "upload" | "model";
  uploadedImage: string | null;
  generatedImage: string | null;
  modelImagePath: string | null;
  showOriginal: boolean;
  uploadProgress: boolean;
  imageFrameRef: React.RefObject<HTMLDivElement | null>;
  onUploadClick: () => void;
  onRemoveClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function ImageDisplay({
  photoMode,
  uploadedImage,
  generatedImage,
  modelImagePath,
  showOriginal,
  uploadProgress,
  imageFrameRef,
  onUploadClick,
  onRemoveClick,
  onKeyDown,
}: ImageDisplayProps) {
  const isClickable = photoMode === "upload" && !uploadedImage && !generatedImage;
  const hasImage =
    photoMode === "upload" ? uploadedImage || generatedImage : modelImagePath || generatedImage;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      onClick={isClickable ? onUploadClick : undefined}
      onKeyDown={onKeyDown}
      className={`relative flex-1 min-h-0 rounded-lg overflow-hidden flex items-center justify-center ${
        photoMode === "model" && (modelImagePath || generatedImage)
          ? "bg-white border border-gray-200"
          : "bg-gray-100"
      } ${
        isClickable
          ? "cursor-pointer hover:bg-gray-200 border-4 border-dashed border-gray-300 hover:border-teal-500 transition-colors"
          : ""
      }`}
      ref={imageFrameRef}
    >
      {uploadProgress ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Uploading...</p>
        </div>
      ) : hasImage ? (
        <>
          <Image
            src={
              (
                showOriginal
                  ? photoMode === "model"
                    ? modelImagePath
                    : uploadedImage
                  : generatedImage || (photoMode === "model" ? modelImagePath : uploadedImage)
              ) || ""
            }
            alt={showOriginal ? "Person photo" : "AI Result"}
            fill
            className={photoMode === "model" ? "object-cover object-top" : "object-cover"}
            unoptimized
          />
          {photoMode === "upload" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveClick();
              }}
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              title="Remove photo"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </>
      ) : photoMode === "upload" ? (
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Upload Your Photo</p>
          <p className="text-sm text-gray-500 mt-1">Click to browse</p>
        </div>
      ) : (
        <div className="text-center px-4">
          <p className="text-gray-500 text-sm">Select options below to preview model</p>
        </div>
      )}
    </div>
  );
}
