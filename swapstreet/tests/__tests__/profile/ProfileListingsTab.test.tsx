import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileListingsTab } from "@/components/profile/ProfileListingsTab";
import * as browseApi from "@/lib/api/browse";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
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
    expect(
      screen.getByRole("button", { name: "Create Listing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Listings" }),
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
    expect(
      screen.queryByRole("button", { name: /Create Listing/i }),
    ).not.toBeInTheDocument();
  });

  it("shows seller empty state message for other users", async () => {
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

  it("shows first-listing CTA variant for owner with no listings", async () => {
    (browseApi.getSearchResults as jest.Mock).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<ProfileListingsTab sellerId={sellerId} isCurrentUserProfile />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create your first listing" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("You have no active listings yet."),
      ).toBeInTheDocument();
    });
  });

  it("navigates to create listing page when CTA is clicked", async () => {
    const user = userEvent.setup();
    (browseApi.getSearchResults as jest.Mock).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    render(<ProfileListingsTab sellerId={sellerId} isCurrentUserProfile />);

    const button = await screen.findByRole("button", {
      name: "Create your first listing",
    });
    await user.click(button);

    expect(pushMock).toHaveBeenCalledWith("/seller/createListing");
  });

  it("navigates to edit listings page when Edit Listings button is clicked", async () => {
    const user = userEvent.setup();
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

    const button = await screen.findByRole("button", {
      name: "Edit Listings",
    });
    await user.click(button);

    expect(pushMock).toHaveBeenCalledWith("/seller/myListings");
  });

  it("does not show Edit Listings button for non-owner profiles", async () => {
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

    render(<ProfileListingsTab sellerId={sellerId} />);

    await waitFor(() => {
      expect(screen.getByTestId("listing-card-a1")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Edit Listings" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create Listing" }),
    ).not.toBeInTheDocument();
  });
});
