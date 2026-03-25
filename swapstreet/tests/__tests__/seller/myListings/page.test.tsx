import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MyListingsPage from "@/app/seller/myListings/page";
import { getSearchResults } from "@/lib/api/browse";
import { getMyProfile } from "@/lib/api/profile";

jest.mock("next/image", () => {
  const MockNextImage = (props: React.ComponentProps<"img">) => {
    const { src, alt, fill, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={typeof src === "string" ? src : "/default.png"}
        alt={alt ?? "image"}
        {...rest}
      />
    );
  };
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock("lucide-react", () => ({
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
}));

const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

const mockGetMyProfile = jest.fn();
jest.mock("@/lib/api/profile", () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
}));

const mockGetSearchResults = jest.fn();
jest.mock("@/lib/api/browse", () => ({
  getSearchResults: (...args: unknown[]) => mockGetSearchResults(...args),
}));

describe("MyListingsPage", () => {
  const mockProfile = {
    id: "user-123",
    firstName: "John",
    lastName: "Doe",
    rating: 4.5,
    status: "Online",
    verifiedSeller: false,
    cityId: 1,
    fsa: "M5H",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const mockListings = [
    {
      id: "listing-1",
      title: "Blue Jeans",
      price: 50,
      fsa: "M5H",
      images: [{ imageUrl: "https://example.com/jeans.jpg" }],
    },
    {
      id: "listing-2",
      title: "Red Sweater",
      price: 35,
      fsa: "M5H",
      images: [{ imageUrl: "https://example.com/sweater.jpg" }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redirects to sign-in when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
    });

    render(<MyListingsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Please sign in to view and manage listings/i),
      ).toBeInTheDocument();
    });

    const signInButton = screen.getByRole("button", { name: /Sign in/i });
    expect(signInButton).toBeInTheDocument();

    fireEvent.click(signInButton);
    expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("loads and displays user listings when authenticated", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    await waitFor(() => {
      expect(mockGetMyProfile).toHaveBeenCalledWith("token-123");
    });

    await waitFor(() => {
      expect(mockGetSearchResults).toHaveBeenCalledWith({
        sellerId: "user-123",
        pageSize: 50,
      });
    });

    expect(await screen.findByText("Blue Jeans")).toBeInTheDocument();
    expect(screen.getByText("Red Sweater")).toBeInTheDocument();
    expect(screen.getByText("$50.00 CAD")).toBeInTheDocument();
    expect(screen.getByText("$35.00 CAD")).toBeInTheDocument();
  });

  it("shows loading state initially", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });

    let resolveProfile: (value: unknown) => void;
    const profilePromise = new Promise((resolve) => {
      resolveProfile = resolve;
    });
    mockGetMyProfile.mockReturnValue(profilePromise);

    render(<MyListingsPage />);

    expect(screen.getByText(/Loading listings\.\.\./i)).toBeInTheDocument();

    resolveProfile!(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading listings/i)).not.toBeInTheDocument();
    });
  });

  it("displays empty state when no listings found", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    expect(await screen.findByText(/No listings found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create a listing/i }),
    ).toBeInTheDocument();
  });

  it("navigates to create listing when create button clicked", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const createButton = await screen.findByRole("button", {
      name: /Create a listing/i,
    });
    fireEvent.click(createButton);

    expect(mockPush).toHaveBeenCalledWith("/seller/createListing");
  });

  it("navigates back to profile when back button clicked", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const backButton = await screen.findByRole("button", {
      name: /Back to profile/i,
    });
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("shows delete confirmation dialog when delete button clicked", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const deleteButtons = await screen.findAllByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Delete this listing\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Yes, delete/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("cancels delete confirmation when cancel clicked", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/Delete this listing\?/i),
      ).not.toBeInTheDocument();
    });
  });

  it("successfully deletes a listing when confirmed", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /Yes, delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/listings/listing-1"),
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            Authorization: "Bearer token-123",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Blue Jeans")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Red Sweater")).toBeInTheDocument();
  });

  it("shows error message when delete fails", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "You do not own this listing" }),
    });

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /Yes, delete/i });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText(/You do not own this listing/i),
    ).toBeInTheDocument();

    expect(screen.getByText("Blue Jeans")).toBeInTheDocument();
  });

  it("handles generic delete error", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /Yes, delete/i });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText(/Could not delete listing/i),
    ).toBeInTheDocument();
  });

  it("handles network error during delete", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /Yes, delete/i });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText(/Failed to delete listing/i),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("disables buttons while delete is in progress", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    let resolveDelete: () => void;
    const deletePromise = new Promise<Response>((resolve) => {
      resolveDelete = () =>
        resolve({
          ok: true,
          json: async () => ({}),
        } as Response);
    });
    (global.fetch as jest.Mock).mockReturnValue(deletePromise);

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /Yes, delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Deleting\.\.\./i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    expect(cancelButton).toBeDisabled();

    resolveDelete!();

    await waitFor(() => {
      expect(screen.queryByText(/Deleting\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it("shows error message when profile fetch fails", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockRejectedValue(new Error("Profile not found"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<MyListingsPage />);

    expect(
      await screen.findByText(/Failed to load listings/i),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("shows error message when search results fetch fails", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockRejectedValue(new Error("Search failed"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<MyListingsPage />);

    expect(
      await screen.findByText(/Failed to load listings/i),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("uses fallback image when listing has no images", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [
        {
          id: "listing-3",
          title: "No Image Item",
          price: 20,
          fsa: "M5H",
          images: [],
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const images = await screen.findAllByRole("img");
    const listingImage = images.find((img) =>
      (img as HTMLImageElement).src.includes("default-seller-banner"),
    );
    expect(listingImage).toBeInTheDocument();
  });

  it("uses fallback image when listing images array has null imageUrl", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [
        {
          id: "listing-4",
          title: "Null Image Item",
          price: 15,
          fsa: "M5H",
          images: [{ imageUrl: null }],
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const images = await screen.findAllByRole("img");
    const listingImage = images.find((img) =>
      (img as HTMLImageElement).src.includes("default-seller-banner"),
    );
    expect(listingImage).toBeInTheDocument();
  });

  it("displays all delete buttons for multiple listings", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Jeans")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("only shows confirmation dialog for the clicked listing", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButtons = screen.getAllByRole("button", {
      name: /Yes, delete/i,
    });
    expect(confirmButtons).toHaveLength(1);
  });

  it("redirects to sign-in when deleting without token", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
    });

    const deleteButton = await screen.findByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /Yes, delete/i });
    fireEvent.click(confirmButton);

    expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("renders listing titles and prices correctly", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    expect(await screen.findByText("Blue Jeans")).toBeInTheDocument();
    expect(screen.getByText("Red Sweater")).toBeInTheDocument();
    expect(screen.getByText("$50.00 CAD")).toBeInTheDocument();
    expect(screen.getByText("$35.00 CAD")).toBeInTheDocument();
  });

  it("clears error state before loading listings", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Jeans")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Failed to load listings/i),
    ).not.toBeInTheDocument();
  });

  it("renders images with proper unoptimized flag for MinIO URLs", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [
        {
          id: "listing-5",
          title: "MinIO Item",
          price: 40,
          fsa: "M5H",
          images: [{ imageUrl: "http://localhost:9000/minio/bucket/image.jpg" }],
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    const image = (await screen.findByAltText(/MinIO Item/i)) as HTMLImageElement;
    expect(image.src).toContain("minio");
  });

  it("handles empty items array from API gracefully", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: null as any,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    expect(await screen.findByText(/No listings found/i)).toBeInTheDocument();
  });

  it("shows error if profile has no listings after successful load", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    expect(await screen.findByText(/No listings found/i)).toBeInTheDocument();
  });

  it("maintains listing state after cancel delete", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: "token-123",
      isAuthenticated: true,
    });
    mockGetMyProfile.mockResolvedValue(mockProfile);
    mockGetSearchResults.mockResolvedValue({
      items: mockListings,
      nextCursor: null,
      hasNextPage: false,
    });

    render(<MyListingsPage />);

    expect(await screen.findByText("Blue Jeans")).toBeInTheDocument();
    expect(screen.getByText("Red Sweater")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", {
      name: /Delete Blue Jeans/i,
    });
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.getByText("Blue Jeans")).toBeInTheDocument();
    expect(screen.getByText("Red Sweater")).toBeInTheDocument();
  });
});
