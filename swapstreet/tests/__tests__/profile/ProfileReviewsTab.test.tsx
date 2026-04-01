import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProfileReviewsTab } from "@/components/profile/ProfileReviewsTab";

jest.mock("next/image", () => {
  const MockNextImage = (props: React.ComponentProps<"img">) => {
    const { src, alt, ...rest } = props;
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

const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

const mockGetProfileReviews = jest.fn();
const mockDeleteProfileReview = jest.fn();
jest.mock("@/lib/api/profile", () => ({
  getProfileReviews: (...args: unknown[]) => mockGetProfileReviews(...args),
  deleteProfileReview: (...args: unknown[]) => mockDeleteProfileReview(...args),
}));

describe("ProfileReviewsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userId: "user-1",
      accessToken: "token-123",
    });
  });

  it("renders reviewer name and star count", async () => {
    mockGetProfileReviews.mockResolvedValue([
      {
        id: "review-1",
        chatroomId: "room-1",
        reviewerId: "user-2",
        reviewerFirstName: "Jane",
        reviewerLastName: "Doe",
        reviewerProfileImagePath: null,
        revieweeId: "profile-1",
        stars: 4,
        description: "Smooth deal",
        createdAt: "2026-03-20T12:00:00.000Z",
      },
    ]);

    render(<ProfileReviewsTab profileId="profile-1" />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("4/5")).toBeInTheDocument();
    expect(screen.getByText("Smooth deal")).toBeInTheDocument();
  });

  it("shows remove only for the signed-in user's own review and deletes it", async () => {
    mockGetProfileReviews.mockResolvedValue([
      {
        id: "review-1",
        chatroomId: "room-1",
        reviewerId: "user-1",
        reviewerFirstName: "You",
        reviewerLastName: "User",
        reviewerProfileImagePath: null,
        revieweeId: "profile-1",
        stars: 5,
        description: null,
        createdAt: "2026-03-20T12:00:00.000Z",
      },
      {
        id: "review-2",
        chatroomId: "room-2",
        reviewerId: "user-2",
        reviewerFirstName: "Other",
        reviewerLastName: "Person",
        reviewerProfileImagePath: null,
        revieweeId: "profile-1",
        stars: 3,
        description: null,
        createdAt: "2026-03-19T12:00:00.000Z",
      },
    ]);
    mockDeleteProfileReview.mockResolvedValue(undefined);

    render(<ProfileReviewsTab profileId="profile-1" />);

    expect(await screen.findByText("You User")).toBeInTheDocument();
    expect(screen.getByText("Other Person")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(mockDeleteProfileReview).toHaveBeenCalledWith(
        "token-123",
        "review-1",
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("You User")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Other Person")).toBeInTheDocument();
  });
});
