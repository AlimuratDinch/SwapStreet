import { render, screen, fireEvent } from "@testing-library/react";
import { BrowseSidebar } from "@/app/browse/components/Sidebar"; // Ensure this matches your export
import { useRouter, useSearchParams } from "next/navigation";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/components/ui/sidebar", () => {
  const actual = jest.requireActual("react"); // Just in case
  return {
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
    // ADD THIS:
    useSidebar: () => ({
      state: "expanded",
      setOpen: jest.fn(),
      open: true,
      isMobile: false,
      toggleSidebar: jest.fn(),
    }),
  };
});

describe("Sidebar Component", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn(() => null),
      toString: () => "",
    });
  });

  it("renders the filter categories", () => {
    render(<BrowseSidebar />);
    expect(screen.getByText("Price Range")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
  });

  it("updates the URL when price filters are applied", async () => {
    render(<BrowseSidebar />);

    // 1. Expand the Price Range section
    const priceToggle = screen.getByText("Price Range");
    fireEvent.click(priceToggle);

    // 2. Find the input by its current display value "0"
    // Using findBy because there might be a transition/re-render
    const minInput = await screen.findByDisplayValue("0");

    fireEvent.change(minInput, { target: { value: "50" } });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=50"),
      expect.any(Object),
    );
  });
});
