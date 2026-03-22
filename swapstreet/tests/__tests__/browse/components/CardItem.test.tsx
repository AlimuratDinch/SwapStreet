import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { CardItem } from "@/app/browse/components/CardItem";
import * as wardrobeStorage from "@/app/wardrobe/wardrobeStorage";

// 1. Mock the wardrobe storage utilities
jest.mock("@/app/wardrobe/wardrobeStorage", () => ({
  addWardrobeItem: jest.fn(),
  hasWardrobeItem: jest.fn(),
  removeWardrobeItem: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "NextLink";
  return MockLink;
});

describe("CardItem Component", () => {
  const mockProps = {
    id: "item-123",
    title: "Navy Parka",
    price: 89.99,
    fsa: "J4J",
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
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              }),
            0,
          ),
        ),
    ) as jest.Mock;
  });

  it("renders basic item information", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    expect(screen.getByText("Navy Parka")).toBeInTheDocument();
    expect(screen.getByText("$89.99")).toBeInTheDocument();
    expect(screen.getByText("J4J")).toBeInTheDocument();
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
    const button = screen.getByRole("button", { name: /add to wardrobe/i });
    await act(async () => {
      fireEvent.click(button);
    });

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
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add to wardrobe/i }));
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Wishlist error:",
        expect.any(Error),
      );
    });

    // Ensure button is re-enabled via 'finally' block
    expect(
      screen.getByRole("button", {
        name: /add to wardrobe|remove from wardrobe/i,
      }),
    ).not.toBeDisabled();
    consoleSpy.mockRestore();
  });

  it("prevents multiple concurrent API calls if clicked twice", async () => {
    // Mock fetch to stay pending for a bit
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<CardItem {...mockProps} />);
    const button = screen.getByRole("button", {
      name: /add to wardrobe|remove from wardrobe/i,
    });

    fireEvent.click(button);

    fireEvent.click(button);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // SPLIT INITIALIZATION TESTS
  it("initializes with a filled icon when item IS in wardrobe", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);
    render(<CardItem {...mockProps} />);

    const icon = screen
      .getByRole("button", { name: /remove from wardrobe/i })
      .querySelector("svg");
    expect(icon).toHaveAttribute("fill", "#14b8a6");
  });

  it("initializes with an empty icon when item IS NOT in wardrobe", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    const icon = screen
      .getByRole("button", { name: /add to wardrobe/i })
      .querySelector("svg");
    expect(icon).toHaveAttribute("fill", "none");
  });

  it("adds an item to the wardrobe on click when not already present", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    const button = screen.getByRole("button", { name: /add to wardrobe/i });
    await act(async () => {
      fireEvent.click(button);
    });

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

    const button = screen.getByRole("button", {
      name: /remove from wardrobe/i,
    });
    await act(async () => {
      fireEvent.click(button);
    });

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

  it("redirects to sign-in when no access token is stored", async () => {
    Object.defineProperty(window, "sessionStorage", {
      value: { getItem: jest.fn(() => null) },
      writable: true,
    });

    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add to wardrobe/i }));
    });

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
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
    const button = screen.getByRole("button", { name: /add to wardrobe/i });

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toBeDisabled();

    await act(async () => {
      resolveFetch({ ok: true });
    });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("displays location badge with FSA code", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    expect(screen.getByText("J4J")).toBeInTheDocument();
  });

  it("uses correct authorization header with bearer token", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add to wardrobe/i }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
        }),
      );
    });
  });

  it("updates API URL from environment variable", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} />);
    fireEvent.click(screen.getByRole("button", { name: /add to wardrobe/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.example.com"),
        expect.any(Object),
      );
    });

    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it("handles successful toggle from not-in-wardrobe to in-wardrobe", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    render(<CardItem {...mockProps} />);

    const button = screen.getByRole("button", { name: /add to wardrobe/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(wardrobeStorage.addWardrobeItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockProps.id,
          title: mockProps.title,
          price: mockProps.price,
          imageUrl: mockProps.imgSrc,
        }),
      );
    });
  });

  it("re-enables button after API error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    render(<CardItem {...mockProps} />);
    const button = screen.getByRole("button", {
      name: /add to wardrobe/i,
    }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });

  it("calls onSelectListing when card is clicked", () => {
    const mockOnSelectListing = jest.fn();
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} onSelectListing={mockOnSelectListing} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    fireEvent.click(cardElement!);

    expect(mockOnSelectListing).toHaveBeenCalledWith("item-123");
  });

  it("does not call onSelectListing when callback is not provided", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} onSelectListing={undefined} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    fireEvent.click(cardElement!);

    expect(screen.getByText("Navy Parka")).toBeInTheDocument();
  });

  it("prevents event bubbling when wardrobe button is clicked", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    const mockOnSelectListing = jest.fn();

    render(<CardItem {...mockProps} onSelectListing={mockOnSelectListing} />);

    const button = screen.getByRole("button", { name: /add to wardrobe/i });
    fireEvent.click(button);

    expect(mockOnSelectListing).not.toHaveBeenCalled();
  });

  it("uses correct format for wishlist endpoint URL", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add to wardrobe/i }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/wishlist/item-123`),
        expect.any(Object),
      );
    });
  });

  it("renders correctly with all props provided", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} />);

    expect(screen.getByText("Navy Parka")).toBeInTheDocument();
    expect(screen.getByText("$89.99")).toBeInTheDocument();
    expect(screen.getByText("J4J")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", mockProps.imgSrc);
  });

  it("handles async state update in useEffect dependency array", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    const { rerender } = render(<CardItem {...mockProps} />);

    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);

    rerender(<CardItem {...mockProps} id="item-456" />);

    await waitFor(() => {
      expect(wardrobeStorage.hasWardrobeItem).toHaveBeenCalledWith("item-456");
    });
  });

  it("uses imgSrc for imageUrl, defaults to null if undefined", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} imgSrc={undefined} />);

    const button = screen.getByRole("button", { name: /add to wardrobe/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(wardrobeStorage.addWardrobeItem).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: null,
        }),
      );
    });
  });

  it("triggers onSelectListing when Enter key is pressed on card", () => {
    const mockOnSelectListing = jest.fn();
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} onSelectListing={mockOnSelectListing} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    expect(cardElement).toBeInTheDocument();

    const enterKeyEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });
    const preventDefaultSpy = jest.spyOn(enterKeyEvent, "preventDefault");

    cardElement?.dispatchEvent(enterKeyEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockOnSelectListing).toHaveBeenCalledWith("item-123");
  });

  it("triggers onSelectListing when Space key is pressed on card", () => {
    const mockOnSelectListing = jest.fn();
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} onSelectListing={mockOnSelectListing} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    expect(cardElement).toBeInTheDocument();

    const spaceKeyEvent = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
    });
    const preventDefaultSpy = jest.spyOn(spaceKeyEvent, "preventDefault");

    cardElement?.dispatchEvent(spaceKeyEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockOnSelectListing).toHaveBeenCalledWith("item-123");
  });

  it("does not trigger onSelectListing for other keys (ArrowUp)", () => {
    const mockOnSelectListing = jest.fn();
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} onSelectListing={mockOnSelectListing} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    expect(cardElement).toBeInTheDocument();

    const arrowKeyEvent = new KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
    });

    cardElement?.dispatchEvent(arrowKeyEvent);

    expect(mockOnSelectListing).not.toHaveBeenCalled();
  });

  it("does not trigger onSelectListing for other keys (Escape)", () => {
    const mockOnSelectListing = jest.fn();
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} onSelectListing={mockOnSelectListing} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    expect(cardElement).toBeInTheDocument();

    const escapeKeyEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });

    cardElement?.dispatchEvent(escapeKeyEvent);

    expect(mockOnSelectListing).not.toHaveBeenCalled();
  });

  it("does not trigger onSelectListing when no callback is provided for Enter key", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    expect(cardElement).toBeInTheDocument();

    const enterKeyEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });

    expect(() => {
      cardElement?.dispatchEvent(enterKeyEvent);
    }).not.toThrow();
  });

  it("does not trigger onSelectListing when no callback is provided for Space key", () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);

    render(<CardItem {...mockProps} />);

    const cardElement = screen.getByText("Navy Parka").closest(".card-item");
    expect(cardElement).toBeInTheDocument();

    const spaceKeyEvent = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
    });

    expect(() => {
      cardElement?.dispatchEvent(spaceKeyEvent);
    }).not.toThrow();
  });
});
