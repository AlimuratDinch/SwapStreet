import { render, screen, fireEvent } from "@testing-library/react";
import { BrowseSidebar } from "@/app/browse/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Shadcn sidebar components
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
    <button onClick={onClick} data-testid="sidebar-menu-button">
      {children}
    </button>
  ),
  useSidebar: () => ({
    state: "expanded",
    setOpen: jest.fn(),
  }),
}));

// Mock Shadcn select components
jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, className }: any) => (
    <button className={className}>{children}</button>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Mock Radix UI (imported directly in Sidebar.tsx)
jest.mock("@radix-ui/react-select", () => ({}));

jest.mock("@/app/browse/components/Portal", () => ({
  Portal: ({ children }: any) => (
    <div data-testid="portal-root">{children}</div>
  ),
}));

jest.mock("@/app/browse/components/SearchBar", () => ({
  SearchBar: ({ onSearch, initialValue }: any) => (
    <input
      data-testid="search-input"
      value={initialValue}
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}));

jest.mock("@/app/browse/components/LocationFilterModal", () => ({
  LocationFilterModal: ({ onApply }: any) => (
    <button
      data-testid="apply-loc"
      onClick={() => onApply({ lat: 45.5, lng: -73.6, radiusKm: 10 })}
    >
      Apply Location
    </button>
  ),
}));

describe("BrowseSidebar Component", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  it("initializes state from URL parameters (Query and Location)", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => {
        const params: Record<string, string> = {
          q: "vintage",
          lat: "45.5",
          lng: "-73.6",
          radiusKm: "10",
        };
        return params[key] || null;
      },
    });

    const { container } = render(<BrowseSidebar />);

    const searchInput = screen.getByTestId("search-input") as HTMLInputElement;
    expect(searchInput.value).toBe("vintage");

    const indicator = container.querySelector(".bg-teal-500");
    expect(indicator).toBeInTheDocument();
  });

  it("updates URL when location is applied via modal", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });

    render(<BrowseSidebar />);

    // Click the Location button (contains icon + text, use regex)
    fireEvent.click(screen.getByText(/location/i));

    // Click Apply in mocked modal
    fireEvent.click(screen.getByTestId("apply-loc"));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("lat=45.5"),
      expect.objectContaining({ scroll: false }),
    );
  });

  it("clears all filters when 'Clear All' is clicked", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "q" ? "shoes" : null),
    });

    render(<BrowseSidebar />);

    // Button text is now "Clear All"
    fireEvent.click(screen.getByText("Clear All"));

    expect(mockReplace).toHaveBeenCalledWith("/browse", { scroll: false });
  });

  it("syncs search query changes to the URL", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });

    render(<BrowseSidebar />);

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "jacket" },
    });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("q=jacket"),
      { scroll: false },
    );
  });
});