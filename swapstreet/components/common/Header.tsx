"use client";
import Link from "next/link";
import Image from "next/image";
import { Shirt, Globe, Leaf, ShoppingBag, User } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const COLLECTIONS = [
  { title: "Tops", img: "/images/clothes_login_page.png" },
  { title: "Bottoms", img: "/images/clothes_login_page.png" },
  { title: "Accessories", img: "/images/clothes_login_page.png" },
];

export function Header({ showCenterNav = true }: { showCenterNav?: boolean }) {
  return (
    <header className="fixed top-0 left-0 right-0 shadow-sm px-6 py-2 flex items-center justify-between z-[100] bg-[#eae9ea]">
      <Logo />
      {showCenterNav && (
        <nav className="absolute left-1/2 -translate-x-1/2">
          <MainMenu />
        </nav>
      )}
      <ActionButtons />
    </header>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Shirt className="h-8 w-8 text-teal-500" />
      <Link href="/.." className="font-bold text-2xl">
        SWAPSTREET
      </Link>
    </div>
  );
}

function MainMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/browse" className={navigationMenuTriggerStyle()}>
            Featured
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Collections</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="bg-[#dadada] p-6 flex gap-6">
              {COLLECTIONS.map((item) => (
                <div key={item.title} className="flex flex-col items-center">
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={128}
                    height={128}
                    className="rounded-md object-cover"
                  />
                  <p className="uppercase text-[13px] mt-2">{item.title}</p>
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2 items-center">
      <Globe className="w-6 h-6 text-gray-400" />
      <Leaf className="w-6 h-6 text-gray-400" />
      <IconButton
        href="/wardrobe"
        icon={<ShoppingBag />}
        title="Shopping Bag"
      />
      <IconButton href="/profile" icon={<User />} title="Profile" />
    </div>
  );
}

function IconButton({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link href={href}>
      <button
        className="p-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
        title={title}
      >
        {icon}
      </button>
    </Link>
  );
}
