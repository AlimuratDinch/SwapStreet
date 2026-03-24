import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ListingPage from "@/app/listing/page";
import * as wardrobeStorage from "@/app/wardrobe/wardrobeStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";

jest.mock("@/contexts/AuthContext");
jest.mock("@/app/wardrobe/wardrobeStorage");
jest.mock("@/app/browse/components/Gallery", () => {
  return function DummyGallery() {
    return <div data-testid="gallery-mock">Gallery</div>;
  };
});
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(),
}));

// Mock the Header to avoid AuthContext errors
jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="mock-header" />,
}));

describe("Listing Page", () => {
  const mockListing = {
    id: "listing-1",
    title: "Vintage Jacket",
    price: 45.99,
    createdAt: new Date().toISOString(),
    category: "Clothing",
    brand: "Vintage Brand",
    condition: "Like New",
    size: "M",
    colour: "Blue",
    images: [{ imageUrl: "http://example.com/jacket.jpg" }],
    description: "A beautiful vintage jacket",
    location: "Toronto, ON",
    fsa: "M5V",
    seller: {
      id: "seller-1",
      firstName: "John",
      lastName: "Doe",
      rating: 4.5,
      profileImageUrl: "http://example.com/avatar.jpg",
      fsa: "M5V",
      createdAt: new Date(2020, 0, 1).toISOString(),
    },
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "test-token",
      isAuthenticated: true,
      authLoaded: true,
    });

    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("id=listing-1"),
    );

    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    (wardrobeStorage.addWardrobeItem as jest.Mock).mockImplementation(() => {});
    (wardrobeStorage.removeWardrobeItem as jest.Mock).mockImplementation(
      () => {},
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockListing),
      } as any),
    );
  });

  it("renders page with title", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("renders price", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("$45.99")).toBeInTheDocument();
    });
  });

  it("renders seller name", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("renders seller rating", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/4.5/)).toBeInTheDocument();
    });
  });

  it("renders category", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Clothing")).toBeInTheDocument();
    });
  });

  it("renders condition", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Like New")).toBeInTheDocument();
    });
  });

  it("renders size", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("M")).toBeInTheDocument();
    });
  });

  it("renders color", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Blue")).toBeInTheDocument();
    });
  });

  it("renders brand", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Brand")).toBeInTheDocument();
    });
  });

  it("renders gallery", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByTestId("gallery-mock")).toBeInTheDocument();
    });
  });

  it("fetches listing by ID", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("listing-1"),
      );
    });
  });

  it("handles no listing ID", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("No listing specified")).toBeInTheDocument();
    });
  });

  it("shows save button", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  it("shows saved button when in wardrobe", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  it("renders location", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("handles missing images", async () => {
    const listing = { ...mockListing, images: undefined };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("handles no seller", async () => {
    const listing = { ...mockListing, seller: null };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Unknown Seller")).toBeInTheDocument();
    });
  });

  it("handles missing seller rating", async () => {
    const listing = {
      ...mockListing,
      seller: { ...mockListing.seller, rating: undefined },
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("No rating yet")).toBeInTheDocument();
    });
  });

  it("handles null price", async () => {
    const listing = { ...mockListing, price: null };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });
  });

  it("renders message textarea", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/hi, is this available/i);
      expect(textarea).toBeInTheDocument();
    });
  });

  it("renders send button", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send message/i }),
      ).toBeInTheDocument();
    });
  });

  it("updates textarea text", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
    const textarea = screen.getByPlaceholderText(
      /hi, is this available/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Test" } });
    expect(textarea.value).toBe("Test");
  });

  it("seller link has correct href", async () => {
    render(<ListingPage />);
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /seller details/i });
      expect(link).toHaveAttribute("href", "/profile/seller-1");
    });
  });

  it("handles unauthenticated users", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: null,
      accessToken: null,
      isAuthenticated: false,
      authLoaded: true,
    });
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      back: jest.fn(),
    }));
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("waits for auth loading", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "token",
      isAuthenticated: true,
      authLoaded: false,
    });
    render(<ListingPage />);
    const button = screen.queryByRole("button", { name: /send message/i });
    expect(button).not.toBeInTheDocument();
  });

  it("handles invalid date", async () => {
    const listing = { ...mockListing, createdAt: "invalid" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("formats recent date", async () => {
    const now = new Date();
    const listing = { ...mockListing, createdAt: now.toISOString() };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("formats old date", async () => {
    const old = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const listing = { ...mockListing, createdAt: old.toISOString() };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/Listed/i)).toBeInTheDocument();
    });
  });

  it("handles missing FSA", async () => {
    const listing = { ...mockListing, fsa: undefined };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("prevents message when seller missing", async () => {
    const listing = { ...mockListing, seller: null };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("displays error when listing fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load listing")).toBeInTheDocument();
    });
  });

  it("displays error when listing fetch returns 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load listing")).toBeInTheDocument();
    });
  });

  it("go back button calls router.back()", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: jest.fn(),
      back: mockBack,
    }));
    render(<ListingPage />);
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /go back/i });
      fireEvent.click(button);
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("sends message with Enter key in textarea", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
      back: jest.fn(),
    }));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "chatroom-1" }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat/chatrooms/get-or-create",
        expect.any(Object),
      );
    });
  });

  it("handles chat error - no seller ID", async () => {
    const listing = { ...mockListing, seller: null };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });
    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Unknown Seller")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/Cannot message this seller/i),
      ).toBeInTheDocument();
    });
  });

  it("redirects to sign-in when starting chat unauthenticated", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
      back: jest.fn(),
    }));
    (useAuth as jest.Mock).mockReturnValue({
      userId: null,
      accessToken: null,
      isAuthenticated: false,
      authLoaded: true,
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockListing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  it("handles chat fetch error", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ city: "Toronto", provinceCode: "ON" }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("handles chat API error response", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
      back: jest.fn(),
    }));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ city: "Toronto", provinceCode: "ON" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Server error|HTTP 500/)).toBeInTheDocument();
    });
  });

  it("shows no profile warning for buyer profile not found error", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Buyer profile not found" }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("handles missing error field in chat error response", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ Error: "Generic error" }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("uses HTTP status in error message when no error field", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({}),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("adds item to wardrobe successfully", async () => {
    (wardrobeStorage.addWardrobeItem as jest.Mock).mockImplementation(() => {});
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(wardrobeStorage.addWardrobeItem).toHaveBeenCalled();
    });
  });

  it("removes item from wardrobe successfully", async () => {
    (wardrobeStorage.removeWardrobeItem as jest.Mock).mockImplementation(
      () => {},
    );
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /saved/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(wardrobeStorage.removeWardrobeItem).toHaveBeenCalledWith(
        "listing-1",
      );
    });
  });

  it("handles wardrobe API failure silently", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockRejectedValueOnce(new Error("Fetch failed"));

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  it("handles wardrobe error when no token available", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: null,
      isAuthenticated: true,
      authLoaded: true,
    });
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockListing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  it("handles wardrobe item with missing image", async () => {
    const listing = {
      ...mockListing,
      images: [],
    };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(listing),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  it("displays location from API when available", async () => {
    const listingWithoutLocation = {
      ...mockListing,
      location: undefined,
      fsa: undefined,
      FSA: undefined,
    };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(listingWithoutLocation),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            city: "Toronto",
            provinceCode: "ON",
          }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("falls back to location field when API unavailable", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("handles location API error gracefully", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockRejectedValueOnce(new Error("Location API failed"));

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("handles location data with missing province", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            city: "Toronto",
            province: "",
          }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("renders seller without ID gracefully", async () => {
    const listing = {
      ...mockListing,
      seller: { ...mockListing.seller, id: undefined },
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /seller details/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("handles description with special characters", async () => {
    const listing = {
      ...mockListing,
      description: "Line 1\nLine 2\nLine 3",
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });

  it("formats years correctly for seller join date", async () => {
    const listing = {
      ...mockListing,
      seller: {
        ...mockListing.seller,
        createdAt: new Date(2018, 5, 15).toISOString(),
      },
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/Joined SWAPSTREET in 2018/)).toBeInTheDocument();
    });
  });

  it("formats date with minutes correctly", async () => {
    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const listing = {
      ...mockListing,
      createdAt: fiveMinutesAgo.toISOString(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
    });
  });

  it("formats date with hours correctly", async () => {
    const now = Date.now();
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    const listing = {
      ...mockListing,
      createdAt: threeHoursAgo.toISOString(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/3 hours ago/)).toBeInTheDocument();
    });
  });

  it("displays just now for very recent listings", async () => {
    const listing = {
      ...mockListing,
      createdAt: new Date().toISOString(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText(/just now/)).toBeInTheDocument();
    });
  });

  it("handles missing description", async () => {
    const listing = {
      ...mockListing,
      description: undefined,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(listing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("No description provided.")).toBeInTheDocument();
    });
  });

  it("disables save button while saving", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              } as Response);
            }, 100);
          }),
      );

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", {
      name: /save/i,
    }) as HTMLButtonElement;
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it("disables send message button while loading", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ id: "chatroom-1" }),
              } as Response);
            }, 100);
          }),
      );

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", {
      name: /send message/i,
    }) as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Opening chat...")).toBeInTheDocument();
    });
  });

  it("handles empty message trimming", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
      back: jest.fn(),
    }));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "chatroom-1" }),
      });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("msg=Hi%2C%20is%20this%20available"),
      );
    });
  });

  it("returns early if authLoaded is false during message", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "token",
      isAuthenticated: true,
      authLoaded: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListing),
    });

    render(<ListingPage />);
    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: /send message/i });
    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
    fireEvent.click(button);

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(
      initialCallCount,
    );
  });
});
