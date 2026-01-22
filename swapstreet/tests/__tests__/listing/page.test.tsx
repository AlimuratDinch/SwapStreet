import { render, screen, waitFor } from "@testing-library/react";
import ListingPage from "@/app/listing/[id]/page";

describe("Listing page (server component)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("renders listing title, price, description, seller and images", async () => {
    const mockListing = {
      title: "Nice Jacket",
      price: 49.99,
      createdAt: new Date().toISOString(),
      description: "Warm and cozy",
      images: [{ imageUrl: "https://example.com/j1.jpg" }],
      seller: { firstName: "Alice", lastName: "Smith", profileImageUrl: "https://example.com/p.jpg", FSA: "M5V" },
    };

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockListing }) as any;

    // Render server component
    const element = await (ListingPage as any)({ params: { id: "123" } });
    render(element);

    await waitFor(() => {
      expect(screen.getByText(/Nice Jacket/)).toBeInTheDocument();
      expect(screen.getByText(/\$49.99/)).toBeInTheDocument();
      expect(screen.getByText(/Warm and cozy/)).toBeInTheDocument();
      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    });
  });

  it("renders error UI when fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500 }) as any;
    const element = await (ListingPage as any)({ params: { id: "bad" } });
    render(element);
    // Check for error message
    expect(screen.getByText(/Failed to load listing/i)).toBeInTheDocument();
  });

  it("handles missing images and seller gracefully", async () => {
    const mockListing = {
      title: "No Media",
      price: 0,
      createdAt: new Date().toISOString(),
      description: "No images here",
      images: [],
      location: undefined,
      seller: null,
      fsa: "Z9Z",
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockListing }) as any;
    const element = await (ListingPage as any)({ params: { id: "nomedia" } });
    render(element);

    await waitFor(() => {
      // Check for no images fallback
      const noImages = screen.getAllByText("No images");
      expect(noImages.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/No images here/)).toBeInTheDocument();
      expect(screen.getByText(/Z9Z/)).toBeInTheDocument();
      expect(screen.getByText(/No Media/)).toBeInTheDocument();
    });
  });
});
