"use client";

import {
  Search,
  Leaf,
  ShoppingBag,
  Globe,
  User,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shirt, Star } from "lucide-react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import "./CardItemStyle.css";
import { LocationFilterModal } from "./LocationFilterModal";

type HeaderProps = {
  showCenterNav?: boolean;
};

export function Header({ showCenterNav = true }: HeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 shadow-sm px-6 py-2 flex items-center justify-between z-[100]"
      style={{ backgroundColor: "#eae9ea" }}
    >
      <div className="flex items-center gap-3">
        <Shirt className="h-8 w-8 text-teal-500" />
        <Link href="/" className="font-bold text-2xl tracking-tight">
          <span>SWAP</span>
          <span>STREET</span>
        </Link>
      </div>

      {showCenterNav && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href="/browse">Featured</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Collections</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="bg-[#dadada] rounded-md p-6 max-w-[720px] mx-auto">
                    <div className="flex gap-6">
                      {[
                        {
                          title: "Tops",
                          img: "/images/clothes_login_page.png",
                        },
                        {
                          title: "Bottoms",
                          img: "/images/clothes_login_page.png",
                        },
                        {
                          title: "Accessories",
                          img: "/images/clothes_login_page.png",
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="flex flex-col items-center"
                        >
                          <div className="w-32 h-32 mb-3 overflow-hidden rounded-md">
                            <Image
                              src={item.img}
                              alt={item.title}
                              width={128}
                              height={128}
                              className="w-32 h-32 object-cover"
                            />
                          </div>
                          <p className="uppercase tracking-wider text-gray-500 font-medium text-[13px] text-center">
                            {item.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <div className="p-2.5">
          <Globe className="w-6.5 h-6.5 text-gray-400" />
        </div>
        <div className="p-2.5">
          <Leaf className="w-6.5 h-6.5 text-gray-400" />
        </div>
        <Link href="/wardrobe">
          <button
            className="p-2 rounded-full bg-gray-300 transition-colors duration-200 hover:bg-gray-400"
            title="Shopping Bag"
          >
            <ShoppingBag className="w-6.5 h-6.5 text-gray-600" />
          </button>
        </Link>
        <Link href="/profile">
          <button
            className="p-2 rounded-full bg-gray-300 transition-colors duration-200 hover:bg-gray-400"
            title="Profile"
          >
            <User className="w-6.5 h-6.5 text-gray-600" />
          </button>
        </Link>
      </div>
    </header>
  );
}

export function SearchBar() {
  return (
    <div className="flex items-center border border-black rounded px-2 py-1 bg-white">
      <Search className="w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Search..."
        className="ml-2 outline-none w-full"
      />
    </div>
  );
}

export function Sidebar() {
  const [minPriceVal, setMinPriceVal] = useState<number>(0);
  const [maxPriceVal, setMaxPriceVal] = useState<number>(999999);
  const [showPrice, setShowPrice] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    radiusKm: number;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (minPriceVal) params.set("minPrice", minPriceVal.toString());
    if (maxPriceVal) params.set("maxPrice", maxPriceVal.toString());
    if (location) {
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("radiusKm", location.radiusKm.toString());
    }
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  }, [minPriceVal, maxPriceVal, router]);

  const clearFilters = () => {
    setMinPriceVal(0);
    setMaxPriceVal(999999);
    router.push("/browse");
  };

  return (
    <aside className="w-64 bg-[#d9d9d9] border-r p-4 flex flex-col gap-6 pt-24">
      <SearchBar />
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-black text-xs pb-1 font-medium transition-colors hover:text-teal-500"
          >
            Clear
          </button>
        </div>
        {/* Price inputs (collapsed by default) */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowPrice((s) => !s)}
          >
            <h4 className="text-sm font-medium">Price Range</h4>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showPrice ? "rotate-180" : ""}`}
            />
          </button>
          {showPrice && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">Min</div>
                  <input
                    type="number"
                    min={0}
                    value={minPriceVal}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const clamped = Number.isNaN(v)
                        ? 0
                        : Math.max(0, Math.min(v, maxPriceVal));
                      setMinPriceVal(clamped);
                    }}
                    className="w-full bg-[#d9d9d9] border-0 py-1 text-sm focus:outline-none"
                  />
                </label>
                <label className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">Max</div>
                  <input
                    type="number"
                    min={0}
                    value={maxPriceVal}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const clamped = Number.isNaN(v)
                        ? maxPriceVal
                        : Math.max(0, Math.max(v, minPriceVal));
                      setMaxPriceVal(clamped);
                    }}
                    className="w-full bg-[#d9d9d9] border-0 py-1 text-sm focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}
        </div>      
        <div className="h-px bg-black my-3" />
        <div>
          <button
          onClick={() => setShowLocationModal(true)}
          className="w-full flex items-center justify-between mb-2 hover:text-teal-500 transition"
          >
            <h4 className="text-sm font-medium">Location</h4>
          </button>
          {showLocationModal && (
          <LocationFilterModal
            onClose={() => setShowLocationModal(false)}
            onApply={(loc: LocationResult) => {
              setLocation(loc);
              setShowLocationModal(false);
            }}
          />
          )}
        </div>
      </section>
    </aside>
  );
}

export function CardItem({ title, imgSrc, price, fsa }: CardItemProps) {
  return (
    <div className="card-item">
      {/* Square image container */}
      <div className="card-item-image-container">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            width={200}
            height={200}
            className="card-item-image"
          />
        ) : (
          <span className="card-item-placeholder">Image</span>
        )}
      </div>
      {/* Bottom section with title and price */}
      <div className="card-item-content">
        <h4 className="card-item-title">{title}</h4>
        <div className="card-item-price-container">
          <p className="card-item-price">${price}</p>
          <p className="card-item-price">{fsa}</p>
          <button className="card-item-wishlist-btn" title="Add to wishlist">
            <Star className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Card ----------
interface CardItemProps {
  title: string;
  imgSrc?: string;
  price: number;
  fsa: string;
}

interface LocationResult {
  lat: number;
  lng: number;
  radiusKm: number;
}
