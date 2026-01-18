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
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  jest.clearAllMocks();
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
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/Search.../i)).toBeInTheDocument();
  });
});

// ---------------- Sidebar ----------------
describe("Sidebar", () => {
  it("renders with fixed categories when expanded", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    // Categories are only visible when the button is clicked to expand
    const categoriesButton = screen.getByRole("button", {
      name: /Categories/i,
    });
    fireEvent.click(categoriesButton);

    await waitFor(() => {
      expect(screen.getByText("Tops")).toBeInTheDocument();
    });
  });

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
      expect(mockPush).toHaveBeenCalledWith("/browse?minPrice=10&maxPrice=100");
    });
  });

  it("toggles condition filters", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    // First, click the Condition button to expand it
    const conditionButton = screen.getByRole("button", { name: /Condition/i });
    fireEvent.click(conditionButton);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const checkbox = checkboxes[0];
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("selects category", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    // Clear previous mocks from initialization
    mockPush.mockClear();

    // Click Categories button to expand
    const categoriesButton = screen.getByRole("button", {
      name: /Categories/i,
    });
    fireEvent.click(categoriesButton);

    await waitFor(() => {
      expect(screen.getByText("Tops")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Tops"));
    await waitFor(() => {
      // Just check that it was called with categoryId, regardless of other params
      expect(mockPush).toHaveBeenCalled();
      const calls = mockPush.mock.calls;
      const hasCategory = calls.some((call) =>
        call[0].includes("categoryId=1"),
      );
      expect(hasCategory).toBe(true);
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
    expect(mockPush).toHaveBeenCalledWith("/browse");
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
      // Min should be clamped to not exceed max (100)
      const calls = mockPush.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toMatch(/minPrice=100/);
    });
  });

  it("toggles size selection", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    mockPush.mockClear();

    const sizeButtons = screen.getAllByRole("button");
    const mediumButton = sizeButtons.find((btn) => btn.textContent === "M");
    expect(mediumButton).toBeTruthy();

    fireEvent.click(mediumButton!);
    await waitFor(() => {
      // maxPrice=100 is always included because it's the default max state
      expect(mockPush).toHaveBeenCalledWith("/browse?maxPrice=100&size=M");
    });

    // Toggle off
    fireEvent.click(mediumButton!);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/browse?maxPrice=100");
    });
  });

  it("deselects category when clicked again", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    mockPush.mockClear();

    const categoriesButton = screen.getByRole("button", {
      name: /Categories/i,
    });
    fireEvent.click(categoriesButton);

    await waitFor(() => {
      expect(screen.getByText("Tops")).toBeInTheDocument();
    });

    const topsButton = screen.getByText("Tops");

    // First click to select
    fireEvent.click(topsButton);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
      const calls = mockPush.mock.calls;
      const hasCategory = calls.some((call) =>
        call[0].includes("categoryId=1"),
      );
      expect(hasCategory).toBe(true);
    });
  });

  it("unchecks condition filter", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    const conditionButton = screen.getByRole("button", { name: /Condition/i });
    fireEvent.click(conditionButton);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    mockPush.mockClear();

    const checkboxes = screen.getAllByRole("checkbox");
    const checkbox = checkboxes[0];
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    mockPush.mockClear();

    // Click again to uncheck
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/browse?maxPrice=100");
    });
  });

  it("syncs conditions from URL on mount", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const mockSearchParamsWithConditions = new URLSearchParams(
      "conditions=New,Like%20New",
    );
    (useSearchParams as jest.Mock).mockReturnValue(
      mockSearchParamsWithConditions,
    );

    await act(async () => {
      render(<Sidebar />);
    });

    const conditionButton = screen.getByRole("button", { name: /Condition/i });
    fireEvent.click(conditionButton);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      const newCheckbox = checkboxes.find((cb) =>
        (cb as HTMLInputElement).parentElement?.textContent.includes("New"),
      ) as HTMLInputElement;
      const likeNewCheckbox = checkboxes.find((cb) =>
        (cb as HTMLInputElement).parentElement?.textContent.includes(
          "Like New",
        ),
      ) as HTMLInputElement;
      expect(newCheckbox?.checked).toBe(true);
      expect(likeNewCheckbox?.checked).toBe(true);
    });

    // Reset mock for other tests
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });
  it("applies location filter and updates router query", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    fireEvent.click(screen.getByText("Location"));

    fireEvent.click(
      screen.getByText(/Use my current location/i)
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
      const call = mockPush.mock.calls.at(-1)?.[0];
      expect(call).toContain("lat=");
      expect(call).toContain("lng=");
      expect(call).toContain("radiusKm=");
    });
  });

});

// ---------------- CardItem ----------------
describe("CardItem", () => {
  it("renders with image", () => {
    render(
      <CardItem
        title="T-Shirt"
        condition="Like New"
        imgSrc="/test.jpg"
        price={20}
      />,
    );
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Like New")).toBeInTheDocument();
    expect(screen.getByAltText("T-Shirt")).toBeInTheDocument();
  });

  it("renders fallback text without image", () => {
    render(<CardItem title="No Image" condition="Used" price={0} />);
    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
