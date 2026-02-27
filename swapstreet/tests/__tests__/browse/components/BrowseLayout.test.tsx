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
    <div className={className}>{children}</div>
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
  };

  it("renders the full layout structure (Coverage for Lines 18-42)", () => {
    render(<BrowseLayout {...mockProps} />);

    // Check if the Provider and Inset are present
    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();

    // Check if child components are rendered
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("infinite-browse")).toBeInTheDocument();
    expect(screen.getByTestId("fab")).toBeInTheDocument();

    // Verify props are passed down correctly to InfiniteBrowse
    expect(screen.getByText("Items: 2")).toBeInTheDocument();
  });

  it("renders the skeleton (Coverage for Lines 45-58)", () => {
    const { container } = render(<BrowseSkeleton />);

    const skeletonItems = container.querySelectorAll(".animate-pulse");

    expect(skeletonItems.length).toBe(36);
    expect(container.querySelector("main")).toHaveClass("grid-cols-1");
  });
});
