// tests/__tests__/browse/page.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import BrowsePage from "@/app/browse/page";
import { getSearchResults } from "@/lib/api/browse";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 1. Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: () => ({ replace: jest.fn() }),
}));

// 2. Mock the API utility
jest.mock("@/lib/api/browse", () => ({
  getSearchResults: jest.fn(),
}));

// 3. Mock the Header to avoid AuthContext errors
jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="mock-header" />,
}));

// 4. Mock the Sidebar and FAB
jest.mock("@/app/browse/components/Sidebar", () => ({
  Sidebar: () => <div data-testid="mock-sidebar" />,
}));

jest.mock("@/app/browse/components/CreateListingFAB", () => ({
  CreateListingFAB: () => <div data-testid="mock-fab" />,
}));

// 5. Mock InfiniteBrowse
jest.mock("@/app/browse/components/InfiniteBrowse", () => {
  return function MockInfiniteBrowse() {
    return <div data-testid="infinite-browse" />;
  };
});

// 6. Mock Sidebar UI components
jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({ children }: any) => <div>{children}</div>,
  SidebarTrigger: () => <button />,
}));

describe("BrowsePage Client Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock URL with a query: ?q=bike
    const mockSearchParams = new URLSearchParams("q=bike");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    // Ensure the API returns a valid structure
    (getSearchResults as jest.Mock).mockResolvedValue({
      items: [{ id: "1", title: "Bike" }],
      nextCursor: null,
      hasNextPage: false,
    });
  });

  it("renders and calls API based on URL params", async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    // Verify the API was called with the correct params
    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ q: "bike" }),
      );
    });

    // FIX: Use findBy instead of getBy to wait for the state transition
    // from Skeleton -> InfiniteBrowse
    const infiniteBrowse = await screen.findByTestId("infinite-browse");

    expect(infiniteBrowse).toBeInTheDocument();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();
  });

  it("parses and passes category filter to API", async () => {
    const mockSearchParams = new URLSearchParams("category=Tops");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Tops" }),
      );
    });
  });

  it("parses and passes brand filter to API", async () => {
    const mockSearchParams = new URLSearchParams("brand=Nike");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ brand: "Nike" }),
      );
    });
  });

  it("parses and passes condition filter to API", async () => {
    const mockSearchParams = new URLSearchParams("condition=New");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ condition: "New" }),
      );
    });
  });

  it("parses and passes size filter to API", async () => {
    const mockSearchParams = new URLSearchParams("size=M");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ size: "M" }),
      );
    });
  });

  it("parses and passes colour filter to API", async () => {
    const mockSearchParams = new URLSearchParams("colour=Black");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ colour: "Black" }),
      );
    });
  });

  it("parses and passes minPrice filter to API as float", async () => {
    const mockSearchParams = new URLSearchParams("minPrice=25.50");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 25.5 }),
      );
    });
  });

  it("parses and passes maxPrice filter to API as float", async () => {
    const mockSearchParams = new URLSearchParams("maxPrice=150.99");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ maxPrice: 150.99 }),
      );
    });
  });

  it("parses location filters (lat, lng, radiusKm) to API", async () => {
    const mockSearchParams = new URLSearchParams(
      "lat=45.5017&lng=-73.5673&radiusKm=20",
    );
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 45.5017,
          lng: -73.5673,
          radiusKm: 20,
        }),
      );
    });
  });

  it("handles empty search params gracefully", async () => {
    const mockSearchParams = new URLSearchParams("");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
      toString: () => "",
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({
          q: undefined,
          category: undefined,
          brand: undefined,
        }),
      );
    });
  });

  it("combines multiple filters in a single request", async () => {
    const mockSearchParams = new URLSearchParams(
      "q=jacket&category=Outerwear&brand=Nike&size=L&minPrice=50&maxPrice=200",
    );
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "jacket",
          category: "Outerwear",
          brand: "Nike",
          size: "L",
          minPrice: 50,
          maxPrice: 200,
        }),
      );
    });
  });

  it("displays InfiniteBrowse with initial items and cursor data", async () => {
    const mockItems = [
      { id: "1", title: "Item 1" },
      { id: "2", title: "Item 2" },
    ];

    (getSearchResults as jest.Mock).mockResolvedValue({
      items: mockItems,
      nextCursor: "cursor-123",
      hasNextPage: true,
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    const infiniteBrowse = await screen.findByTestId("infinite-browse");
    expect(infiniteBrowse).toBeInTheDocument();
  });

  it("displays empty items when API returns empty array", async () => {
    (getSearchResults as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    const infiniteBrowse = await screen.findByTestId("infinite-browse");
    expect(infiniteBrowse).toBeInTheDocument();
  });

  it("handles API error gracefully and displays fallback", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (getSearchResults as jest.Mock).mockRejectedValueOnce(
      new Error("API Error"),
    );

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    // Component should still render even with API error
    await waitFor(() => {
      expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Initial fetch failed:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("refetches when search params change", async () => {
    const mockSearchParams1 = new URLSearchParams("q=bike");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams1.get(key),
      toString: () => mockSearchParams1.toString(),
    });

    const { rerender } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ q: "bike" }),
      );
    });

    // Change search params
    const mockSearchParams2 = new URLSearchParams("q=shoes");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams2.get(key),
      toString: () => mockSearchParams2.toString(),
    });

    rerender(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ q: "shoes" }),
      );
    });
  });

  it("displays loading skeleton initially", () => {
    let resolvePromise: any;
    (getSearchResults as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { container } = render(
      <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    // Component should show BrowseSkeleton during loading
    // The skeleton is the animate-pulse divs
    const skeletonItems = container.querySelectorAll(".animate-pulse");
    expect(skeletonItems.length).toBeGreaterThan(0);

    // Clean up
    resolvePromise({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });
  });

  it("prevents state updates after component unmount", async () => {
    let resolvePromise: any;
    (getSearchResults as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { unmount } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    // Unmount before API resolves
    unmount();

    // Resolve the API call after unmount
    resolvePromise({
      items: [{ id: "1", title: "Item" }],
      nextCursor: null,
      hasNextPage: false,
    });

    // Should not cause any errors about state updates
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Cannot update"),
    );

    consoleSpy.mockRestore();
  });

  it("renders with all components when loaded", async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-header")).toBeInTheDocument();
      expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("mock-fab")).toBeInTheDocument();
      expect(screen.getByTestId("infinite-browse")).toBeInTheDocument();
    });
  });

  it("uses default values for undefined price and location filters", async () => {
    const mockSearchParams = new URLSearchParams("q=jacket");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
      toString: () => mockSearchParams.toString(),
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <BrowsePage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(getSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: undefined,
          maxPrice: undefined,
          lat: undefined,
          lng: undefined,
          radiusKm: undefined,
        }),
      );
    });
  });
});
