import { render, screen } from "@testing-library/react";
import BrowsePage from "../../../app/browse/page";
import { getSearchResults } from "@/lib/api/browse";

// 1. Mock all dependencies strictly
jest.mock("@/lib/api/browse", () => ({
  getSearchResults: jest.fn(),
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

jest.mock("../../../../app/browse/components/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

jest.mock("../../../../app/browse/components/CreateListingFAB", () => ({
  CreateListingFAB: () => <div data-testid="fab" />,
}));

jest.mock("../../../../app/browse/components/InfiniteBrowse", () => {
  return function MockInfiniteBrowse({
    initialItems,
  }: {
    initialItems: any[];
  }) {
    return <div data-testid="infinite-browse">{initialItems.length}</div>;
  };
});

describe("BrowsePage Coverage Test", () => {
  const mockResponse = {
    items: [{ id: "1", title: "Test", price: 10 }],
    nextCursor: "next-123",
    hasNextPage: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSearchResults as jest.Mock).mockResolvedValue(mockResponse);
  });

  it("completes full server-side execution path", async () => {
    // We must pass searchParams as a Promise for Next.js 15
    const mockParams = Promise.resolve({ q: "Navy", minPrice: "10" });

    // EXECUTION: Await the async server component function directly
    const JSX = await BrowsePage({ searchParams: mockParams });

    // RENDERING: Render the resulting JSX
    render(JSX);

    // ASSERTIONS: Verify the data fetch logic was hit
    expect(getSearchResults).toHaveBeenCalledWith({
      q: "Navy",
      minPrice: "10",
    });

    // Verify layout orchestration
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("infinite-browse")).toHaveTextContent("1");
    expect(screen.getByTestId("fab")).toBeInTheDocument();
  });

  it("handles the edge case of missing searchParams", async () => {
    // Simulate a hit to /browse with no query strings
    const mockParams = Promise.resolve({});

    const JSX = await BrowsePage({ searchParams: mockParams });
    render(JSX);

    expect(getSearchResults).toHaveBeenCalledWith({});
    expect(screen.getByTestId("infinite-browse")).toBeInTheDocument();
  });
});
