import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CardItem } from "@/app/browse/components/CardItem";
import * as wardrobeStorage from "@/app/wardrobe/wardrobeStorage";

// 1. Mock the wardrobe storage utilities
jest.mock("@/app/wardrobe/wardrobeStorage", () => ({
  addWardrobeItem: jest.fn(),
  hasWardrobeItem: jest.fn(),
  removeWardrobeItem: jest.fn(),
}));

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "NextLink"; // This satisfies react/display-name
  return MockLink;
});

describe("CardItem Component", () => {
  const mockProps = {
    id: "item-123",
    title: "Navy Parka",
    price: 89.99,
    imgSrc: "http://localhost/parka.jpg",
    href: "/listing/item-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup sessionStorage mock
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: jest.fn(() => "fake-token"),
      },
      writable: true,
    });

    // Setup global fetch mock
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;
  });

  it("renders basic item information", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    expect(screen.getByText("Navy Parka")).toBeInTheDocument();
    expect(screen.getByText("$89.99")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", mockProps.imgSrc);
  });

  it("renders a fallback when no image is provided", () => {
    render(<CardItem {...mockProps} imgSrc={undefined} />);
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });

  it("renders without a Link wrapper when href is not provided", () => {
    const { container } = render(<CardItem {...mockProps} href={undefined} />);

    // The mock Link renders an 'a' tag. We check that it's NOT there.
    const link = container.querySelector("a");
    expect(link).toBeNull();

    // Ensure content still renders
    expect(screen.getByText("Navy Parka")).toBeInTheDocument();
  });

  it("does not update wardrobe state if the API request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      // Should NOT call storage update if API failed
      expect(wardrobeStorage.addWardrobeItem).not.toHaveBeenCalled();
    });
  });

  it("handles network errors gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network Fail"),
    );

    render(<CardItem {...mockProps} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Wishlist error:",
        expect.any(Error),
      );
    });

    // Ensure button is re-enabled via 'finally' block
    expect(screen.getByRole("button")).not.toBeDisabled();
    consoleSpy.mockRestore();
  });

  it("prevents multiple concurrent API calls if clicked twice", async () => {
    // Mock fetch to stay pending for a bit
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<CardItem {...mockProps} />);
    const button = screen.getByRole("button");

    fireEvent.click(button); // First click
    fireEvent.click(button); // Second click (should be ignored)

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // SPLIT INITIALIZATION TESTS
  it("initializes with a filled icon when item IS in wardrobe", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);
    render(<CardItem {...mockProps} />);

    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon).toHaveAttribute("fill", "#14b8a6");
  });

  it("initializes with an empty icon when item IS NOT in wardrobe", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon).toHaveAttribute("fill", "none");
  });

  it("adds an item to the wardrobe on click when not already present", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/wishlist/item-123"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(wardrobeStorage.addWardrobeItem).toHaveBeenCalled();
    });
  });

  it("removes an item from the wardrobe on click when already present", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);
    render(<CardItem {...mockProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/wishlist/item-123"),
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(wardrobeStorage.removeWardrobeItem).toHaveBeenCalledWith(
        "item-123",
      );
    });
  });

  it("disables the button while the request is in progress", async () => {
    let resolveFetch: any;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<CardItem {...mockProps} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(button).toBeDisabled();

    resolveFetch({ ok: true });
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
