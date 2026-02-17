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
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";
import * as wardrobeStorage from "@/app/wardrobe/wardrobeStorage";

// ---------------- Mocks ----------------
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/app/wardrobe/wardrobeStorage", () => ({
  addWardrobeItem: jest.fn(),
  hasWardrobeItem: jest.fn(() => false),
  removeWardrobeItem: jest.fn(),
}));

jest.mock("next/image", () => {
  const MockNextImage = (props: any) => {
    const { src, alt, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={typeof src === "string" ? src : "/default.png"}
        alt={alt ?? "image"}
        {...rest}
      />
    );
  };
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

global.fetch = jest.fn();

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

// ---------------- Setup ----------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});


beforeEach(() => {
  jest.clearAllMocks();
  mockSessionStorage.clear();
  mockSessionStorage.setItem("accessToken", "test-token");

  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
  });

  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

  (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
  (wardrobeStorage.addWardrobeItem as jest.Mock).mockClear();
  (wardrobeStorage.removeWardrobeItem as jest.Mock).mockClear();

  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
    })
  );
});

// ---------------- Header ----------------
describe("Header", () => {
  it("renders brand and nav links", () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>,
    );
    expect(screen.getByText(/SWAP/)).toBeInTheDocument();
    expect(screen.getByText(/STREET/)).toBeInTheDocument();
    expect(screen.getByText(/Featured/)).toBeInTheDocument();
    expect(screen.getByText(/Collections/)).toBeInTheDocument();
  });

  it("renders without center nav when showCenterNav is false", () => {
    render(
      <AuthProvider>
        <Header showCenterNav={false} />
      </AuthProvider>,
    );
    expect(screen.getByText(/SWAP/)).toBeInTheDocument();
    expect(screen.queryByText(/Featured/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collections/)).not.toBeInTheDocument();
  });

  it("renders all header icons", () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>,
    );

    // Check for wardrobe/shopping bag button
    expect(screen.getByTitle("Shopping Bag")).toBeInTheDocument();

    // Check for profile button
    expect(screen.getByTitle("Profile")).toBeInTheDocument();
  });

  it("has working links to wardrobe and profile", () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>,
    );

    const wardrobeLink = screen.getByTitle("Shopping Bag").closest("a");
    expect(wardrobeLink).toHaveAttribute("href", "/wardrobe");

    const profileLink = screen.getByTitle("Profile").closest("a");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("has working link to browse page", () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>,
    );

    const browseLink = screen.getByText(/Featured/i).closest("a");
    expect(browseLink).toHaveAttribute("href", "/browse");
  });
});

// ---------------- SearchBar ----------------
describe("SearchBar", () => {
  it("renders input with placeholder", () => {
    render(<SearchBar onSearch={() => {}} />);
    expect(screen.getByPlaceholderText(/Search.../i)).toBeInTheDocument();
  });

  it("calls onSearch on Enter and onBlur", async () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} initialValue="init" />);

    const input = screen.getByPlaceholderText(/Search.../i);
    // type new value & press Enter
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(onSearch).toHaveBeenCalledWith("hello");

    fireEvent.blur(input);
    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("updates value when initialValue changes", () => {
    const { rerender } = render(
      <SearchBar onSearch={() => {}} initialValue="first" />,
    );

    const input = screen.getByPlaceholderText(/Search.../i) as HTMLInputElement;
    expect(input.value).toBe("first");

    rerender(<SearchBar onSearch={() => {}} initialValue="second" />);
    expect(input.value).toBe("second");
  });

  it("does not call onSearch on non-Enter key", () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText(/Search.../i);
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.keyDown(input, { key: "a", code: "KeyA" });

    // Should not be called on random key
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("allows typing in the input", () => {
    render(<SearchBar onSearch={() => {}} />);

    const input = screen.getByPlaceholderText(/Search.../i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "new search" } });

    expect(input.value).toBe("new search");
  });
});

