"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";


export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm px-6 py-6 flex items-center justify-between z-[100]">
      {/* Logo */}
      <a href="/" className="font-semibold text-2xl">
        <span className="text-[#e98b2a]">SWAP</span>
        <span className="text-[#016c5d] italic">STREET</span>
      </a>

      {/* Navigation */}
      <nav className="relative">
        <ul className="flex items-center justify-center font-semibold">
          {/* Men Mega Menu */}
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
                      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
                    },
                    {
                      title: "Bottoms",
                      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
                    },
                    {
                      title: "Accessories",
                      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
                    },
                    {
                      title: "Portables",
                      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
                    },
										{
                      title: "Sale",
                      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
                    },
                  ].map((item) => (
                    <a
                      key={item.title}
                      href="#"
                      className="block group/item"
                    >
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
          {/* Women Mega Menu */}
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
                      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
                    },
                    {
                      title: "Bottoms",
                      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
                    },
                    {
                      title: "Accessories",
                      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
                    },
                    {
                      title: "Portables",
                      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
                    },
										{
                      title: "Sale",
                      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
                    },
                  ].map((item) => (
                    <a
                      key={item.title}
                      href="#"
                      className="block group/item"
                    >
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

      {/* Auth Links */}
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

// ---------- Search Bar ----------
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

// ---------- Sidebar ----------
export function Sidebar() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

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

  return (
    <aside className="w-64 bg-gray-100 border-r p-4 flex flex-col gap-6 pt-24">
      <SearchBar />
      <section>
        <h3 className="font-semibold mb-2">Filters</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/browse?category=${category.id}`}
              className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs"
            >
              {category.name}
            </a>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Option 1</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Option 2</span>
        </label>
      </section>
    </aside>
  );
}

// ---------- Card ----------
interface CardItemProps {
  title: string;
  description: string;
  imgSrc?: string;
}

export function CardItem({ title, description, imgSrc }: CardItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
