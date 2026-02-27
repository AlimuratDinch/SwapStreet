import { render, screen, fireEvent } from "@testing-library/react";
import { BrowseSidebar } from "@/app/browse/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mocking Shadcn components and custom sub-components
jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: any) => <nav>{children}</nav>,
  SidebarHeader: ({ children }: any) => <div>{children}</div>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: any) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  useSidebar: () => ({
    state: "expanded",
    setOpen: jest.fn(),
    open: true,
    isMobile: false,
    toggleSidebar: jest.fn(),
  }),
}));

// Mock Sub-components to ensure we focus on Sidebar logic
jest.mock("@/app/browse/components/SearchBar", () => ({
  SearchBar: ({ onSearch }: any) => (
    <input
      data-testid="search-input"
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

jest.mock("@/app/browse/components/LocationFilterModal", () => ({
  LocationFilterModal: ({ onApply }: any) => (
    <button
      data-testid="apply-loc"
      onClick={() => onApply({ lat: 10, lng: 20, radiusKm: 5 })}
    >
      Apply Location
    </button>
  ),
}));

describe("Sidebar Component Coverage Fix", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  it("initializes state from URL parameters (Lines 58-60)", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => {
        if (key === "minPrice") return "100";
        if (key === "maxPrice") return "500";
        if (key === "q") return "test-query";
        return null;
      },
      toString: () => "minPrice=100&maxPrice=500&q=test-query",
    });

    render(<BrowseSidebar />);

    // Expand price to check values
    fireEvent.click(screen.getByText("Price Range"));
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("500")).toBeInTheDocument();
  });

  it("updates URL when location is applied (Lines 66-69)", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
      toString: () => "",
    });

    render(<BrowseSidebar />);

    // Trigger Location Modal
    fireEvent.click(screen.getByText("Location"));

    // Click the mocked "Apply" button inside the modal
    const applyBtn = screen.getByTestId("apply-loc");
    fireEvent.click(applyBtn);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("lat=10&lng=20&radiusKm=5"),
      expect.any(Object),
    );
  });

  it("clears all filters when 'Clear' is clicked (Line 84)", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
      toString: () => "",
    });

    render(<BrowseSidebar />);

    const clearBtn = screen.getByText("Clear");
    fireEvent.click(clearBtn);

    // Should reset to defaults
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=0&maxPrice=999999"),
      expect.any(Object),
    );
  });

  it("handles empty input in PriceInput (Lines 158-161)", async () => {
    render(<BrowseSidebar />);
    fireEvent.click(screen.getByText("Price Range"));

    const minInput = screen.getByDisplayValue("0");
    // Simulate clearing the input (empty string)
    fireEvent.change(minInput, { target: { value: "" } });

    // The component logic `Number(e.target.value) || 0` should convert "" to 0
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=0"),
      expect.any(Object),
    );
  });
});
