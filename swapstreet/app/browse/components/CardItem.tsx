"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, MapPin } from "lucide-react";
import {
  addWardrobeItem,
  hasWardrobeItem,
  removeWardrobeItem,
} from "../../wardrobe/wardrobeStorage";
import "./CardItemStyle.css";

interface CardItemProps {
  id: string;
  title: string;
  imgSrc?: string;
  price: number;
  fsa: string;
  href?: string;
}

export function CardItem({
  id,
  title,
  imgSrc,
  price,
  fsa,
  href,
}: CardItemProps) {
  const [inWardrobe, setInWardrobe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInWardrobe(hasWardrobeItem(id));
  }, [id]);

  const handleAddToWardrobe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const method = inWardrobe ? "DELETE" : "POST";

      const res = await fetch(`${apiUrl}/wishlist/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (inWardrobe) {
          removeWardrobeItem(id);
          setInWardrobe(false);
        } else {
          addWardrobeItem({ id, title, price, imageUrl: imgSrc ?? null });
          setInWardrobe(true);
        }
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="card-item">
      <div className="card-item-image-container">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="card-item-image object-cover w-full h-full"
          />
        ) : (
          <div className="card-item-image-fallback">No Image</div>
        )}
      </div>
      <div className="card-item-content">
        <h4 className="card-item-title">{title}</h4>
        <div className="card-item-price-container">
          <p className="card-item-price">${price}</p>
          <p className="card-item-fsa">
            <MapPin size={12} />
            {fsa}
          </p>
          <button
            onClick={handleAddToWardrobe}
            disabled={isSaving}
            className="card-item-wardrobe-btn"
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

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
