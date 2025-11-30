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
      </AuthProvider>
    );
    expect(screen.getByText(/SWAP/)).toBeInTheDocument();
    expect(screen.getByText(/STREET/)).toBeInTheDocument();
    expect(screen.getByText(/Featured/)).toBeInTheDocument();
    expect(screen.getByText(/Collections/)).toBeInTheDocument();
    expect(screen.getByText(/Log in/)).toBeInTheDocument();
    expect(screen.getByText(/Sign up/)).toBeInTheDocument();
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
  it("fetches and renders categories", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Shoes" },
        { id: 2, name: "Hats" },
      ],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    await waitFor(() => {
      expect(screen.getByText("Shoes")).toBeInTheDocument();
      expect(screen.getByText("Hats")).toBeInTheDocument();
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

    const minInput = screen.getByPlaceholderText("Min");
    const maxInput = screen.getByPlaceholderText("Max");
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

    const checkbox = screen.getByLabelText("New");
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/browse?conditions=New");
    });
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/browse");
    });
  });

  it("selects category", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 5, name: "Bags" }],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    await waitFor(() => screen.getByText("Bags"));
    fireEvent.click(screen.getByText("Bags"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/browse?categoryId=5");
    });
  });

  it("clears all filters", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, name: "Shoes" }],
    });

    await act(async () => {
      render(<Sidebar />);
    });

    fireEvent.click(screen.getByText("Clear Filters"));
    expect(mockPush).toHaveBeenCalledWith("/browse");
  });

  it("handles fetch error gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      render(<Sidebar />);
    });

    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });
});

// ---------------- CardItem ----------------
describe("CardItem", () => {
  it("renders with image", () => {
    render(
      <CardItem title="T-Shirt" description="Blue cotton" imgSrc="/test.jpg" price={20} />,
    );
    expect(screen.getByText("T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Blue cotton")).toBeInTheDocument();
    expect(screen.getByAltText("T-Shirt")).toBeInTheDocument();
  });

  it("renders fallback text without image", () => {
    render(<CardItem title="No Image" description="Desc" price={0} />);
    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
