import { PhotoModeToggle } from "./PhotoModeToggle";
import { ImageDisplay } from "./ImageDisplay";
import { ModelSelector } from "./ModelSelector";
import { ToggleButtons } from "./ToggleButtons";
import { TryOnControls } from "./TryOnControls";
import { RecentResults } from "./RecentResults";

interface SidebarProps {
  photoMode: "upload" | "model";
  uploadedImage: string | null;
  generatedImage: string | null;
  modelImagePath: string | null;
  showOriginal: boolean;
  uploadProgress: boolean;
  loading: boolean;
  isViewingRecentResult: boolean;
  selectedItemId: string | null;
  selectedGender: "male" | "female" | null;
  selectedSkinTone: "light" | "medium" | "dark" | null;
  selectedBodyType: "slim" | "average" | "plus" | null;
  recentResults: string[];
  error: string | null;
  imageFrameRef: React.RefObject<HTMLDivElement | null>;
  mainImageInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoModeUpload: () => void;
  onPhotoModeModel: () => void;
  onUploadClick: () => void;
  onRemoveClick: () => void;
  onImageKeyDown: (e: React.KeyboardEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenderChange: (gender: "male" | "female") => void;
  onSkinToneChange: (tone: "light" | "medium" | "dark") => void;
  onBodyTypeChange: (type: "slim" | "average" | "plus") => void;
  onResetGender: () => void;
  onResetSkinTone: () => void;
  onResetBodyType: () => void;
  onShowOriginal: () => void;
  onShowResult: () => void;
  onSelectRecentResult: (imageUrl: string) => void;
  onTryOn: () => void;
  onDownload: () => void;
}

export function Sidebar({
  photoMode,
  uploadedImage,
  generatedImage,
  modelImagePath,
  showOriginal,
  uploadProgress,
  loading,
  isViewingRecentResult,
  selectedItemId,
  selectedGender,
  selectedSkinTone,
  selectedBodyType,
  recentResults,
  error,
  imageFrameRef,
  mainImageInputRef,
  onPhotoModeUpload,
  onPhotoModeModel,
  onUploadClick,
  onRemoveClick,
  onImageKeyDown,
  onImageUpload,
  onGenderChange,
  onSkinToneChange,
  onBodyTypeChange,
  onResetGender,
  onResetSkinTone,
  onResetBodyType,
  onShowOriginal,
  onShowResult,
  onSelectRecentResult,
  onTryOn,
  onDownload,
}: SidebarProps) {
  return (
    <aside className="w-[420px] bg-white border-r border-gray-200 h-[calc(100vh-4rem)] fixed top-16 left-0 p-4 flex flex-col gap-3 overflow-hidden">
      <PhotoModeToggle
        photoMode={photoMode}
        onUpload={onPhotoModeUpload}
        onModel={onPhotoModeModel}
      />

      <ImageDisplay
        photoMode={photoMode}
        uploadedImage={uploadedImage}
        generatedImage={generatedImage}
        modelImagePath={modelImagePath}
        showOriginal={showOriginal}
        uploadProgress={uploadProgress}
        imageFrameRef={imageFrameRef}
        onUploadClick={onUploadClick}
        onRemoveClick={onRemoveClick}
        onKeyDown={onImageKeyDown}
      />

      <input ref={mainImageInputRef} type="file" accept="image/*" onChange={onImageUpload} className="hidden" />

      {photoMode === "model" && (
        <ModelSelector
          selectedGender={selectedGender}
          selectedSkinTone={selectedSkinTone}
          selectedBodyType={selectedBodyType}
          onGenderChange={onGenderChange}
          onSkinToneChange={onSkinToneChange}
          onBodyTypeChange={onBodyTypeChange}
          onResetAll={onResetGender}
          onResetSkinTone={onResetSkinTone}
          onResetBodyType={onResetBodyType}
        />
      )}

      <ToggleButtons
        generatedImage={generatedImage}
        isViewingRecentResult={isViewingRecentResult}
        showOriginal={showOriginal}
        onOriginal={onShowOriginal}
        onResult={onShowResult}
      />

      <TryOnControls
        photoMode={photoMode}
        modelImagePath={modelImagePath}
        uploadedImage={uploadedImage}
        generatedImage={generatedImage}
        selectedItemId={selectedItemId}
        loading={loading}
        uploadProgress={uploadProgress}
        onTryOn={onTryOn}
        onDownload={onDownload}
      />

      <RecentResults results={recentResults} onSelectResult={onSelectRecentResult} />
    </aside>
  );
}
