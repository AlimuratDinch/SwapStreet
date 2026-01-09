import { useState } from "react";
import { 
    X, 
    Navigation,
} from "lucide-react";

type LocationResult = {
//   city: string;
//   provinceCode: string;
  lat: number;
  lng: number;
  radiusKm: number;
};

type Props = {
  onClose: () => void;
  onApply: (location: LocationResult) => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function LocationFilterModal({ onClose, onApply, }: Props) {
  const [fsa, setFsa] = useState("");
  const [radius, setRadius] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize + validate FSA
    const normalizeFSA = (input: string) =>
    input
        .toUpperCase()
        .replace(/\s/g, "")
        .slice(0, 3);

  const isValidFsa = /^[A-Z]\d[A-Z]$/.test(fsa);

  const handleFsaLookup = async () => {
    
    if (!isValidFsa) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_URL}/api/location/lookup/${fsa}`
      );

      if (!res.ok) {
        throw new Error("Postal code not supported");
      }

      const data = await res.json();

      onApply({
        // city: data.city,
        // provinceCode: data.provinceCode,
        lat: data.lat,
        lng: data.lng,
        radiusKm: radius,
      });

      onClose();
    } catch (err) {
      setError("Postal code not supported.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onApply({
        //   city: "Current location",
        //   provinceCode: "",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusKm: radius,
        });
        
        onClose();
      },
        (error) => {
        console.error(error);
        alert("Unable to retrieve your location");
        }
    );
    
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl bg-neutral-900 text-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold">Change location</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-neutral-400 hover:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Use my location */}
          <button
            onClick={handleUseMyLocation}
            className="flex w-full items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm hover:bg-neutral-700"
          >
            <Navigation className="h-4 w-4 text-teal-400" />
            Use my current location
          </button>

          {/* FSA input */}
          <div>
            <label className="text-sm text-neutral-400">
              Enter postal code (FSA)
            </label>
            <input
              value={fsa}
              onChange={(e) => setFsa(normalizeFSA(e.target.value))}
              placeholder="H3Z"
              maxLength={3}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {!isValidFsa && fsa.length > 0 && (
              <p className="mt-1 text-xs text-red-400">
                Invalid postal code format
              </p>
            )}
          </div>

          {/* Radius */}
          <div>
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Radius</span>
              <span>{radius} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-4">
          <button
            disabled={!isValidFsa || loading}
            onClick={handleFsaLookup}
            className="w-full rounded-lg bg-teal-500 py-3 text-sm font-semibold text-black disabled:opacity-40"
          >
            {loading ? "Searching..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
