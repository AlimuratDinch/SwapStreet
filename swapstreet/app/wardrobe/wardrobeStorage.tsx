export type WardrobeItem = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
};

export const WARDROBE_STORAGE_KEY = "wardrobeItems";

function readRaw(): WardrobeItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WARDROBE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string");
  } catch {
    return [];
  }
}

function writeRaw(items: WardrobeItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(items));
}

export function readWardrobeItems(): WardrobeItem[] {
  return readRaw();
}

export function hasWardrobeItem(id: string): boolean {
  return readRaw().some((item) => item.id === id);
}

export function addWardrobeItem(item: WardrobeItem): WardrobeItem[] {
  const items = readRaw();
  if (items.some((existing) => existing.id === item.id)) return items;
  const next = [item, ...items];
  writeRaw(next);
  return next;
}

export function removeWardrobeItem(id: string): WardrobeItem[] {
  const items = readRaw().filter((item) => item.id !== id);
  writeRaw(items);
  return items;
}
