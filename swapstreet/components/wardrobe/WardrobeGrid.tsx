import Image from "next/image";
import { Star, X, FileText } from "lucide-react";
import type { WardrobeItem } from "@/app/wardrobe/wardrobeStorage";

interface WardrobeGridProps {
  items: WardrobeItem[];
  selectedItemId: string | null;
  favorites: Set<string>;
  isRemoving: Set<string>;
  onSelectItem: (itemId: string | null) => void;
  onToggleFavorite: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onViewDetails: (itemId: string) => void;
}

export function WardrobeGrid({
  items,
  selectedItemId,
  favorites,
  isRemoving,
  onSelectItem,
  onToggleFavorite,
  onRemoveItem,
  onViewDetails,
}: WardrobeGridProps) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-12">
      {items.length === 0 && (
        <div className="col-span-full text-center text-gray-500">
          Your wardrobe is empty. Add items from Browse.
        </div>
      )}
      {items.map((item) => {
        const safePrice = Number.isFinite(item.price) ? item.price : 0;
        return (
          <div
            key={item.id}
            onClick={() =>
              onSelectItem(item.id === selectedItemId ? null : item.id)
            }
            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer ${
              selectedItemId === item.id
                ? "ring-2 ring-teal-500 ring-offset-2"
                : ""
            }`}
          >
            <div className="relative bg-gray-100 flex items-center justify-center aspect-square">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
              {selectedItemId === item.id && (
                <div className="absolute inset-0 bg-teal-500/10" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                className={`absolute top-3 left-3 p-1.5 bg-white/80 rounded-full transition-all ${
                  favorites.has(item.id)
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <Star
                  className={`w-5 h-5 ${
                    favorites.has(item.id)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from wardrobe"
                disabled={isRemoving.has(item.id)}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(item.id);
                }}
                className="absolute bottom-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                title="View details"
              >
                <FileText className="w-5 h-5 text-gray-600" />
              </button>

            </div>
            <div className="p-4 flex-1">
              <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                {item.title}
              </div>
              <div className="text-sm text-gray-600">
                ${safePrice.toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
