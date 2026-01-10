"use client";

import {
  Search,
  Leaf,
  ShoppingBag,
  Globe,
  User,
  ChevronDown,
  Shirt, 
  Star,
  X,
  MapPin, 
  Navigation,
} from "lucide-react";

import { 
  useState, 
  useEffect 
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
      className="fixed top-0 left-0 right-0 shadow-sm px-6 py-4 flex items-center justify-between z-[100]"
      style={{ backgroundColor: "#eae9ea" }}
    >
      <div className="flex items-center gap-3">
        <Shirt className="h-8 w-8 text-teal-500" />
        <Link href="/browse" className="font-bold text-2xl tracking-tight">
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

      <div className="flex gap-5">
        <Globe className="w-5.5 h-5.5 cursor-pointer" />
        <Leaf className="w-5.5 h-5.5 cursor-pointer" />
        <Link href="/wardrobe">
          <ShoppingBag className="w-5.5 h-5.5 cursor-pointer" />
        </Link>
        <User className="w-5.5 h-5.5 cursor-pointer" />
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
  // Fixed category options per design request
  const [categories] = useState<{ id: number; name: string }[]>([
    { id: 1, name: "Tops" },
    { id: 2, name: "Bottoms" },
    { id: 3, name: "Dresses/One-Pieces" },
    { id: 4, name: "Footwear" },
    { id: 5, name: "Accessories" },
  ]);

  // Numeric price values used by the slider UI
  const [minPriceVal, setMinPriceVal] = useState<number>(0);
  const [maxPriceVal, setMaxPriceVal] = useState<number>(100);
  const [conditions, setConditions] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showPrice, setShowPrice] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCondition, setShowCondition] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    radiusKm: number;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("categoryId");
    if (cat) setCategoryId(cat);
  }, [searchParams]);

  useEffect(() => {
    const _fetchCategories = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/catalog/categories`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        // Do not override the fixed category list; keep API fetch for future use if needed
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    // _fetchCategories();
  }, []);

  useEffect(() => {
    // Sync initial conditions from URL
    const conditionsParam = searchParams.get("conditions");
    if (conditionsParam) {
      setConditions(conditionsParam.split(",").map((c) => c.trim()));
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (minPriceVal) params.set("minPrice", minPriceVal.toString());
    if (maxPriceVal) params.set("maxPrice", maxPriceVal.toString());
    if (selectedSize) params.set("size", selectedSize);
    if (conditions.length > 0) params.set("conditions", conditions.join(","));
    if (location) {
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("radiusKm", location.radiusKm.toString());
    }
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  }, [categoryId, minPriceVal, maxPriceVal, selectedSize, conditions, router]);

  const handleConditionToggle = (condition: string) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  const clearFilters = () => {
    setMinPriceVal(0);
    setMaxPriceVal(100);
    setSelectedSize(null);
    setConditions([]);
    setCategoryId(null);
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
        {/* Size selector (always visible) */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Size</h4>
          <div className="grid grid-cols-3 gap-2">
            {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
              <button
                key={s}
                onClick={() =>
                  setSelectedSize((prev) => (prev === s ? null : s))
                }
                className={`rounded p-2 text-xs text-center transition hover:bg-teal-500 hover:text-white ${
                  selectedSize === s ? "bg-teal-500 text-white" : "bg-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-black my-3" />

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
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowCategories((s) => !s)}
          >
            <h4 className="text-sm font-medium">Categories</h4>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showCategories ? "rotate-180" : ""}`}
            />
          </button>
          {showCategories && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setCategoryId(category.id.toString());
                  }}
                  className={`rounded p-2 text-xs text-center transition hover:bg-teal-500 hover:text-white ${
                    categoryId === category.id.toString()
                      ? "bg-teal-500 text-white"
                      : "bg-gray-300"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-black my-3" />
        <div>
          <button
            className="w-full flex items-center justify-between mb-2"
            onClick={() => setShowCondition((s) => !s)}
          >
            <h4 className="text-sm font-medium">Condition</h4>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showCondition ? "rotate-180" : ""}`}
            />
          </button>
          {showCondition && (
            <div>
              {["New", "Like New", "Used", "Good"].map((condition) => (
                <label
                  key={condition}
                  className={`flex items-center gap-2 rounded p-2 text-xs transition ease-in-out bg-[#d9d9d9]`}
                >
                  <input
                    type="checkbox"
                    className="accent-teal-500 ml-2 w-4 h-4"
                    checked={conditions.includes(condition)}
                    onChange={() => {
                      handleConditionToggle(condition);
                    }}
                  />
                  <span>{condition}</span>
                </label>
              ))}
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

export function CardItem({ title, imgSrc, price, condition }: CardItemProps) {
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
      {/* Bottom section with title, condition, and price */}
      <div className="card-item-content">
        <h4 className="card-item-title">{title}</h4>
        <p className="card-item-condition">{condition}</p>
        <div className="card-item-price-container">
          <p className="card-item-price">${price}</p>
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
  condition?: string;
}

interface LocationResult {
  lat: number;
  lng: number;
  radiusKm: number;
}