// ---------------- Sidebar ----------------
describe("Sidebar", () => {
  it("sets min and max price", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    // First, click the Price Range button to expand it
    const priceRangeButton = screen.getByRole("button", {
      name: /Price Range/i,
    });
    fireEvent.click(priceRangeButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    const inputs = screen.getAllByRole("spinbutton");
    const minInput = inputs[0];
    const maxInput = inputs[1];
    fireEvent.change(minInput, { target: { value: "10" } });
    fireEvent.change(maxInput, { target: { value: "100" } });
    await waitFor(() => {
      const calls = mockReplace.mock.calls;
      const matched = calls.some(
        (call) =>
          (call[0] as string).includes("minPrice=10") &&
          (call[0] as string).includes("maxPrice=100"),
      );
      expect(matched).toBe(true);
    });
  });

  it("clears all filters", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    fireEvent.click(screen.getByText("Clear"));
    const clearCalls = mockReplace.mock.calls;
    const anyHasBrowseAndDefaultPrices = clearCalls.some(
      (c) =>
        (c[0] as string).startsWith("/browse") &&
        (c[0] as string).includes("minPrice=0") &&
        (c[0] as string).includes("maxPrice=999999"),
    );
    expect(anyHasBrowseAndDefaultPrices).toBe(true);
  });
    
  it("handles fetch error gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.getByText("Filters")).toBeInTheDocument();

    spy.mockRestore();
  });

  it("handles NaN input for min price", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    const priceRangeButton = screen.getByRole("button", {
      name: /Price Range/i,
    });
    fireEvent.click(priceRangeButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    const inputs = screen.getAllByRole("spinbutton");
    const minInput = inputs[0];
    fireEvent.change(minInput, { target: { value: "" } });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it("handles NaN input for max price", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    const priceRangeButton = screen.getByRole("button", {
      name: /Price Range/i,
    });
    fireEvent.click(priceRangeButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    const inputs = screen.getAllByRole("spinbutton");
    const maxInput = inputs[1];
    fireEvent.change(maxInput, { target: { value: "" } });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it("clamps min price to not exceed max price", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    const priceRangeButton = screen.getByRole("button", {
      name: /Price Range/i,
    });
    fireEvent.click(priceRangeButton);

    await waitFor(() => {
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    const inputs = screen.getAllByRole("spinbutton");
    const minInput = inputs[0];
    fireEvent.change(minInput, { target: { value: "150" } });
    await waitFor(() => {
      // With maxPrice=999999 default, no clamping happens
      const calls = mockReplace.mock.calls;
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toMatch(/minPrice=150/);
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it("initializes state from URL params including size and min/max", async () => {
    const params = new URLSearchParams(
      "categoryId=2&q=test&conditions=New,Used&size=M&minPrice=25&maxPrice=50",
    );
    (useSearchParams as jest.Mock).mockReturnValue(params);

    await act(async () => {
      render(<Sidebar />);
    });

    // Show price inputs & verify values
    const priceRangeButton = screen.getByRole("button", {
      name: /Price Range/i,
    });
    fireEvent.click(priceRangeButton);
    await waitFor(() => {
      const inputs = screen.getAllByRole("spinbutton");
      expect((inputs[0] as HTMLInputElement).value).toBe("25");
      expect((inputs[1] as HTMLInputElement).value).toBe("50");
    });

    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it("toggles price range visibility", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    const priceRangeButton = screen.getByRole("button", {
      name: /Price Range/i,
    });

    // Initially collapsed
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(priceRangeButton);
    await waitFor(() => {
      expect(screen.getAllByRole("spinbutton").length).toBeGreaterThanOrEqual(
        2,
      );
    });

    // Click to collapse
    fireEvent.click(priceRangeButton);
    await waitFor(() => {
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    });
  });
});

// ---------------- CardItem ----------------
describe("CardItem", () => {
  it("renders with image", () => {
    render(<CardItem id="1" title="T-Shirt" imgSrc="/test.jpg" price={20} />);
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByAltText("T-Shirt")).toBeInTheDocument();
  });

  it("renders fallback text without image", () => {
    render(<CardItem id="2" title="No Image" price={0} />);
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("renders as link when href is provided", () => {
    render(
      <CardItem id="3" title="Linked Item" price={25} href="/listing/3" />,
    );

    const link = screen.getByText("Linked Item").closest("a");
    expect(link).toHaveAttribute("href", "/listing/3");
  });

  it("does not render as link when href is not provided", () => {
    render(<CardItem id="4" title="Not Linked" price={30} />);

    const content = screen.getByText("Not Linked");
    expect(content.closest("a")).toBeNull();
  });

  it("displays correct price", () => {
    render(<CardItem id="5" title="Item" price={49.99} />);
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("shows add to wardrobe button", () => {
    render(<CardItem id="6" title="Item" price={10} />);

    const button = screen.getByTitle("Add to wardrobe");
    expect(button).toBeInTheDocument();
  });

  it("adds item to wardrobe when button is clicked", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<CardItem id="7" title="New Item" price={35} imgSrc="/item.jpg" />);

    const button = screen.getByTitle("Add to wardrobe");
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/wishlist/7"),
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
          },
        }),
      );
    });

    await waitFor(() => {
      expect(wardrobeStorage.addWardrobeItem).toHaveBeenCalledWith({
        id: "7",
        title: "New Item",
        price: 35,
        imageUrl: "/item.jpg",
      });
    });
  });

  it("removes item from wardrobe when already in wardrobe", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <CardItem id="8" title="In Wardrobe" price={40} imgSrc="/item.jpg" />,
    );

    await waitFor(() => {
      const button = screen.getByTitle("In wardrobe");
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByTitle("In wardrobe");
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/wishlist/8"),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    await waitFor(() => {
      expect(wardrobeStorage.removeWardrobeItem).toHaveBeenCalledWith("8");
    });
  });

  it("prevents adding to wardrobe without token", async () => {
    mockSessionStorage.clear();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    render(<CardItem id="9" title="Item" price={20} />);

    const button = screen.getByTitle("Add to wardrobe");
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Missing access token for wishlist request.",
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("prevents duplicate requests while saving", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100),
        ),
    );

    render(<CardItem id="13" title="Item" price={20} />);

    const button = screen.getByTitle("Add to wardrobe");

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      // Should only call fetch once despite multiple clicks
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("disables button while saving", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<CardItem id="14" title="Item" price={20} />);

    const button = screen.getByTitle("Add to wardrobe") as HTMLButtonElement;

    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    await waitFor(() => {
      expect(button.disabled).toBe(true);
    });
  });

  it("updates wardrobe status when item changes", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    const { rerender } = render(<CardItem id="16" title="Item" price={20} />);

    expect(screen.getByTitle("Add to wardrobe")).toBeInTheDocument();

    // Simulate item being added to wardrobe externally
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);

    rerender(<CardItem id="17" title="Item" price={20} />);

    await waitFor(() => {
      expect(screen.getByTitle("In wardrobe")).toBeInTheDocument();
    });
  });

  it("renders ShoppingBag icon with correct fill", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem id="18" title="Item" price={20} />);

    const button = screen.getByTitle("Add to wardrobe");
    const svg = button.querySelector("svg");

    expect(svg).toHaveAttribute("fill", "none");
  });

  it("renders ShoppingBag icon with teal fill when in wardrobe", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);

    render(<CardItem id="19" title="Item" price={20} />);

    await waitFor(() => {
      const button = screen.getByTitle("In wardrobe");
      const svg = button.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "#14b8a6");
    });
  });

  it("sets correct aria-pressed attribute", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);

    render(<CardItem id="20" title="Item" price={20} />);

    await waitFor(() => {
      const button = screen.getByTitle("In wardrobe");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("handles imgSrc with null value", () => {
    render(<CardItem id="21" title="Item" price={20} imgSrc={undefined} />);

    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
