interface ToggleButtonsProps {
  generatedImage: string | null;
  isViewingRecentResult: boolean;
  showOriginal: boolean;
  onOriginal: () => void;
  onResult: () => void;
}

export function ToggleButtons({
  generatedImage,
  isViewingRecentResult,
  showOriginal,
  onOriginal,
  onResult,
}: ToggleButtonsProps) {
  if (!generatedImage || isViewingRecentResult) return null;

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={onOriginal}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
          showOriginal
            ? "bg-teal-500 text-white shadow-sm"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Original
      </button>
      <button
        onClick={onResult}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
          !showOriginal
            ? "bg-teal-500 text-white shadow-sm"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Result
      </button>
    </div>
  );
}
