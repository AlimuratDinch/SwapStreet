"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, MapPin, Search } from "lucide-react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState<LocationResult | null>(null);

  // 1. Initialize state from URL on mount
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radiusKm");

    if (lat && lng && radius) {
      setLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radiusKm: parseFloat(radius),
      });
    }

    isInitialized.current = true;
  }, [searchParams]);

  // 2. Sync state to URL
  useEffect(() => {
    if (!isInitialized.current) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) {
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("radiusKm", location.radiusKm.toString());
    }

    const queryString = params.toString();
    router.replace(`/browse${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [searchQuery, location, router]);

  const handleClear = () => {
    setSearchQuery("");
    setLocation(null);
  };

  return (
    <>
      <ShadcnSidebar collapsible="icon" side="left" className="border-r">
        <SidebarHeader className="pt-20">
          <div className="px-2 group-data-[collapsible=icon]:px-0">
            {/* Search Input - Hidden when collapsed */}
            <div className="group-data-[collapsible=icon]:hidden">
              <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
            </div>

            {/* Icon-only Search trigger for collapsed state */}
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
                className="text-xs text-gray-400 hover:text-teal-500 transition-colors group-data-[collapsible=icon]:hidden"
              >
                Clear
              </button>
            </div>

            <SidebarGroupContent>
              <SidebarMenu>
                {/* Location Filter */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowLocationModal(true)}
                    tooltip="Location"
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Location
                      </span>
                    </div>
                    {location && (
                      <div className="w-2 h-2 rounded-full bg-teal-500 group-data-[collapsible=icon]:hidden" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ShadcnSidebar>

      {/* Modals */}
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
