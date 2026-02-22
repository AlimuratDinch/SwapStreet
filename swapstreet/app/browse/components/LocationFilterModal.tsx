"use client";
import { useState } from "react";
import { X, Navigation } from "lucide-react";

type LocationResult = {
  lat: number;
  lng: number;
  radiusKm: number;
  name: string;
};

type Props = {
  onClose: () => void;
  onApply: (location: LocationResult) => void;
};

interface NavigatorWithPermissions extends Navigator {
  permissions: {
    query: (descriptor: { name: string }) => Promise<PermissionStatus>;
  };
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export function LocationFilterModal({ onClose, onApply }: Readonly<Props>) {
  const [fsa, setFsa] = useState("");
  const [radius, setRadius] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize + validate FSA
  const normalizeFSA = (input: string) =>
    input.toUpperCase().replaceAll(/\s/g, "").slice(0, 3);

  const isValidFsa = /^[A-Z]\d[A-Z]$/.test(fsa);

  const handleFsaLookup = async () => {
    if (!isValidFsa) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/location/lookup/${fsa}`);

      if (!res.ok) {
        throw new Error("Postal code not supported");
      }

      const data = await res.json();

      onApply({
        lat: data.lat,
        lng: data.lng,
        radiusKm: radius,
        name: data.name,
      });

      onClose();
    } catch (err) {
      console.error("FSA lookup error:", err);
      setError("Postal code not supported.");
    } finally {
      setLoading(false);
    }
  };

  const roundCoord = (value: number, decimals = 3) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };

  const handleUseMyLocation = async () => {
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }

    // Geolocation is OPTIONAL and user-initiated (button click) to center search results near the user.
    // We only use it for a local radius filter and do not store/persist coordinates.
    try {
      // Permission pre-check (not supported in all browsers)
      const navWithPermissions = navigator as NavigatorWithPermissions;
      if ("permissions" in navigator && navWithPermissions.permissions?.query) {
        const status = await navWithPermissions.permissions.query({
          name: "geolocation",
        });

        if (status.state === "denied") {
          setError(
            "Location permission is blocked. Enable it in your browser settings to use this feature.",
          );
          return;
        }
      }
    } catch {
      // If permission API fails, continue to prompt via getCurrentPosition.
    }

    navigator.geolocation.getCurrentPosition( //NOSONAR
      (position) => {
        // Reduce precision to minimize sensitive data exposure
        const lat = roundCoord(position.coords.latitude, 3);
        const lng = roundCoord(position.coords.longitude, 3);

        onApply({
          lat,
          lng,
          radiusKm: radius,
          name: "Current location",
        });

        onClose();
      },
      (geoError) => {
        // Don't use alert; provide a UI error message instead
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              "Permission denied. Please allow location access to use this.",
            );
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Your location is unavailable right now.");
            break;
          case geoError.TIMEOUT:
            setError("Timed out while retrieving your location.");
            break;
          default:
            setError("Unable to retrieve your location.");
        }
      },
      {
        enableHighAccuracy: false, // less sensitive + usually sufficient for radius search
        timeout: 8000,
        maximumAge: 60_000,
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl bg-white text-black shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold ">Change location</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-black hover:text-red-700" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Use my location */}
          <button
            onClick={handleUseMyLocation}
            className="flex w-full items-center gap-3 rounded-lg border
              shadow
              bg-white px-4 py-3 
              text-sm 
              hover:border-teal-400
              transition"
          >
            <Navigation className="h-4 w-4 text-teal-400" />
            Use my current location
          </button>

          {/* FSA input */}
          <div>
            <label htmlFor="fsa-input" className="text-sm text-black">
              Enter three first characters of postal code
            </label>
            <input
              id="fsa-input"
              value={fsa}
              onChange={(e) => setFsa(normalizeFSA(e.target.value))}
              placeholder="H3Z"
              maxLength={3}
              className="mt-1 w-full rounded-lg shadow bg-white px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {!isValidFsa && fsa.length > 0 && (
              <p className="mt-1 text-xs text-red-400">
                Invalid postal code format
              </p>
            )}
          </div>

          {/* Radius */}
          <div>
            <div className="flex justify-between text-sm text-back">
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

          {error && <p className="text-sm text-red-400">{error}</p>}
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
