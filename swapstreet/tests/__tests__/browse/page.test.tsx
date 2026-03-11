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
});
