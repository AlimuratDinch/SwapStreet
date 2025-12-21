"use client";

import { Search, Leaf, ShoppingBag, Globe, User } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 shadow-sm px-6 py-4 flex items-center justify-between z-[100]"
      style={{ backgroundColor: "#eae9ea" }}
    >
      <Link href="/browse" className="font-bold text-2xl tracking-tight">
        <span>SWAP</span>
        <span>STREET</span>
      </Link>

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
                      { title: "Tops", img: "/images/clothes_login_page.png" },
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

      <div className="flex gap-5">
        <Globe className="w-5.5 h-5.5 cursor-pointer" />
        <Leaf className="w-5.5 h-5.5 cursor-pointer" />
        <ShoppingBag className="w-5.5 h-5.5 cursor-pointer" />
        <User className="w-5.5 h-5.5 cursor-pointer" />
      </div>
    </header>
  );
}

export function SearchBar() {
  return (
    <div className="flex items-center border rounded px-2 py-1 bg-white">
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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("categoryId");
    if (cat) setCategoryId(cat);
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/catalog/categories`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
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
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (conditions.length > 0) params.set("conditions", conditions.join(","));
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  }, [categoryId, minPrice, maxPrice, conditions, router]);

  const handleConditionToggle = (condition: string) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setConditions([]);
    setCategoryId(null);
    router.push("/browse");
  };

  return (
    <aside className="w-64 bg-[#d9d9d9] border-r p-4 flex flex-col gap-6 pt-24">
      <SearchBar />
      <section>
        <h3 className="font-semibold mb-2">Filters</h3>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Price Range</h4>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
              }}
              className="border p-2 w-full"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
              }}
              className="border p-2 w-full"
            />
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-1">Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setCategoryId(category.id.toString());
                }}
                className={`rounded p-2 text-xs hover:bg-gray-400 ${
                  categoryId === category.id.toString()
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Condition</h4>
          {["New", "Like New", "Used", "Good"].map((condition) => (
            <label key={condition} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.includes(condition)}
                onChange={() => {
                  handleConditionToggle(condition);
                }}
              />
              <span>{condition}</span>
            </label>
          ))}
        </div>
        <button
          onClick={clearFilters}
          className=" bg-red-200 rounded p-2 text-sm font-medium transition ease-in-out hover:scale-[1.03]"
        >
          Clear Filters
        </button>
      </section>
    </aside>
  );
}

export function CardItem({ title, description, imgSrc, price }: CardItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition ease-in-out hover:scale-[1.03]">
      <div className="bg-gray-200 h-40 flex items-center justify-center">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            width={200}
            height={200}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-400">Image</span>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
        <p className="mt-2 font-bold">${price}</p>
      </div>
    </div>
  );
}

// ---------- Card ----------
interface CardItemProps {
  title: string;
  description: string;
  imgSrc?: string;
  price: number;
}
