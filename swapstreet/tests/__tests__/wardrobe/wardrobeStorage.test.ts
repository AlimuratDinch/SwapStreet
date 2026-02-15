import {
  WARDROBE_STORAGE_KEY,
  addWardrobeItem,
  hasWardrobeItem,
  readWardrobeItems,
  removeWardrobeItem,
  type WardrobeItem,
} from "@/app/wardrobe/wardrobeStorage";

describe("wardrobeStorage", () => {
  const itemA: WardrobeItem = {
    id: "item-a",
    title: "Jacket",
    price: 25,
    imageUrl: "https://example.com/a.jpg",
  };

  const itemB: WardrobeItem = {
    id: "item-b",
    title: "Shoes",
    price: 40,
    imageUrl: null,
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when storage is empty", () => {
    expect(readWardrobeItems()).toEqual([]);
  });

  it("returns an empty list when storage contains invalid JSON", () => {
    window.localStorage.setItem(WARDROBE_STORAGE_KEY, "{bad-json");
    expect(readWardrobeItems()).toEqual([]);
  });

  it("returns an empty list when storage contains a non-array payload", () => {
    window.localStorage.setItem(
      WARDROBE_STORAGE_KEY,
      JSON.stringify({ id: "x" }),
    );
    expect(readWardrobeItems()).toEqual([]);
  });

  it("filters out items without a string id", () => {
    window.localStorage.setItem(
      WARDROBE_STORAGE_KEY,
      JSON.stringify([
        itemA,
        { title: "No id", price: 5 },
        { id: 123, title: "Bad id type", price: 8 },
      ]),
    );

    expect(readWardrobeItems()).toEqual([itemA]);
  });

  it("adds a new item to the front of the stored list", () => {
    window.localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify([itemB]));

    const result = addWardrobeItem(itemA);
    expect(result).toEqual([itemA, itemB]);
    expect(readWardrobeItems()).toEqual([itemA, itemB]);
  });

  it("does not add duplicate items by id", () => {
    window.localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify([itemA]));

    const result = addWardrobeItem({ ...itemA, title: "Updated title" });
    expect(result).toEqual([itemA]);
    expect(readWardrobeItems()).toEqual([itemA]);
  });

  it("checks whether an item exists by id", () => {
    window.localStorage.setItem(
      WARDROBE_STORAGE_KEY,
      JSON.stringify([itemA, itemB]),
    );

    expect(hasWardrobeItem("item-a")).toBe(true);
    expect(hasWardrobeItem("missing-id")).toBe(false);
  });

  it("removes an item by id and persists the change", () => {
    window.localStorage.setItem(
      WARDROBE_STORAGE_KEY,
      JSON.stringify([itemA, itemB]),
    );

    const result = removeWardrobeItem("item-a");
    expect(result).toEqual([itemB]);
    expect(readWardrobeItems()).toEqual([itemB]);
  });

  it("returns unchanged items when removing an unknown id", () => {
    window.localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify([itemA]));

    const result = removeWardrobeItem("missing-id");
    expect(result).toEqual([itemA]);
    expect(readWardrobeItems()).toEqual([itemA]);
  });
});
