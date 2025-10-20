import { render, screen, waitFor } from "@testing-library/react";
import BrowsePage, { fetchClothingItems } from "@/app/browse/page";

// Type definition for clothing items
type ClothingItem = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  condition: string;
  price: number;
};

// Mock the BrowseElements components
jest.mock("@/app/browse/BrowseElements", () => ({
  Header: () => <div data-testid="header">Header</div>,
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
  CardItem: ({ title, description, imgSrc, price }: any) => (
    <div data-testid="card-item">
      <h4>{title}</h4>
      <p>{description}</p>
      <span>{price}</span>
      {imgSrc && <img src={imgSrc} alt={title} />}
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
        imageUrl: "/test.jpg",
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
      "http://backend:8080/api/catalog/items",
      {
        cache: "no-store",
        credentials: "include",
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
        imageUrl: "/test.jpg",
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
      "http://backend:8080/api/catalog/items?minPrice=50&maxPrice=100&categoryId=2&conditions=Like+New%2CNew",
      {
        cache: "no-store",
        credentials: "include",
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
      "http://backend:8080/api/catalog/items?minPrice=20&categoryId=3",
      {
        cache: "no-store",
        credentials: "include",
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
      "http://custom-api:3000/api/catalog/items",
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

    const { container } = render(
      await BrowsePage({ searchParams: Promise.resolve({}) }),
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  it("should render add button", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(
      await BrowsePage({ searchParams: Promise.resolve({}) }),
    );

    const addButton = container.querySelector('a[href="/add"]');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("+");
  });

  it("should display 'No items available' when no items returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(await BrowsePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("No items available.")).toBeInTheDocument();
  });

  it("should render CardItem components for each item", async () => {
    const mockItems = [
      {
        id: 1,
        title: "Item 1",
        description: "Description 1",
        imageUrl: "/img1.jpg",
        condition: "New",
        price: 25,
      },
      {
        id: 2,
        title: "Item 2",
        description: "Description 2",
        imageUrl: "/img2.jpg",
        condition: "Used",
        price: 15,
      },
      {
        id: 3,
        title: "Item 3",
        description: "Description 3",
        imageUrl: "/img3.jpg",
        condition: "Like New",
        price: 35,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    render(await BrowsePage({ searchParams: Promise.resolve({}) }));

    const cardItems = screen.getAllByTestId("card-item");
    expect(cardItems).toHaveLength(3);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Description 1")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();

    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Description 2")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();

    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.getByText("Description 3")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
  });

  it("should pass correct props to CardItem components", async () => {
    const mockItems = [
      {
        id: 1,
        title: "Test Item",
        description: "Test Description",
        imageUrl: "/test.jpg",
        condition: "New",
        price: 50,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    render(await BrowsePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Test Item")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByAltText("Test Item")).toHaveAttribute(
      "src",
      "/test.jpg",
    );
  });

  it("should handle items without images", async () => {
    const mockItems = [
      {
        id: 1,
        title: "No Image Item",
        description: "No image",
        imageUrl: "",
        condition: "New",
        price: 10,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems,
    });

    render(await BrowsePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("No Image Item")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should apply correct CSS classes for layout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(
      await BrowsePage({ searchParams: Promise.resolve({}) }),
    );

    const mainContainer = container.querySelector(".flex.flex-col.h-screen");
    expect(mainContainer).toBeInTheDocument();

    const main = container.querySelector("main");
    expect(main).toHaveClass(
      "pt-24",
      "flex-1",
      "overflow-y-auto",
      "p-6",
      "grid",
    );
  });
});
