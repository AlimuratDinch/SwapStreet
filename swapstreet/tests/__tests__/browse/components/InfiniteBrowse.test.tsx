import { render, screen } from "@testing-library/react";
import InfiniteBrowse from "@/app/browse/components/InfiniteBrowse";
import { useInfiniteSearch } from "@/app/browse/hooks/useInfiniteSearch";
import { useScrollListener } from "@/app/browse/hooks/useScrollListener";

// 1. Mock the custom hooks
jest.mock("@/app/browse/hooks/useInfiniteSearch");
jest.mock("@/app/browse/hooks/useScrollListener");

// 2. Mock CardItem to avoid deep rendering complexity
jest.mock("@/app/browse/components/CardItem", () => ({
  CardItem: ({ title }: { title: string }) => (
    <div data-testid="card-item">{title}</div>
  ),
}));

describe("InfiniteBrowse Component", () => {
  const mockFetchPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of items returned by the hook", () => {
    // Setup hook to return mock items
    (useInfiniteSearch as jest.Mock).mockReturnValue({
      items: [
        { id: "1", title: "Navy Jacket", price: 50 },
        { id: "2", title: "Wool Scarf", price: 25 },
      ],
      loading: false,
      hasNext: true,
      fetchPage: mockFetchPage,
    });

    render(<InfiniteBrowse />);

    const cards = screen.getAllByTestId("card-item");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Navy Jacket")).toBeInTheDocument();
    expect(screen.getByText("Wool Scarf")).toBeInTheDocument();
  });

  it("displays the empty state message when no items exist", () => {
    (useInfiniteSearch as jest.Mock).mockReturnValue({
      items: [],
      loading: false,
      hasNext: false,
      fetchPage: mockFetchPage,
    });

    render(<InfiniteBrowse />);

    expect(screen.getByText(/no items available/i)).toBeInTheDocument();
    expect(screen.queryByText(/loading more items/i)).not.toBeInTheDocument();
  });

  it("displays the loading status when fetching data", () => {
    (useInfiniteSearch as jest.Mock).mockReturnValue({
      items: [{ id: "1", title: "Existing Item", price: 10 }],
      loading: true,
      hasNext: true,
      fetchPage: mockFetchPage,
    });

    render(<InfiniteBrowse />);

    expect(screen.getByText(/loading more items/i)).toBeInTheDocument();
    // Should still show existing items while loading more
    expect(screen.getByText("Existing Item")).toBeInTheDocument();
  });

  it("initializes the scroll listener with the correct parameters", () => {
    (useInfiniteSearch as jest.Mock).mockReturnValue({
      items: [],
      loading: false,
      hasNext: true,
      fetchPage: mockFetchPage,
    });

    render(<InfiniteBrowse />);

    // useScrollListener should be called with:
    // 1. A ref (the main element)
    // 2. The fetchPage function
    // 3. enabled boolean (hasNext && !loading)
    expect(useScrollListener).toHaveBeenCalledWith(
      expect.any(Object), // the ref
      mockFetchPage,
      true, // hasNext(true) && !loading(false)
    );
  });

  it("disables the scroll listener when loading is true", () => {
    (useInfiniteSearch as jest.Mock).mockReturnValue({
      items: [],
      loading: true,
      hasNext: true,
      fetchPage: mockFetchPage,
    });

    render(<InfiniteBrowse />);

    // enabled should be false because loading is true
    expect(useScrollListener).toHaveBeenCalledWith(
      expect.any(Object),
      mockFetchPage,
      false,
    );
  });
});
