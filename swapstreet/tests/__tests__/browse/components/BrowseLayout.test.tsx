import { render, screen } from "@testing-library/react";
import {
  BrowseLayout,
  BrowseSkeleton,
} from "@/app/browse/components/BrowseLayout";

// 1. Mock the UI Sidebar components
jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({ children, className }: any) => (
    <div data-testid="sidebar-inset" className={className}>
      {children}
    </div>
  ),
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Trigger</button>,
}));

// 2. Mock the functional sub-components
jest.mock("@/app/browse/components/Sidebar", () => ({
  BrowseSidebar: () => <div data-testid="mock-sidebar">Sidebar</div>,
}));

jest.mock("@/app/browse/components/InfiniteBrowse", () => ({
  __esModule: true,
  default: ({ initialItems }: any) => (
    <div data-testid="infinite-browse">Items: {initialItems.length}</div>
  ),
}));

jest.mock("@/app/browse/components/CreateListingFAB", () => ({
  CreateListingFAB: () => <button data-testid="fab">FAB</button>,
}));

describe("BrowseLayout Component", () => {
  const mockProps = {
    initialItems: [
      { id: "1", title: "Test Item 1" } as any,
      { id: "2", title: "Test Item 2" } as any,
    ],
    initialCursor: "next-page-123",
    initialHasNext: true,
    // Added params to match the new component signature
    params: { q: "" },
  };

  it("renders the full layout structure", () => {
    render(<BrowseLayout {...mockProps} />);

    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("infinite-browse")).toBeInTheDocument();
    expect(screen.getByTestId("fab")).toBeInTheDocument();

    // Verify props flow to InfiniteBrowse
    expect(screen.getByText("Items: 2")).toBeInTheDocument();
  });

  it("renders the skeleton correctly", () => {
    const { container } = render(<BrowseSkeleton />);

    // 3 Pulse elements per card * 12 cards = 36 pulse elements
    const skeletonItems = container.querySelectorAll(".animate-pulse");
    expect(skeletonItems.length).toBe(36);

    // FIX: Look for the grid container instead of a 'main' tag
    const gridContainer = container.querySelector(".grid");

    expect(gridContainer).not.toBeNull();
    expect(gridContainer).toHaveClass("grid-cols-1");
  });
});
