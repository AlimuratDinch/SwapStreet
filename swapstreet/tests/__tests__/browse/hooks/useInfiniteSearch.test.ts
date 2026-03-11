import { renderHook, act, waitFor } from "@testing-library/react";
import { useInfiniteSearch } from "@/app/browse/hooks/useInfiniteSearch";
import { useSearchParams } from "next/navigation";
import { getSearchResults } from "@/lib/api/browse";

// 1. Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

// 2. Mock the API utility
jest.mock("@/lib/api/browse", () => ({
  getSearchResults: jest.fn(),
}));

describe("useInfiniteSearch hook", () => {
  const mockInitialItems = [{ id: "1", title: "Initial Item" }];
  const mockInitialCursor = "cursor-1";

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for search params (Empty search)
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    // Default mock for the API response
    (getSearchResults as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });
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

    // If reset logic ran, the API would have been called.
    // We expect 0 calls on mount because we use initialItems.
    expect(getSearchResults).not.toHaveBeenCalled();
  });

  it("fetches the next page correctly when fetchPage is called", async () => {
    const mockNextPage = {
      items: [{ id: "2", title: "Next Item" }],
      nextCursor: "cursor-2",
      hasNextPage: true,
    };

    (getSearchResults as jest.Mock).mockResolvedValue(mockNextPage);

    const { result } = renderHook(() =>
      useInfiniteSearch(mockInitialItems, mockInitialCursor, true),
    );

    await act(async () => {
      result.current.fetchPage();
    });

    // Verify it called the utility with the existing cursor to get page 2
    expect(getSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "cursor-1" }),
    );

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[1].title).toBe("Next Item");
  });

  it("resets state and triggers a new search when searchParams change", async () => {
    // 1. Start with initial render
    const { result, rerender } = renderHook(() =>
      useInfiniteSearch(mockInitialItems, null, true),
    );

    // 2. Setup mock for the new API call triggered by the reset
    const mockNewSearch = {
      items: [{ id: "search-1", title: "Navy Item" }],
      nextCursor: "new-cursor",
      hasNextPage: false,
    };
    (getSearchResults as jest.Mock).mockResolvedValue(mockNewSearch);

    // 3. Update the search params mock WITH A NEW OBJECT REFERENCE
    // This is required for useEffect to detect the dependency change
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((key) => (key === "q" ? "Navy" : null)),
    });

    // 4. Trigger the reset logic
    rerender();

    // 5. Wait for the loading state and items to update
    await waitFor(
      () => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].id).toBe("search-1");
      },
      { timeout: 2000 },
    );

    expect(getSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Navy" }),
    );
  });

  it("handles fetch errors gracefully", async () => {
    (getSearchResults as jest.Mock).mockRejectedValue(
      new Error("Network Error"),
    );

    const { result } = renderHook(() => useInfiniteSearch([], null, true));

    await act(async () => {
      result.current.fetchPage();
    });

    expect(result.current.hasNext).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("prevents duplicate fetches using fetchInProgressRef", async () => {
    // Setup a promise that stays pending
    let resolvePromise: any;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (getSearchResults as jest.Mock).mockReturnValue(slowPromise);

    const { result } = renderHook(() => useInfiniteSearch([], null, true));

    // Fire two calls immediately
    await act(async () => {
      result.current.fetchPage();
      result.current.fetchPage();
    });

    // API should only be called once because the first is "in progress"
    expect(getSearchResults).toHaveBeenCalledTimes(1);

    // Clean up to avoid memory leaks in the test runner
    resolvePromise({ items: [], nextCursor: null, hasNextPage: false });
  });
});
