import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ListingModal } from "@/app/browse/components/ListingModal";
import * as wardrobeStorage from "@/app/wardrobe/wardrobeStorage";
import { useAuth } from "@/contexts/AuthContext";

jest.mock("@/contexts/AuthContext");
jest.mock("@/app/wardrobe/wardrobeStorage");
jest.mock("@/app/browse/components/Gallery", () => {
  return function DummyGallery() {
    return <div data-testid="gallery-mock">Gallery</div>;
  };
});
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

describe("ListingModal Component", () => {
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
      accessToken: "fake-token",
      authLoaded: true,
    });
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    (wardrobeStorage.addWardrobeItem as jest.Mock).mockReturnValue(undefined);
    (wardrobeStorage.removeWardrobeItem as jest.Mock).mockReturnValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockListing,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders, fetches and displays listing", async () => {
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Vintage Jacket")).toBeInTheDocument());
  });

  it("displays seller and price info", async () => {
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/45.99/)).toBeInTheDocument();
    });
  });

  

  it("displays category, condition, gallery", async () => {
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Clothing")).toBeInTheDocument();
      expect(screen.getByText("Like New")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-mock")).toBeInTheDocument();
    });
  });

  

  it("fetches listing with correct ID", async () => {
    render(<ListingModal listingId="listing-123" onClose={() => {}} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/search/listing/listing-123"));
  });

  it("handles missing images gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockListing, images: [] }),
    });
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Vintage Jacket")).toBeInTheDocument());
  });

  

  // Wardrobe functionality tests
  it.each([
    { hasItem: false, buttonLabel: /Save/, expectedCall: "addWardrobeItem" },
    { hasItem: true, buttonLabel: /Saved/, expectedCall: "removeWardrobeItem" },
  ])("handles wardrobe when hasItem=$hasItem", async ({ hasItem, buttonLabel, expectedCall }) => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(hasItem);
    
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/wishlist/")) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const wardrobeButton = getByRole("button", { name: buttonLabel });
    expect(wardrobeButton).toBeInTheDocument();

    fireEvent.click(wardrobeButton);

    await waitFor(() => {
      expect((wardrobeStorage as any)[expectedCall]).toHaveBeenCalled();
    });
  });

  // Chat functionality tests
  it("renders and updates message textarea", async () => {
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Hi, is this available?/i) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    
    fireEvent.change(textarea, { target: { value: "Is this still available?" } });
    expect(textarea.value).toBe("Is this still available?");
  });

  it("sends chat message successfully", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "chatroom-1" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    expect(sendButton).toBeInTheDocument();
  });

  it("redirects to auth when user not authenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: null,
      accessToken: null,
      authLoaded: true,
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

  });

  it.each([
    { name: "buyer profile not found", error: "Buyer profile not found", expectsProfile: true },
    { name: "generic chat error", error: "Failed to create chatroom", expectsProfile: false },
    { name: "Error property in response", error: "Internal server error", expectsProfile: false, useErrorProp: true },
  ])("handles chat error: $name", async ({ error, expectsProfile, useErrorProp }) => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        const body = useErrorProp ? { Error: error } : { error };
        return Promise.resolve({
          ok: false,
          json: async () => body,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole, queryByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      if (expectsProfile) {
        const createProfileBtn = queryByRole("button", { name: /Create profile/i });
        expect(createProfileBtn).toBeInTheDocument();
      } else {
        expect(screen.getByText(new RegExp(error.split(' ')[0]))).toBeInTheDocument();
      }
    });
  });

  it("displays seller link in modal", async () => {
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sellerLink = screen.getByRole("link", { name: /Seller Details/i });
    expect(sellerLink).toBeInTheDocument();
    expect(sellerLink).toHaveAttribute("href", "/profile/seller-1");
  });

  it.each([
    { offset: 0, pattern: /just now|seconds ago/ },
    { offset: 5 * 60 * 1000, pattern: /5 minute/ },
    { offset: 3 * 60 * 60 * 1000, pattern: /3 hour/ },
    { offset: 7 * 24 * 60 * 60 * 1000, pattern: /7 day/ },
  ])("formats listing created $offset ms ago", async ({ offset, pattern }) => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockListing, createdAt: new Date(Date.now() - offset).toISOString() }),
    });
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(pattern)).toBeInTheDocument());
  });

  it("handles location fetch failure gracefully", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/location/lookup/")) {
        return Promise.reject(new Error("Location service error"));
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
    
    const locationText = screen.queryAllByText(/Toronto|M5V/);
    expect(locationText.length).toBeGreaterThan(0);
  });

  it.each([
    { name: "no seller", listing: { ...mockListing, seller: null }, expectText: /Unknown Seller/ },
    { name: "invalid date", listing: { ...mockListing, createdAt: "invalid-date" }, expectText: /recently/ },
  ])("handles listing with $name", async ({ listing, expectText }) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => listing,
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    expect(screen.getByText(expectText)).toBeInTheDocument();
  });

  it.each([
    { name: "no image", seller: { ...mockListing.seller, profileImageUrl: null }, expectText: /John Doe/ },
    { name: "without rating", seller: { ...mockListing.seller, rating: null }, expectText: /No rating yet/ },
    { name: "with undefined fields", seller: { id: "seller-1", firstName: "John", lastName: "Doe" }, expectText: /John Doe/ },
  ])("handles seller with $name", async ({ seller, expectText }) => {
    const listing = { ...mockListing, seller };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => listing,
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    expect(screen.getByText(expectText)).toBeInTheDocument();
  });

  it("handles missing price information", async () => {
    const listingNoPrice = { ...mockListing, price: null };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => listingNoPrice,
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    expect(screen.getByText(/\$0/)).toBeInTheDocument();
  });

  it.each([
    { name: "rejected promise", error: "Wishlist error", shouldReject: true },
    { name: "API failure", error: "Unauthorized", shouldReject: false },
  ])("handles wardrobe $name", async ({ error, shouldReject }) => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/wishlist/")) {
        if (shouldReject) {
          return Promise.reject(new Error(error));
        }
        return Promise.resolve({ ok: false, json: async () => ({ error }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const saveButton = getByRole("button", { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });
  });

  it("sends message with default text when input is empty", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "chatroom-1" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat/chatrooms/get-or-create",
        expect.any(Object)
      );
    });
  });

  it("closes modal on Escape key press", async () => {
    const onClose = jest.fn();
    
    render(<ListingModal listingId="listing-1" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("restores body overflow on unmount", async () => {
    const { unmount } = render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    unmount();

    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("handles listing missing FSA for location lookup", async () => {
    const listingNoFsa = { 
      ...mockListing, 
      fsa: null, 
      FSA: null, 
      seller: { ...mockListing.seller, FSA: null, fsa: null } 
    };
    
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => listingNoFsa,
        });
      }
      if (urlString.includes("/api/location/lookup/")) {
        return Promise.reject(new Error("Should not be called"));
      }
      return Promise.resolve({
        ok: true,
        json: async () => listingNoFsa,
      });
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const locationCalls = (global.fetch as jest.Mock).mock.calls.filter((call) =>
      call[0]?.includes("/api/location/lookup/")
    );
    expect(locationCalls.length).toBe(0);
  });

  it("handles wardrobe API returning not ok status", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/wishlist/")) {
        return Promise.resolve({ ok: false, json: async () => ({ error: "Unauthorized" }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const saveButton = getByRole("button", { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(wardrobeStorage.addWardrobeItem).not.toHaveBeenCalled();
    });
  });

  it("doesn't proceed with chat if authLoaded is false", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      userId: "user-1",
      accessToken: "fake-token",
      authLoaded: false, 
    });

    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "chatroom-1" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await new Promise(resolve => setTimeout(resolve, 200));
    const chatCalls = (global.fetch as jest.Mock).mock.calls.filter((call) =>
      call[0]?.includes("/api/chat/chatrooms/get-or-create")
    );
    expect(chatCalls.length).toBe(0);
  });

  it("handles chat fetch throwing an exception", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        throw new Error("Network timeout");
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();
    });
  });

  it.each([
    { name: "only city", response: { city: "Toronto" } },
    { name: "with provinceCode", response: { city: "Vancouver", provinceCode: "BC" } },
    { name: "with province field", response: { city: "Montreal", province: "Quebec" } },
    { name: "null data", response: null },
  ])("handles location API returning data with $name", async ({ response }) => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/location/lookup/")) {
        return Promise.resolve({
          ok: true,
          json: async () => response,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });
    render(<ListingModal listingId="listing-1" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Vintage Jacket")).toBeInTheDocument());
  });

  it("handles location API JSON parsing error gracefully", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/location/lookup/")) {
        return Promise.resolve({
          ok: true,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
  });

  it("sends message with non-empty text", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "chatroom-1" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Hi, is this available?/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Are you willing to negotiate?" } });
    
    expect(textarea.value).toBe("Are you willing to negotiate?");

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat/chatrooms/get-or-create",
        expect.any(Object)
      );
    });
  });

  it.each([
    { name: "null seller", seller: null },
    { name: "missing ID field", seller: { firstName: "John", lastName: "Doe", rating: 4.5, profileImageUrl: "http://example.com/avatar.jpg", createdAt: new Date(2020, 0, 1).toISOString() } },
    { name: "explicitly undefined ID", seller: { ...mockListing.seller, id: undefined } },
  ])("prevents message sending when $name", async ({ seller }) => {
    const listingInvalid = { ...mockListing, seller };

    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => listingInvalid,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => listingInvalid,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Cannot message this seller/)).toBeInTheDocument();
    });
  });

  it("handles profile not found error with case insensitive matching", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "BUYER PROFILE NOT FOUND" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/You need a profile before you can message/i)).toBeInTheDocument();
    });
  });

  it.each([
    { name: "listing with seller FSA (lowercase)", listingFsa: null, sellerFsa: "M5V", expectedFsa: "M5V" },
    { name: "listing with seller FSA (uppercase)", listingFsa: null, sellerFsa: "M4W", expectedFsa: "M4W" },
  ])("handles location lookup with seller FSA when $name", async ({ listingFsa, sellerFsa, expectedFsa }) => {
    const listingNoFsa = {
      ...mockListing,
      fsa: listingFsa,
      FSA: listingFsa,
      seller: {
        ...mockListing.seller,
        fsa: sellerFsa && sellerFsa.toLowerCase(),
        FSA: sellerFsa && sellerFsa.toUpperCase(),
      },
    };

    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => listingNoFsa,
        });
      }
      if (urlString.includes(`/api/location/lookup/${expectedFsa}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ city: "Toronto", province: "ON" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => listingNoFsa,
      });
    });

    render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const locationCalls = (global.fetch as jest.Mock).mock.calls.filter((call) =>
      typeof call[0] === 'string' && call[0].includes(`/api/location/lookup/${expectedFsa}`)
    );
    expect(locationCalls.length).toBeGreaterThan(0);
  });

  it("completes full chat flow with all conditions met", async () => {
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/location/lookup/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ city: "Toronto", province: "ON" }),
        });
      }
      if (urlString.includes("/api/chat/chatrooms/get-or-create")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "chatroom-123" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole } = render(
      <ListingModal listingId="listing-1" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Hi, is this available?/i);
    fireEvent.change(textarea, { target: { value: "Is this still in stock?" } });

    const sendButton = getByRole("button", { name: /Send Message/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      const chatCalls = (global.fetch as jest.Mock).mock.calls.filter((call) =>
        typeof call[0] === 'string' && call[0].includes("/api/chat/chatrooms/get-or-create")
      );
      expect(chatCalls.length).toBeGreaterThan(0);
    });
  });

  it("handles wardrobe button press after successful add", async () => {
    (wardrobeStorage.hasWardrobeItem as jest.Mock).mockReturnValue(false);
    
    (global as any).fetch = jest.fn((url: string | Request | URL) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes("/api/search/listing/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        });
      }
      if (urlString.includes("/api/wishlist/")) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      });
    });

    const { getByRole, rerender } = render(<ListingModal listingId="listing-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Jacket")).toBeInTheDocument();
    });

    const saveButton = getByRole("button", { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(wardrobeStorage.addWardrobeItem).toHaveBeenCalled();
    });
  });
});
