/**
 * @jest-environment jsdom
 */
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  Header,
  SearchBar,
  Sidebar,
  CardItem,
} from "@/app/browse/BrowseElements";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

// ---------------- Mocks ----------------

// Mocking Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mocking Lucide icons to avoid unnecessary SVG rendering issues in JSDOM
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon" />,
  ChevronDown: ({ className }: { className: string }) => (
    <div data-testid="chevron-icon" className={className} />
  ),
  Shirt: () => <div />,
  Globe: () => <div />,
  Leaf: () => <div />,
  ShoppingBag: () => <div />,
  User: () => <div />,
}));

const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Setup default mock returns
  (useRouter as jest.Mock).mockReturnValue({
    replace: mockReplace,
    push: jest.fn(),
  });

  // CRITICAL: Ensure useSearchParams returns an object with a .get method to prevent the crash
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));
});

// ---------------- Tests ----------------

describe("SearchBar Component", () => {
  it("calls onSearch when Enter is pressed", () => {
    const onSearchMock = jest.fn();
    render(<SearchBar onSearch={onSearchMock} />);

    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "vintage tee " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSearchMock).toHaveBeenCalledWith("vintage tee"); // Trims whitespace
  });
});

describe("Sidebar Component", () => {
  const renderSidebar = async () => {
    let result;
    await act(async () => {
      result = render(<Sidebar />);
    });
    // Clear the initial URL sync call so it doesn't pollute interaction tests
    mockReplace.mockClear();
    return result;
  };

  it("updates the URL when a size is selected", async () => {
    await renderSidebar();

    const sizeM = screen.getByText("M");
    fireEvent.click(sizeM);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("size=M"),
        expect.anything(),
      );
    });
  });

  it("expands the Price Range and updates min/max values", async () => {
    await renderSidebar();

    const priceToggle = screen.getByRole("button", { name: /Price Range/i });
    fireEvent.click(priceToggle);

    const minInput = screen.getByDisplayValue("0"); // Default min
    fireEvent.change(minInput, { target: { value: "20" } });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("minPrice=20"),
        expect.anything(),
      );
    });
  });

  it("clears all filters when the Clear button is clicked", async () => {
    await renderSidebar();

    const clearBtn = screen.getByText("Clear");
    fireEvent.click(clearBtn);

    await waitFor(() => {
      // Should reset to base path or default params
      expect(mockReplace).toHaveBeenCalledWith("/browse", expect.anything());
    });
  });

  it("initializes state correctly from URL params", async () => {
    // Mock URL: ?categoryId=1&size=XL
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("categoryId=1&size=XL"),
    );

    await act(async () => {
      render(<Sidebar />);
    });

    const sizeXL = screen.getByText("XL");
    // Should have the active styling class
    expect(sizeXL).toHaveClass("bg-teal-500");
  });
});

describe("CardItem Component", () => {
  it("renders the title and price correctly", () => {
    render(<CardItem title="Cool Jacket" price={45} />);

    expect(screen.getByText("Cool Jacket")).toBeInTheDocument();
    expect(screen.getByText("$45")).toBeInTheDocument();
  });

  it("renders a fallback when no image is provided", () => {
    render(<CardItem title="No Image Item" price={10} />);
    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
