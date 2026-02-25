"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, DollarSign, MapPin, Search } from "lucide-react";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SearchBar } from "./SearchBar";
import { LocationFilterModal } from "./LocationFilterModal";
import { Portal } from "./Portal";

interface LocationResult {
  lat: number;
  lng: number;
  radiusKm: number;
}

export function BrowseSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);
  const { setOpen, state } = useSidebar();

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
  }, [minPriceVal, maxPriceVal, searchQuery, location, router]);

  const handleClear = () => {
    setMinPriceVal(0);
    setMaxPriceVal(999999);
    setSearchQuery("");
    setLocation(null);
  };

  return (
    <>
      <ShadcnSidebar collapsible="icon" side="left" className="border-r">
        <SidebarHeader className="pt-20">
          <div className="px-2 group-data-[collapsible=icon]:px-0">
            <div className="group-data-[collapsible=icon]:hidden">
              <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
            </div>
            {state === "collapsed" && (
              <SidebarMenuButton
                tooltip="Search"
                className="w-full justify-center"
                onClick={() => setOpen(true)}
              >
                <Search className="h-4 w-4" />
              </SidebarMenuButton>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 mb-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
              <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </SidebarGroupLabel>
              <button
                onClick={handleClear}
                className="text-xs hover:text-teal-500 group-data-[collapsible=icon]:hidden"
              >
                Clear
              </button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowPrice(!showPrice)}
                    tooltip="Price Range"
                    className="w-full justify-between"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Price Range
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden ${
                        showPrice ? "rotate-180" : ""
                      }`}
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {showPrice && (
                  <div className="px-2 mt-2 flex gap-2 group-data-[collapsible=icon]:hidden">
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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowLocationModal(true)}
                    tooltip="Location"
                    className="w-full justify-between"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Location
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ShadcnSidebar>
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
    </>
  );
}

// Export as Sidebar for backward compatibility
export const Sidebar = BrowseSidebar;

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
