"use client";
export const dynamic = "force-dynamic";
import {
  Search,
  Leaf,
  ShoppingBag,
  Globe,
  User,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shirt } from "lucide-react";
import Link from "next/link";
import {
  addWardrobeItem,
  hasWardrobeItem,
  removeWardrobeItem,
} from "../wardrobe/wardrobeStorage";
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
        <Link href="/.." className="font-bold text-2xl tracking-tight">
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

export function SearchBar({
  onSearch,
  initialValue = "",
}: {
  onSearch: (val: string) => void;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(value);
    }
  };

  return (
    <div className="flex items-center border border-black rounded px-2 py-1 bg-white">
      <Search className="w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSearch(value)}
        className="ml-2 outline-none w-full bg-transparent text-sm"
      />
    </div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // const [categories] = useState<{ id: number; name: string }[]>([
  //   { id: 1, name: "Tops" },
  //   { id: 2, name: "Bottoms" },
  //   { id: 3, name: "Dresses/One-Pieces" },
  //   { id: 4, name: "Footwear" },
  //   { id: 5, name: "Accessories" },
  // ]);

  const [minPriceVal, setMinPriceVal] = useState<number>(0);
  const [maxPriceVal, setMaxPriceVal] = useState<number>(999999);
  // const [conditions, setConditions] = useState<string[]>([]);
  // const [categoryId, setCategoryId] = useState<string | null>(null);
  // const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showPrice, setShowPrice] = useState(false);
  // const [showCategories, setShowCategories] = useState(false);
  // const [showCondition, setShowCondition] = useState(false);

  // Use ref to track if we're initializing from URL
  const isInitialized = useRef(false);

  // Initialize state from URL params (runs once on mount)
  useEffect(() => {
    // const cat = searchParams.get("categoryId");
    const q = searchParams.get("q") || "";
    // const conditionsParam = searchParams.get("conditions");
    // const sizeParam = searchParams.get("size");
    const minP = searchParams.get("minPrice");
    const maxP = searchParams.get("maxPrice");

    // setCategoryId(cat);
    setSearchQuery(q);

    // if (conditionsParam) {
    //   setConditions(conditionsParam.split(",").map((c) => c.trim()));
    // }

    // setSelectedSize(sizeParam);

    if (minP) {
      const v = Number(minP);
      if (!isNaN(v)) setMinPriceVal(v);
    }

    if (maxP) {
      const v = Number(maxP);
      if (!isNaN(v)) setMaxPriceVal(v);
    }

    isInitialized.current = true;
  }, [searchParams]);

  // Update URL when filters change (but only after initialization)
  useEffect(() => {
    if (!isInitialized.current) return;

    const params = new URLSearchParams();

    // Always include price range for consistent filtering
    params.set("minPrice", minPriceVal.toString());
    params.set("maxPrice", maxPriceVal.toString());
    if (searchQuery) params.set("q", searchQuery);

    router.replace(`/browse?${params.toString()}`, {
      scroll: false,
    });
  }, [
    // categoryId,
    minPriceVal,
    maxPriceVal,
    // selectedSize,
    // conditions,
    searchQuery,
    router,
  ]);

  // const handleConditionToggle = (condition: string) => {
  //   setConditions((prev) =>
  //     prev.includes(condition)
  //       ? prev.filter((c) => c !== condition)
  //       : [...prev, condition],
  //   );
  // };

  const clearFilters = () => {
    setMinPriceVal(0);
    setMaxPriceVal(999999);
    // setSelectedSize(null);
    // setConditions([]);
    // setCategoryId(null);
    setSearchQuery("");
  };

  return (
    <aside className="w-64 bg-[#d9d9d9] border-r p-4 flex flex-col gap-6 pt-24 h-screen overflow-y-auto sticky top-0">
      <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />

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

        {/* Price inputs */}
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
                      setMinPriceVal(Number.isNaN(v) ? 0 : v);
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
                      setMaxPriceVal(Number.isNaN(v) ? 999999 : v);
                    }}
                    className="w-full bg-[#d9d9d9] border-0 py-1 text-sm focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

export function CardItem({ id, title, imgSrc, price, href }: CardItemProps) {
  const [inWardrobe, setInWardrobe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInWardrobe(hasWardrobeItem(id));
  }, [id]);

  const handleAddToWardrobe = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        console.error("Missing access token for wishlist request.");
        return;
      }
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const method = inWardrobe ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/wishlist/${id}`, {
        method,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errBody = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Failed to add to wishlist:", res.status, errBody);
        return;
      }
      if (inWardrobe) {
        removeWardrobeItem(id);
        setInWardrobe(false);
      } else {
        addWardrobeItem({
          id,
          title,
          price,
          imageUrl: imgSrc ?? null,
        });
        setInWardrobe(true);
      }
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="card-item">
      {/* Square image container */}
      <div className="card-item-image-container">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            width={300}
            height={300}
            className="card-item-image object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="card-item-image-fallback">Image</div>
        )}
      </div>
      {/* Bottom section with title and price */}
      <div className="card-item-content">
        <h4 className="card-item-title">{title}</h4>
        <div className="card-item-price-container">
          <p className="card-item-price">${price}</p>
          <button
            type="button"
            className="card-item-wardrobe-btn"
            title={inWardrobe ? "In wardrobe" : "Add to wardrobe"}
            aria-pressed={inWardrobe}
            onClick={handleAddToWardrobe}
            disabled={isSaving}
          >
            <ShoppingBag
              className="w-5 h-5"
              fill={inWardrobe ? "#14b8a6" : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

interface CardItemProps {
  id: string;
  title: string;
  imgSrc?: string;
  price: number;
  href?: string;
}
