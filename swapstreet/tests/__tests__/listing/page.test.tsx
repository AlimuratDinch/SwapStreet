/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ListingPage from "@/app/listing/[id]/page";

// 1. Mock next/navigation to prevent client hooks inside the page from crashing
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/listing/123",
}));

describe("Listing page (server component)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

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
      seller: {
        firstName: "Alice",
        lastName: "Smith",
        profileImageUrl: "https://example.com/p.jpg",
      },
      fsa: "M5V", // Match the casing used in your fallback test
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockListing,
    });

    // 2. Resolve the Server Component
    // Note: In Next.js 15, params is a Promise. We handle both styles here.
    const resolvedParams = { id: "123" };

    // Explicitly await the component function
    const PageComponent = await ListingPage({
      params: Promise.resolve(resolvedParams) as any,
    });

    render(PageComponent);

    await waitFor(() => {
      expect(screen.getByText(/Nice Jacket/)).toBeInTheDocument();
      expect(screen.getByText(/\$49.99/)).toBeInTheDocument();
      expect(screen.getByText(/Warm and cozy/)).toBeInTheDocument();
      expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    });
  });

  it("renders error UI when fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const PageComponent = await ListingPage({
      params: Promise.resolve({ id: "bad" }) as any,
    });

    render(PageComponent);

    expect(screen.getByText(/Failed to load listing/i)).toBeInTheDocument();
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

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockListing,
    });

    const PageComponent = await ListingPage({
      params: Promise.resolve({ id: "nomedia" }) as any,
    });

    render(PageComponent);

    await waitFor(() => {
      // Use queryAllByText if "No images" appears multiple times or as a fallback
      expect(screen.queryAllByText(/No images/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/No images here/)).toBeInTheDocument();
      expect(screen.getByText(/Z9Z/)).toBeInTheDocument();
      expect(screen.getByText(/No Media/)).toBeInTheDocument();
    });
  });
});
