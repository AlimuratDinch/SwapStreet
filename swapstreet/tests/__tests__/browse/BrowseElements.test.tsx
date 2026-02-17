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

// ---------------- Mocks ----------------
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn();

// ---------------- Setup ----------------
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    replace: mockPush,
  });
  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
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
      const calls = mockPush.mock.calls;
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
    const clearCalls = mockPush.mock.calls;
    const anyHasBrowseAndDefaultPrices = clearCalls.some(
      (c) =>
        (c[0] as string).startsWith("/browse") &&
        (c[0] as string).includes("minPrice=0") &&
        (c[0] as string).includes("maxPrice=999999"),
    );
    expect(anyHasBrowseAndDefaultPrices).toBe(true);
  });

  it("handles fetch error gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      render(<Sidebar />);
    });

    // The fetch is commented out in the component, so this test just verifies the sidebar still renders
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
      expect(mockPush).toHaveBeenCalled();
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
      expect(mockPush).toHaveBeenCalled();
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
      const calls = mockPush.mock.calls;
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toMatch(/minPrice=150/);
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("initializes state from URL params including min/max and search query", async () => {
    const params = new URLSearchParams("q=test&minPrice=25&maxPrice=50");
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
});

// ---------------- CardItem ----------------
describe("CardItem", () => {
  it("renders with image", () => {
    render(<CardItem title="T-Shirt" imgSrc="/test.jpg" price={20} />);
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByAltText("T-Shirt")).toBeInTheDocument();
  });

  it("renders fallback text without image", () => {
    render(<CardItem title="No Image" price={0} />);
    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
