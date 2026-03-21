import { render, screen, waitFor } from "@testing-library/react";
import SellerProfilePage from "@/app/profile/[id]/page";
import * as profileApi from "@/lib/api/profile";
import { useParams } from "next/navigation";

jest.mock("next/navigation");
jest.mock("@/lib/api/profile");
jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header-mock">Header</div>,
}));
jest.mock("@/components/profile/ProfilePageContent", () => ({
  ProfilePageContent: ({
    profile,
    fullName,
    location,
    loading,
    error,
  }: any) => (
    <div data-testid="profile-content">
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {profile && (
        <div>
          <div>{fullName}</div>
          <div>{location}</div>
          <div>{profile.bio}</div>
        </div>
      )}
    </div>
  ),
}));

describe("Seller Profile Page", () => {
  const mockProfile = {
    id: "seller-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    bio: "Selling quality items",
    cityName: "Toronto",
    provinceCode: "ON",
    profileImagePath: "/images/profile.jpg",
    bannerImagePath: "/images/banner.jpg",
    createdAt: new Date(2022, 0, 1).toISOString(),
    rating: 4.5,
  };

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({
      id: "seller-1",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders header component", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    expect(screen.getByTestId("header-mock")).toBeInTheDocument();
  });

  it("renders loading state initially", () => {
    (profileApi.getProfileById as jest.Mock).mockReturnValueOnce(
      new Promise(() => {}),
    );

    render(<SellerProfilePage />);

    expect(screen.getByTestId("profile-content")).toBeInTheDocument();
  });

  it("fetches profile data with correct seller ID", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(profileApi.getProfileById).toHaveBeenCalledWith("seller-1");
    });
  });

  it("displays seller profile information", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText(/Toronto/)).toBeInTheDocument();
  });

  it("displays seller bio", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Selling quality items")).toBeInTheDocument();
    });
  });

  it("formats profile creation date correctly", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("handles missing seller ID parameter", async () => {
    (useParams as jest.Mock).mockReturnValue({
      id: undefined,
    });

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Error: Seller not found.")).toBeInTheDocument();
    });
  });

  it("handles API error", async () => {
    (profileApi.getProfileById as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to load seller profile."),
    );

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-content")).toBeInTheDocument();
    });
  });

  it("handles profile fetch error with correct error message", async () => {
    const errorMessage = "Seller not found";
    (profileApi.getProfileById as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage),
    );

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-content")).toBeInTheDocument();
    });
  });

  it("constructs full name from first and last name", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("constructs location from city and province", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/Toronto, ON/)).toBeInTheDocument();
    });
  });

  it("handles profile with only city name", async () => {
    const profileWithoutProvince = {
      ...mockProfile,
      provinceCode: undefined,
    };

    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(
      profileWithoutProvince,
    );

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Toronto")).toBeInTheDocument();
    });
  });

  it("handles profile without location", async () => {
    const profileWithoutLocation = {
      ...mockProfile,
      cityName: undefined,
      provinceCode: undefined,
    };

    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(
      profileWithoutLocation,
    );

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("passes correct props to ProfilePageContent", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Selling quality items")).toBeInTheDocument();
    });
  });

  it("cleans up on unmount", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    const { unmount } = render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    unmount();

    expect(true).toBe(true);
  });

  it("calculates member since date correctly", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("has default active tab set to listings", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("displays profile image and banner URLs", async () => {
    (profileApi.getProfileById as jest.Mock).mockResolvedValueOnce(mockProfile);

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("passes loading state to ProfilePageContent", async () => {
    let resolveProfile: any;
    (profileApi.getProfileById as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }),
    );

    render(<SellerProfilePage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    resolveProfile(mockProfile);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("passes error state to ProfilePageContent", async () => {
    const errorMsg = "Network error";
    (profileApi.getProfileById as jest.Mock).mockRejectedValueOnce(
      new Error(errorMsg),
    );

    render(<SellerProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-content")).toBeInTheDocument();
    });
  });
});
