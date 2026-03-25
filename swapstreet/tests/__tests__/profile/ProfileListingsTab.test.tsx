import { render, screen, waitFor } from "@testing-library/react";
import { ProfileListingsTab } from "@/components/profile/ProfileListingsTab";
import * as browseApi from "@/lib/api/browse";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/app/browse/components/CardItem", () => ({
  CardItem: ({ title, id }: { title: string; id: string }) => (
    <div data-testid={`listing-card-${id}`}>{title}</div>
  ),
}));

jest.mock("@/lib/api/browse");

describe("ProfileListingsTab", () => {
  const sellerId = "11111111-2222-3333-4444-555555555555";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading then renders listing cards from search results", async () => {
    (browseApi.getSearchResults as jest.Mock).mockResolvedValueOnce({
      items: [
        {
          id: "a1",
          title: "Blue jacket",
          price: 25,
          fsa: "M5V",
          images: [{ imageUrl: "https://example.com/a.jpg" }],
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<ProfileListingsTab sellerId={sellerId} isCurrentUserProfile />);

    expect(screen.getByText("Loading listings...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("listing-card-a1")).toHaveTextContent(
        "Blue jacket",
      );
    });

    expect(
      screen.getByRole("heading", { name: "My Listings" }),
    ).toBeInTheDocument();
    expect(browseApi.getSearchResults).toHaveBeenCalledWith({
      sellerId,
      pageSize: 18,
    });
  });

  it("uses neutral Listings heading for other users profiles", async () => {
    (browseApi.getSearchResults as jest.Mock).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<ProfileListingsTab sellerId={sellerId} />);

    await waitFor(() => {
      expect(
        screen.getByText("This seller has no active listings."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Listings" }),
    ).toBeInTheDocument();
  });

  it("shows empty state when seller has no listings", async () => {
    (browseApi.getSearchResults as jest.Mock).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<ProfileListingsTab sellerId={sellerId} />);

    await waitFor(() => {
      expect(
        screen.getByText("This seller has no active listings."),
      ).toBeInTheDocument();
    });
  });

  it("shows one card per listing id when the API returns duplicate ids", async () => {
    (browseApi.getSearchResults as jest.Mock).mockResolvedValueOnce({
      items: [
        {
          id: "dup-1",
          title: "Japan jersey",
          price: 90,
          fsa: "H7L",
          images: [],
        },
        {
          id: "dup-1",
          title: "Japan jersey",
          price: 90,
          fsa: "H7L",
          images: [{ imageUrl: "https://example.com/jersey.jpg" }],
        },
      ],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<ProfileListingsTab sellerId={sellerId} />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^listing-card-/)).toHaveLength(1);
    });
    expect(screen.getByTestId("listing-card-dup-1")).toBeInTheDocument();
  });
});
