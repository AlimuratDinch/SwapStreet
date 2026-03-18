interface ModelSelectorProps {
  selectedGender: "male" | "female" | null;
  selectedSkinTone: "light" | "medium" | "dark" | null;
  selectedBodyType: "slim" | "average" | "plus" | null;
  onGenderChange: (gender: "male" | "female") => void;
  onSkinToneChange: (tone: "light" | "medium" | "dark") => void;
  onBodyTypeChange: (type: "slim" | "average" | "plus") => void;
  onResetAll: () => void;
  onResetSkinTone: () => void;
  onResetBodyType: () => void;
}

export function ModelSelector({
  selectedGender,
  selectedSkinTone,
  selectedBodyType,
  onGenderChange,
  onSkinToneChange,
  onBodyTypeChange,
  onResetAll,
  onResetSkinTone,
  onResetBodyType,
}: ModelSelectorProps) {
  return (
    <div
      className={`shrink-0 bg-gray-50 rounded-lg ${
        selectedGender && selectedSkinTone && selectedBodyType ? "p-2" : "p-3"
      }`}
    >
      {/* Breadcrumb row */}
      {(selectedGender || selectedSkinTone || selectedBodyType) && (
        <div className="flex items-center gap-1 text-xs flex-wrap">
          {selectedGender && (
            <button
              onClick={onResetAll}
              className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors capitalize"
            >
              {selectedGender}
            </button>
          )}
          {selectedSkinTone && (
            <>
              <span className="text-gray-400">›</span>
              <button
                onClick={onResetSkinTone}
                className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors capitalize"
              >
                {selectedSkinTone}
              </button>
            </>
          )}
          {selectedBodyType && (
            <>
              <span className="text-gray-400">›</span>
              <button
                onClick={onResetBodyType}
                className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors capitalize"
              >
                {selectedBodyType}
              </button>
            </>
          )}
        </div>
      )}

      {/* Gender Selection */}
      {!selectedGender && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Gender</p>
          <div className="flex gap-2">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => onGenderChange(g)}
                className="flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-teal-500 hover:text-teal-700 transition-colors capitalize"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skin Tone Selection */}
      {selectedGender && !selectedSkinTone && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Skin Tone</p>
          <div className="flex gap-2">
            {(["light", "medium", "dark"] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => onSkinToneChange(tone)}
                className="flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-teal-500 hover:text-teal-700 transition-colors"
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body Type Selection */}
      {selectedGender && selectedSkinTone && !selectedBodyType && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Body Type</p>
          <div className="flex gap-2">
            {(["slim", "average", "plus"] as const).map((bt) => (
              <button
                key={bt}
                onClick={() => onBodyTypeChange(bt)}
                className="flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-teal-500 hover:text-teal-700 transition-colors capitalize"
              >
                {bt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
