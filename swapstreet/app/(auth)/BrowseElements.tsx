"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm px-6 py-6 flex items-center justify-between z-[100]">
      <a href="/" className="font-semibold text-2xl">
        <span className="text-[#e98b2a]">SWAP</span>
        <span className="text-[#016c5d] italic">STREET</span>
      </a>
      <nav className="relative">
        <ul className="flex items-center justify-center font-semibold">
          <li className="px-3 py-2">
            <button className="hover:opacity-50">Featured</button>
          </li>
          <li className="relative group px-3 py-2">
            <button className="hover:opacity-50 cursor-default">Men</button>
            <div
              className="fixed left-0 right-0 top-[80px] transition-all duration-500 ease-in-out 
                         opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50"
            >
              <div className="bg-white rounded-xl shadow-xl p-10 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-5 gap-12">
                  {[
                    {
                      title: "Tops",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Bottoms",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Accessories",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Portables",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Sale",
                      img: "/images/dummy-item.jpg",
                    },
                  ].map((item) => (
                    <a key={item.title} href="#" className="block group/item">
                      <p className="uppercase tracking-wider text-gray-500 font-medium text-[13px] mb-3">
                        {item.title}
                      </p>
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full aspect-square object-cover rounded-xl shadow-sm 
                                   transition-transform duration-300 ease-in-out 
                                   group-hover/item:scale-[1.03]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </li>
          <li className="relative group px-3 py-2">
            <button className="hover:opacity-50 cursor-default">Women</button>
            <div
              className="fixed left-0 right-0 top-[80px] transition-all duration-500 ease-in-out 
                         opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50"
            >
              <div className="bg-white rounded-xl shadow-xl p-10 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-5 gap-12">
                  {[
                    {
                      title: "Tops",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Bottoms",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Accessories",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Portables",
                      img: "/images/dummy-item.jpg",
                    },
                    {
                      title: "Sale",
                      img: "/images/dummy-item.jpg",
                    },
                  ].map((item) => (
                    <a key={item.title} href="#" className="block group/item">
                      <p className="uppercase tracking-wider text-gray-500 font-medium text-[13px] mb-3">
                        {item.title}
                      </p>
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full aspect-square object-cover rounded-xl shadow-sm 
                                   transition-transform duration-300 ease-in-out 
                                   group-hover/item:scale-[1.03]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <nav>
        <ul className="flex items-center justify-center font-semibold space-x-2">
          <li>
            <a
              href="#"
              className="rounded-full px-3 py-2 font-semibold bg-white bg-opacity-10 flex items-center group"
            >
              <span className="mr-2">Log in</span>
              <svg
                className="stroke-current"
                width="10"
                height="10"
                strokeWidth="2"
                viewBox="0 0 10 10"
                aria-hidden="true"
              >
                <g fillRule="evenodd">
                  <path
                    className="opacity-0 group-hover:opacity-100 transition ease-in-out duration-200"
                    d="M0 5h7"
                  ></path>
                  <path
                    className="opacity-100 group-hover:translate-x-1 transition ease-in-out duration-200"
                    d="M1 1l4 4-4 4"
                  ></path>
                </g>
              </svg>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="rounded-full px-3 py-2 font-semibold bg-white bg-opacity-10 flex items-center group"
            >
              <span className="mr-2">Sign up</span>
              <svg
                className="stroke-current"
                width="10"
                height="10"
                strokeWidth="2"
                viewBox="0 0 10 10"
                aria-hidden="true"
              >
                <g fillRule="evenodd">
                  <path
                    className="opacity-0 group-hover:opacity-100 transition ease-in-out duration-200"
                    d="M0 5h7"
                  ></path>
                  <path
                    className="opacity-100 group-hover:translate-x-1 transition ease-in-out duration-200"
                    d="M1 1l4 4-4 4"
                  ></path>
                </g>
              </svg>
            </a>
          </li>
        </ul>
      </nav>
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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/catalog/categories`, {
          cache: "no-store",
          credentials: "include"
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

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    if (conditions.length > 0) params.set("conditions", conditions.join(","));
    else params.delete("conditions");
    router.push(`/browse?${params.toString()}`);
  };

  const handleConditionToggle = (condition: string) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setConditions([]);
    router.push("/browse");
  };

  return (
    <aside className="w-64 bg-gray-100 border-r p-4 flex flex-col gap-6 pt-24">
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
                handleFilterChange();
              }}
              className="border p-2 w-full"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                handleFilterChange();
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
                  const params = new URLSearchParams(searchParams);
                  params.set("categoryId", category.id.toString());
                  router.push(`/browse?${params.toString()}`);
                }}
                className={`rounded p-2 text-xs hover:bg-gray-400 ${
                  searchParams.get("categoryId") === category.id.toString()
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
                  handleFilterChange();
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

export function CardItem({ title, description, imgSrc }: CardItemProps) {
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
      </div>
    </div>
  );
}

interface CardItemProps {
  title: string;
  description: string;
  imgSrc?: string;
}

// ---------- Card ----------
interface CardItemProps {
  title: string;
  description: string;
  imgSrc?: string;
}

