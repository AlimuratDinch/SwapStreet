"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { LocationFilterModal } from "./LocationFilterModal";
import { Portal } from "./Portal";

interface LocationResult {
  lat: number;
  lng: number;
  radiusKm: number;
}

export function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);

  const [minPriceVal, setMinPriceVal] = useState(0);
  const [maxPriceVal, setMaxPriceVal] = useState(999999);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrice, setShowPrice] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    radiusKm: number;
  } | null>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setMinPriceVal(Number(searchParams.get("minPrice")) || 0);
    setMaxPriceVal(Number(searchParams.get("maxPrice")) || 999999);
    isInitialized.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!isInitialized.current) return;
    const params = new URLSearchParams();
    params.set("minPrice", minPriceVal.toString());
    params.set("maxPrice", maxPriceVal.toString());
    if (searchQuery) params.set("q", searchQuery);
    if (location) {
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("radiusKm", location.radiusKm.toString());
    }
    router.replace(`/browse?${params.toString()}`, { scroll: false });
  }, [minPriceVal, maxPriceVal, searchQuery, router]);

  return (
    <aside className="w-64 bg-[#d9d9d9] p-4 flex flex-col gap-6 pt-24 h-screen sticky top-0">
      <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
      <section>
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold">Filters</h3>
          <button
            onClick={() => {
              setMinPriceVal(0);
              setMaxPriceVal(999999);
              setSearchQuery("");
            }}
            className="text-xs hover:text-teal-500"
          >
            Clear
          </button>
        </div>
        <button
          className="w-full flex justify-between items-center mb-2 hover:text-teal-500 transition"
          onClick={() => setShowPrice(!showPrice)}
        >
          <span className="text-sm font-medium">Price Range</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showPrice ? "rotate-180" : ""}`}
          />
        </button>
        {showPrice && (
          <div className="mt-2 flex gap-2">
            <PriceInput
              label="Min"
              value={minPriceVal}
              onChange={setMinPriceVal}
            />
            <PriceInput
              label="Max"
              value={maxPriceVal}
              onChange={setMaxPriceVal}
            />
          </div>
        )}
        <button
          onClick={() => setShowLocationModal(true)}
          className="w-full flex items-center justify-between mb-2 hover:text-teal-500 transition"
        >
          <h4 className="text-sm font-medium">Location</h4>
        </button>
        {showLocationModal && (
          <Portal>
            <LocationFilterModal
              onClose={() => setShowLocationModal(false)}
              onApply={(loc: LocationResult) => {
                setLocation(loc);
                setShowLocationModal(false);
              }}
            />
          </Portal>
        )}
      </section>
    </aside>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex-1">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-transparent border-0 py-1 text-sm focus:outline-none"
      />
    </label>
  );
}
