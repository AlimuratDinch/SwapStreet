import { render, screen } from "@testing-library/react";
import { act } from "react";
import BrowsePage, { fetchClothingItems } from "@/app/browse/page";
import { JSX } from "react";

// Type definition for clothing items
type ClothingItem = {
  id: number;
  title: string;
  description: string;
  images?: Array<{ imageUrl: string }>;
  condition: string;
  price: number;
};

interface CardItemProps {
  title: string;
  imgSrc?: string;
  price: number;
}

// Mock the BrowseElements components
jest.mock("@/app/browse/BrowseElements", () => ({
  Header: () => <div data-testid="header">Header</div>,
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
  CardItem: ({ title, imgSrc, price }: CardItemProps) => (
    <div data-testid="card-item">
      <h4>{title}</h4>
      <span>{price}</span>
      {imgSrc && <span data-testid="img-src">{imgSrc}</span>}
    </div>
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("fetchClothingItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch items with no filters", async () => {
    const mockItems: ClothingItem[] = [
      {
        id: 1,
        title: "Test Item",
        description: "Test Description",
        images: [{ imageUrl: "/test.jpg" }],
        condition: "New",
        price: 50,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    const result = await fetchClothingItems(Promise.resolve({}));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend:8080/api/search/search",
      {
        cache: "no-store",
      },
    );
    expect(result).toEqual(mockItems);
  });

  it("should fetch items with all filters applied", async () => {
    const mockItems: ClothingItem[] = [
      {
        id: 1,
        title: "Filtered Item",
        description: "Test Description",
        images: [{ imageUrl: "/test.jpg" }],
        condition: "Like New",
        price: 75,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    const result = await fetchClothingItems(
      Promise.resolve({
        minPrice: "50",
        maxPrice: "100",
        categoryId: "2",
        conditions: "Like New,New",
      }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend:8080/api/search/search?minPrice=50&maxPrice=100&categoryId=2&conditions=Like+New%2CNew",
      {
        cache: "no-store",
      },
    );
    expect(result).toEqual(mockItems);
  });

  it("should fetch items with partial filters", async () => {
    const mockItems: ClothingItem[] = [];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    const result = await fetchClothingItems(
      Promise.resolve({
        minPrice: "20",
        categoryId: "3",
      }),
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend:8080/api/search/search?minPrice=20&categoryId=3",
      {
        cache: "no-store",
      },
    );
    expect(result).toEqual(mockItems);
  });

  it("should return empty array on fetch error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = await fetchClothingItems(Promise.resolve({}));

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch clothing items:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("should return empty array on network error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = await fetchClothingItems(Promise.resolve({}));

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch clothing items:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("should use NEXT_PUBLIC_API_URL when available", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://custom-api:3000";

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchClothingItems(Promise.resolve({}));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://custom-api:3000/api/search/search",
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });
});

describe("BrowsePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page structure with header, sidebar, and main content", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    let container: HTMLElement | null = null;
    await act(async () => {
      const res = render((<BrowsePage />) as unknown as JSX.Element);
      container = res.container;
    });

    expect(await screen.findByTestId("header")).toBeInTheDocument();
    expect(await screen.findByTestId("sidebar")).toBeInTheDocument();
    expect(container!.querySelector("main")).toBeInTheDocument();
  });

  it("should render add button", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    let container2: HTMLElement | null = null;
    await act(async () => {
      const res = render((<BrowsePage />) as unknown as JSX.Element);
      container2 = res.container;
    });

    expect(container2!.querySelector("main")).toBeInTheDocument();
  });

  it("should show 'No items available' when no items returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render((<BrowsePage />) as unknown as JSX.Element);
    });

    expect(await screen.findByText("No items available.")).toBeInTheDocument();
  });

  it("should render CardItem components for each item", async () => {
    const mockItems = [
      {
        id: 1,
        title: "Item 1",
        description: "Description 1",
        images: [{ imageUrl: "/img1.jpg" }],
        condition: "New",
        price: 25,
      },
      {
        id: 2,
        title: "Item 2",
        description: "Description 2",
        images: [{ imageUrl: "/img2.jpg" }],
        condition: "Used",
        price: 15,
      },
      {
        id: 3,
        title: "Item 3",
        description: "Description 3",
        images: [{ imageUrl: "/img3.jpg" }],
        condition: "Like New",
        price: 35,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    await act(async () => {
      render((<BrowsePage />) as unknown as JSX.Element);
    });

    const cardItems = await screen.findAllByTestId("card-item");
    expect(cardItems).toHaveLength(3);

    // Check that items are rendered
    expect(await screen.findByText("Item 1")).toBeInTheDocument();
    expect(await screen.findByText("Item 2")).toBeInTheDocument();
    expect(await screen.findByText("Item 3")).toBeInTheDocument();

    // Check that the img sources are rendered correctly
    const imgSources = await screen.findAllByTestId("img-src");
    expect(imgSources[0]).toHaveTextContent("/img1.jpg");
    expect(imgSources[1]).toHaveTextContent("/img2.jpg");
    expect(imgSources[2]).toHaveTextContent("/img3.jpg");
  });

  it("should pass correct props to CardItem components", async () => {
    const mockItems = [
      {
        id: 1,
        title: "Test Item",
        description: "Test Description",
        images: [{ imageUrl: "/test.jpg" }],
        condition: "New",
        price: 50,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    await act(async () => {
      render((<BrowsePage />) as unknown as JSX.Element);
    });

    expect(await screen.findByText("Test Item")).toBeInTheDocument();
    expect(await screen.findByTestId("img-src")).toHaveTextContent("/test.jpg");
  });

  it("should handle items without images", async () => {
    const mockItems = [
      {
        id: 1,
        title: "No Image Item",
        description: "No image",
        images: [],
        condition: "New",
        price: 10,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    await act(async () => {
      render((<BrowsePage />) as unknown as JSX.Element);
    });

    expect(await screen.findByText("No Image Item")).toBeInTheDocument();
    expect(screen.queryByTestId("img-src")).not.toBeInTheDocument();
  });

  it("should apply correct CSS classes for layout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    let container3: HTMLElement | null = null;
    await act(async () => {
      const res = render((<BrowsePage />) as unknown as JSX.Element);
      container3 = res.container;
    });

    const mainContainer = container3!.querySelector(".flex.flex-col.h-screen");
    expect(mainContainer).toBeInTheDocument();

    const main = container3!.querySelector("main");
    expect(main).toHaveClass(
      "pt-24",
      "flex-1",
      "overflow-y-auto",
      "p-6",
      "grid",
    );
  });
});
