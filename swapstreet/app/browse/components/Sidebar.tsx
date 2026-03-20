"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Filter,
  MapPin,
  Search,
  Tag,
  Layers,
  Star,
  Box,
  Palette,
  PiggyBank,
} from "lucide-react";

// --- Shadcn UI Imports ---
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Custom Components ---
import { SearchBar } from "./SearchBar";
import { LocationFilterModal } from "./LocationFilterModal";
import { Portal } from "./Portal";

// --- Fix: Re-type shadcn Select sub-components to accept children ---
const SafeSelectTrigger = SelectTrigger as React.ComponentType<
  React.ComponentPropsWithoutRef<typeof SelectTrigger> & {
    children?: React.ReactNode;
    className?: string;
  }
>;

const SafeSelectContent = SelectContent as React.ComponentType<
  React.ComponentPropsWithoutRef<typeof SelectContent> & {
    children?: React.ReactNode;
    className?: string;
  }
>;

const SafeSelectItem = SelectItem as React.ComponentType<
  React.ComponentPropsWithoutRef<typeof SelectItem> & {
    children?: React.ReactNode;
    key?: string;
    value: string;
  }
>;

// --- Constant Data (Matched to C# Enums) ---
const CATEGORIES = [
  "Bottoms",
  "Tops",
  "Footwear",
  "Accessory",
  "Outerwear",
  "Formalwear",
  "Sportswear",
];
const COLOURS = [
  // Basic Colors
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Grey",

  // Metallics / Neutrals
  "Beige",
  "Silver",
  "Gold",

  // Patterns / Other
  "Clear",
  "MultiColor",
];
const CONDITIONS = ["New", "LikeNew", "UsedExcellent", "UsedGood", "UsedFair"];
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "NA"];
const BRANDS = [
  "Nike",
  "HandM",
  "Zara",
  "Addidas",
  "Carhartt",
  "Dickies",
  "Puma",
  "Gap",
  "Vans",
  "NewBalance",
  "Lululemon",
  "Other",
];

const plurals: Record<string, string> = {
  Category: "Categories",
  Brand: "Brands",
  Condition: "Conditions",
  Size: "Sizes",
  Colour: "Colours",
};

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

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [condition, setCondition] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [colour, setColour] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 1. Initialize state from URL on mount
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setCategory(searchParams.get("category") || "all");
    setCondition(searchParams.get("condition") || "all");
    setSize(searchParams.get("size") || "all");
    setBrand(searchParams.get("brand") || "all");
    setColour(searchParams.get("colour") || "all");
    setMaxPrice(
      searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : null,
    );
    setMinPrice(
      searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : null,
    );

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

  // 2. Sync state to URL when filters change
  useEffect(() => {
    if (!isInitialized.current) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (category !== "all") params.set("category", category);
    if (condition !== "all") params.set("condition", condition);
    if (size !== "all") params.set("size", size);
    if (brand !== "all") params.set("brand", brand);
    if (colour !== "all") params.set("colour", colour);
    if (maxPrice !== null) params.set("maxPrice", maxPrice.toString());
    if (minPrice !== null) params.set("minPrice", minPrice.toString());

    if (location) {
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("radiusKm", location.radiusKm.toString());
    }

    const queryString = params.toString();
    router.replace(`/browse${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [
    searchQuery,
    location,
    category,
    condition,
    size,
    brand,
    colour,
    maxPrice,
    minPrice,
    router,
  ]);

  const handleClear = () => {
    setSearchQuery("");
    setLocation(null);
    setCategory("all");
    setCondition("all");
    setSize("all");
    setBrand("all");
    setColour("all");
    setMaxPrice(null);
    setMinPrice(null);
  };

  return (
    <>
      <ShadcnSidebar collapsible="icon" side="left" className="border-r">
        <SidebarHeader className="pt-4">
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

        <SidebarContent className="px-2">
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 mb-4 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleClear}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Clear All
              </button>
            </div>

            <SidebarGroupContent>
              <SidebarMenu className="gap-4">
                {/* Location Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowLocationModal(true)}
                    tooltip="Location"
                    className="w-full justify-between border bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Location
                      </span>
                    </div>
                    {location && (
                      <div className="w-2 h-2 rounded-full bg-teal-500 group-data-[collapsible=icon]:hidden" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Filter Dropdowns */}
                <FilterSelect
                  label="Category"
                  icon={<Layers className="h-3.5 w-3.5" />}
                  value={category}
                  onValueChange={setCategory}
                  options={CATEGORIES}
                />

                <FilterSelect
                  label="Brand"
                  icon={<Tag className="h-3.5 w-3.5" />}
                  value={brand}
                  onValueChange={setBrand}
                  options={BRANDS}
                />

                <FilterSelect
                  label="Condition"
                  icon={<Star className="h-3.5 w-3.5" />}
                  value={condition}
                  onValueChange={setCondition}
                  options={CONDITIONS}
                />

                <FilterSelect
                  label="Size"
                  icon={<Box className="h-3.5 w-3.5" />}
                  value={size}
                  onValueChange={setSize}
                  options={SIZES}
                />

                <FilterSelect
                  label="Colour"
                  icon={<Palette className="h-3.5 w-3.5" />}
                  value={colour}
                  onValueChange={setColour}
                  options={COLOURS}
                />

                {/* Price Range Slider */}
                <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                  <div className="px-2 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <PiggyBank className="h-3.5 w-3.5" />
                      <span>Price Range</span>
                    </label>

                    {/* Min Price Input */}
                    <div>
                      <input
                        type="number"
                        placeholder="Min price"
                        value={minPrice ?? ""}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                        className="w-full h-9 px-3 text-sm border rounded bg-background border-input focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    {/* Max Price Input */}
                    <div>
                      <input
                        type="number"
                        placeholder="Max price"
                        value={maxPrice ?? ""}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                        className="w-full h-9 px-3 text-sm border rounded bg-background border-input focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
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

// --- FilterSelect Helper Component ---
interface FilterSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onValueChange: (val: string) => void;
  options: string[];
}

function FilterSelect({
  label,
  icon,
  value,
  onValueChange,
  options,
}: FilterSelectProps) {
  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
      <div className="px-2 space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </label>
        <Select value={value} onValueChange={onValueChange}>
          <SafeSelectTrigger className="h-9 w-full bg-background border-input focus:ring-1 focus:ring-teal-500">
            <SelectValue placeholder={`Select ${label}`} />
          </SafeSelectTrigger>
          <SafeSelectContent className="max-h-[250px] overflow-y-auto">
            <SafeSelectItem value="all">
              All {plurals[label] ?? label}
            </SafeSelectItem>
            {options.map((opt) => (
              <SafeSelectItem key={opt} value={opt}>
                {/* Visual cleanup: "HandM" -> "H and M", "UsedExcellent" -> "Used Excellent" */}
                {opt.replace(/([A-Z])/g, " $1").trim()}
              </SafeSelectItem>
            ))}
          </SafeSelectContent>
        </Select>
      </div>
    </SidebarMenuItem>
  );
}

export const Sidebar = BrowseSidebar;
