import { render, screen } from "@testing-library/react";
import BrowsePage from "@/app/browse/page";
import { getSearchResults } from "@/lib/api/browse";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
// 1. Mock all dependencies strictly
jest.mock("@/lib/api/browse", () => ({
  getSearchResults: jest.fn(),
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

jest.mock("@/app/browse/components/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

jest.mock("@/app/browse/components/BrowseLayout", () => ({
  BrowseLayout: ({ initialItems }: any) => (
    <div data-testid="layout">Items: {initialItems.length}</div>
  ),
}));

jest.mock("@/app/browse/components/CreateListingFAB", () => ({
  CreateListingFAB: () => <div data-testid="fab" />,
}));

jest.mock("@/app/browse/components/InfiniteBrowse", () => {
  return function MockInfiniteBrowse({
    initialItems,
  }: {
    initialItems: any[];
  }) {
    return <div data-testid="infinite-browse">{initialItems.length}</div>;
  };
});

describe("BrowsePage Server Component", () => {
  const mockItems = [{ id: "1", title: "Test Item" }];

  beforeEach(() => {
    jest.clearAllMocks();
    (getSearchResults as jest.Mock).mockResolvedValue({
      items: mockItems,
      nextCursor: null,
      hasNextPage: false,
    });
  });

  it("awaits searchParams and fetches data", async () => {
    const searchParams = Promise.resolve({ q: "bike" });

    const PageJSX = await BrowsePage({ searchParams });
    render(PageJSX);

    expect(getSearchResults).toHaveBeenCalledWith({ q: "bike" });

    // Instead of "layout", check for the infinite-browse mock we created
    expect(screen.getByTestId("infinite-browse")).toHaveTextContent("1");
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });
});
