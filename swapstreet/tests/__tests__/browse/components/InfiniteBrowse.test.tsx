import { render, screen, waitFor, act } from "@testing-library/react";
import InfiniteBrowse from "@/app/browse/components/InfiniteBrowse";
import * as api from "@/lib/api/browse";

// 1. Mock Next.js Router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// 2. Mock the API Utility
jest.mock("@/lib/api/browse", () => ({
  getSearchResults: jest.fn(),
  getLocationLabelByFsa: jest
    .fn()
    .mockImplementation(async (fsa: string) => fsa),
}));

// 3. Mock CardItem
jest.mock("@/app/browse/components/CardItem", () => ({
  CardItem: ({ title }: { title: string }) => (
    <div data-testid="card-item">{title}</div>
  ),
}));

// 3. Robust IntersectionObserver Mock
let observerCallback: (entries: any[]) => void;

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: (entries: any[]) => void) {
    observerCallback = callback;
  }

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

describe("InfiniteBrowse Component - High Coverage", () => {
  const mockItems = [{ id: "1", title: "Item 1", price: 10, fsa: "H0H" }];

  const nextBatch = {
    items: [{ id: "2", title: "Item 2", price: 20, fsa: "J4K" }],
    nextCursor: "cursor-2",
    hasNextPage: false,
  };

  const defaultProps = {
    initialItems: mockItems,
    initialCursor: "cursor-1",
    initialHasNext: true,
    params: { q: "test" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial items and setup intersection observer", () => {
    render(<InfiniteBrowse {...defaultProps} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("loads more items when intersection occurs", async () => {
    (api.getSearchResults as jest.Mock).mockResolvedValue(nextBatch);

    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(api.getSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({ q: "test", cursor: "cursor-1" }),
    );

    expect(await screen.findByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("displays 'reached the end' message when hasNext is false", () => {
    render(
      <InfiniteBrowse
        {...defaultProps}
        initialHasNext={false}
        initialCursor={null}
      />,
    );

    expect(
      screen.getByText(/You've reached the end of the list/i),
    ).toBeInTheDocument();
  });

  it("resets state when initialItems prop changes (Filter Synchronization)", () => {
    const { rerender } = render(<InfiniteBrowse {...defaultProps} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();

    const newItems = [
      { id: "100", title: "New Result", price: 50, fsa: "A1A" },
    ];

    rerender(
      <InfiniteBrowse
        {...defaultProps}
        initialItems={newItems}
        initialCursor="new-cursor"
      />,
    );

    expect(screen.getByText("New Result")).toBeInTheDocument();
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
  });

  it("handles API errors gracefully during loadMore", async () => {
    console.error = jest.fn();
    (api.getSearchResults as jest.Mock).mockRejectedValue(
      new Error("Network Fail"),
    );

    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading more/i)).not.toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  it("prevents multiple simultaneous fetches using the isLoading lock", async () => {
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (api.getSearchResults as jest.Mock).mockReturnValue(pendingPromise);

    render(<InfiniteBrowse {...defaultProps} />);

    // Trigger first call
    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    // Trigger second call - isLoading is true, so this should return early
    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(api.getSearchResults).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise(nextBatch);
    });
  });

  it("renders empty state when items length is zero", () => {
    render(
      <InfiniteBrowse
        {...defaultProps}
        initialItems={[]}
        initialHasNext={false}
        initialCursor={null}
      />,
    );

    expect(
      screen.getByText(/No items found matching your criteria/i),
    ).toBeInTheDocument();
  });

  it("does not load more when isLoading is true", async () => {
    let resolvePromise: any;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (api.getSearchResults as jest.Mock).mockReturnValue(pendingPromise);

    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(api.getSearchResults).toHaveBeenCalledTimes(1);
  });

  it("does not load more when hasNext is false", async () => {
    (api.getSearchResults as jest.Mock).mockResolvedValue(nextBatch);

    const { rerender } = render(<InfiniteBrowse {...defaultProps} />);

    rerender(
      <InfiniteBrowse
        {...defaultProps}
        initialHasNext={false}
        initialCursor={null}
      />,
    );

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(api.getSearchResults).not.toHaveBeenCalled();
  });

  it("does not load more when cursor is null", async () => {
    (api.getSearchResults as jest.Mock).mockResolvedValue(nextBatch);

    const { rerender } = render(<InfiniteBrowse {...defaultProps} />);

    rerender(
      <InfiniteBrowse
        {...defaultProps}
        initialCursor={null}
        initialHasNext={true}
      />,
    );

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(api.getSearchResults).not.toHaveBeenCalled();
  });

  it("does not trigger load when isIntersecting is false", async () => {
    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: false }]);
    });

    expect(api.getSearchResults).not.toHaveBeenCalled();
  });

  it("displays loading state while fetching", async () => {
    (api.getSearchResults as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(screen.getByText(/Loading more/i)).toBeInTheDocument();
  });

  it("appends new items to existing items when loading more", async () => {
    const moreItems = {
      items: [
        { id: "3", title: "Item 3", price: 30, fsa: "M2M" },
        { id: "4", title: "Item 4", price: 40, fsa: "N3N" },
      ],
      nextCursor: "cursor-3",
      hasNextPage: true,
    };

    (api.getSearchResults as jest.Mock).mockResolvedValue(moreItems);

    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
      expect(screen.getByText("Item 4")).toBeInTheDocument();
    });
  });

  it("does not fetch when intersection observer is not intersecting", async () => {
    render(<InfiniteBrowse {...defaultProps} />);

    await act(async () => {
      observerCallback([{ isIntersecting: false }]);
    });

    expect(api.getSearchResults).not.toHaveBeenCalled();
  });

  it("passes correct filter parameters to API", async () => {
    (api.getSearchResults as jest.Mock).mockResolvedValue(nextBatch);

    render(
      <InfiniteBrowse
        {...defaultProps}
        params={{ q: "jacket", category: "Tops" }}
      />,
    );

    await act(async () => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(api.getSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "jacket",
        category: "Tops",
        cursor: "cursor-1",
      }),
    );
  });
});
