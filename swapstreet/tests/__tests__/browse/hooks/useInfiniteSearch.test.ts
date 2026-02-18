import { renderHook, act, waitFor } from "@testing-library/react";
import { useInfiniteSearch } from "../../../../app/browse/hooks/useInfiniteSearch";
import { useSearchParams } from "next/navigation";

// 1. Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

describe("useInfiniteSearch hook", () => {
  const mockInitialItems = [{ id: "1", title: "Initial Item" }];
  const mockInitialCursor = "cursor-1";

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for search params (empty)
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    // Mock global fetch
    global.fetch = jest.fn() as jest.Mock;
  });

  it("initializes with provided initial data", () => {
    const { result } = renderHook(() =>
      useInfiniteSearch(mockInitialItems, mockInitialCursor, true),
    );

    expect(result.current.items).toEqual(mockInitialItems);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("does NOT reset items on the first render (SSR Hydration check)", () => {
    renderHook(() =>
      useInfiniteSearch(mockInitialItems, mockInitialCursor, true),
    );

    // If reset logic ran, fetch would have been called with no cursor
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches the next page correctly when fetchPage is called", async () => {
    const mockNextPage = {
      items: [{ id: "2", title: "Next Item" }],
      nextCursor: "cursor-2",
      hasNextPage: true,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockNextPage),
    });

    const { result } = renderHook(() =>
      useInfiniteSearch(mockInitialItems, mockInitialCursor, true),
    );

    await act(async () => {
      result.current.fetchPage();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("Cursor=cursor-1"),
    );

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[1].title).toBe("Next Item");
  });

  it("resets state and triggers a new search when searchParams change", async () => {
    const { result, rerender } = renderHook(() =>
      useInfiniteSearch(mockInitialItems, null, true),
    );

    // Simulate search params changing in the URL
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((key) => (key === "q" ? "Navy" : null)),
    });

    const mockNewSearch = {
      items: [{ id: "search-1", title: "Navy Item" }],
      nextCursor: "new-cursor",
      hasNextPage: false,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockNewSearch),
    });

    // Rerender the hook to trigger the useEffect
    rerender();

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe("search-1");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("Query=Navy"),
    );
  });

  it("handles fetch errors gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useInfiniteSearch([], null, true));

    await act(async () => {
      result.current.fetchPage();
    });

    expect(result.current.hasNext).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("prevents duplicate fetches using fetchInProgressRef", async () => {
    // Return a promise that doesn't resolve immediately
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useInfiniteSearch([], null, true));

    act(() => {
      result.current.fetchPage();
      result.current.fetchPage(); // Call twice immediately
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
