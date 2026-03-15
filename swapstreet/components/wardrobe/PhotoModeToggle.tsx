interface PhotoModeToggleProps {
  photoMode: "upload" | "model";
  onUpload: () => void;
  onModel: () => void;
}

export function PhotoModeToggle({ photoMode, onUpload, onModel }: PhotoModeToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
      <button
        onClick={onUpload}
        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          photoMode === "upload"
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Upload Photo
      </button>
      <button
        onClick={onModel}
        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          photoMode === "model"
            ? "bg-white shadow-sm text-gray-900"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Choose Model
      </button>
    </div>
  );
}
