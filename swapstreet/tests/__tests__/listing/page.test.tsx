/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ListingPage from "@/app/listing/[id]/page";

// ──────────────────── Mocks ────────────────────

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/listing/123",
}));

let mockAuthState = {
  userId: null as string | null,
  accessToken: null as string | null,
  authLoaded: true,
  isAuthenticated: false,
};

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <header data-testid="header" />,
}));

// ──────────────────── Helpers ────────────────────

type Seller = {
  id?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  FSA?: string;
  fsa?: string;
} | null;

function setupFetch(
  listing: Record<string, unknown>,
  chatroomResponse?: { ok: boolean; status?: number; json?: () => Promise<unknown> }
) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/search/listing/")) {
      return Promise.resolve({ ok: true, json: async () => listing });
    }
    if (url.includes("/api/chat/chatrooms/get-or-create")) {
      return Promise.resolve(
        chatroomResponse ?? { ok: true, json: async () => ({ id: "cr-99" }) }
      );
    }
    return Promise.resolve({ ok: false, status: 404 });
  });
}

const baseListing = {
  title: "Cool Jacket",
  price: 25,
  createdAt: new Date().toISOString(),
  description: "Very cool",
  images: [],
  seller: { id: "seller-1", firstName: "Bob", lastName: "Seller" } as Seller,
  fsa: "M5V",
};

// ──────────────────── Tests ────────────────────

describe("ListingPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
    mockAuthState = { userId: null, accessToken: null, authLoaded: true, isAuthenticated: false };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ──────────────────── Basic renders ────────────────────

  it("renders listing title, price, description, seller and images", async () => {
    const mockListing = {
      title: "Nice Jacket",
      price: 49.99,
      createdAt: new Date().toISOString(),
      description: "Warm and cozy",
      images: [{ imageUrl: "https://example.com/j1.jpg" }],
      seller: { firstName: "Alice", lastName: "Smith", profileImageUrl: "https://example.com/p.jpg" },
      fsa: "M5V",
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockListing });

    render(<ListingPage params={Promise.resolve({ id: "123" }) as any} />);

    await waitFor(() => {
      expect(screen.getByText(/Nice Jacket/)).toBeInTheDocument();
      expect(screen.getByText(/\$49.99/)).toBeInTheDocument();
      expect(screen.getByText(/Warm and cozy/)).toBeInTheDocument();
      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    });
  });

  it("renders error UI when fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    render(<ListingPage params={Promise.resolve({ id: "bad" }) as any} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load listing/i)).toBeInTheDocument();
    });
  });

  it("handles missing images and seller gracefully", async () => {
    const mockListing = {
      title: "No Media",
      price: 0,
      createdAt: new Date().toISOString(),
      description: "No images here",
      images: [],
      seller: null,
      fsa: "Z9Z",
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockListing });

    render(<ListingPage params={Promise.resolve({ id: "nomedia" }) as any} />);

    await waitFor(() => {
      expect(screen.queryAllByText(/No images/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/No images here/)).toBeInTheDocument();
      expect(screen.getByText(/Z9Z/)).toBeInTheDocument();
      expect(screen.getByText(/No Media/)).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<ListingPage params={Promise.resolve({ id: "x" }) as any} />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // ──────────────────── Location fallbacks ────────────────────

  it("uses listing.location when present", async () => {
    setupFetch({ ...baseListing, location: "Toronto", fsa: undefined });
    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Toronto")).toBeInTheDocument());
  });

  it("falls back to listing.FSA when no location or fsa", async () => {
    setupFetch({ ...baseListing, FSA: "K1A", fsa: undefined });
    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("K1A")).toBeInTheDocument());
  });

  it("falls back to seller.FSA when listing has no location fields", async () => {
    setupFetch({
      ...baseListing,
      fsa: undefined,
      seller: { id: "seller-1", firstName: "Bob", lastName: "Seller", FSA: "V6B" },
    });
    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getAllByText("V6B").length).toBeGreaterThan(0));
  });

  it("falls back to 'Unknown' when all location fields are absent", async () => {
    setupFetch({ ...baseListing, fsa: undefined, seller: { id: "seller-1", firstName: "Bob", lastName: "Seller" } });
    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Unknown")).toBeInTheDocument());
  });

  // ──────────────────── handleStartChat - unauthenticated ────────────────────

  it("redirects to sign-in when unauthenticated user clicks Send message", async () => {
    mockAuthState = { userId: null, accessToken: null, authLoaded: true, isAuthenticated: false };
    setupFetch(baseListing);

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Send message"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/auth/sign-in"));
  });

  it("does nothing when authLoaded is false and Send message is clicked", async () => {
    mockAuthState = { userId: null, accessToken: null, authLoaded: false, isAuthenticated: false };
    setupFetch(baseListing);

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Send message"));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does nothing when seller has no id", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    setupFetch({ ...baseListing, seller: { firstName: "No", lastName: "Id" } });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Send message"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ──────────────────── handleStartChat - authenticated ────────────────────

  it("navigates to chatroom on successful chat creation", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    setupFetch(baseListing, { ok: true, json: async () => ({ id: "cr-42" }) });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Send message"));
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/chat/cr-42"));
  });

  it("appends ?msg= to the URL when a message is typed before clicking Send", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    setupFetch(baseListing, { ok: true, json: async () => ({ id: "cr-42" }) });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Write a message/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Write a message/i), { target: { value: "Hi!" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Send message"));
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/chat/cr-42?msg=Hi!")
    );
  });

  it("shows noProfile warning when buyer profile not found", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    setupFetch(baseListing, {
      ok: false,
      status: 403,
      json: async () => ({ error: "Buyer profile not found" }),
    });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Send message"));
    });

    await waitFor(() =>
      expect(screen.getByText(/You need a profile before you can message sellers/i)).toBeInTheDocument()
    );
  });

  it("navigates to onboarding when 'Create your profile' is clicked", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    setupFetch(baseListing, {
      ok: false,
      status: 403,
      json: async () => ({ error: "Buyer profile not found" }),
    });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText("Send message")); });
    await waitFor(() => expect(screen.getByText("Create your profile")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Create your profile"));
    expect(mockPush).toHaveBeenCalledWith("/seller/onboarding");
  });

  it("shows chatError when the API returns a non-profile error", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    setupFetch(baseListing, {
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText("Send message")); });

    await waitFor(() =>
      expect(screen.getByText(/Internal server error/i)).toBeInTheDocument()
    );
  });

  it("shows generic chatError when fetch throws a non-Error value", async () => {
    mockAuthState = { userId: "u-1", accessToken: "tok", authLoaded: true, isAuthenticated: true };
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/search/listing/")) {
        return Promise.resolve({ ok: true, json: async () => baseListing });
      }
      return Promise.reject("network down");
    });

    render(<ListingPage params={Promise.resolve({ id: "1" }) as any} />);
    await waitFor(() => expect(screen.getByText("Send message")).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText("Send message")); });

    await waitFor(() =>
      expect(screen.getByText(/Failed to start chat/i)).toBeInTheDocument()
    );
  });
});
