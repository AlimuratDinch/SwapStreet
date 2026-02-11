import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";

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

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/app/browse/BrowseElements", () => ({
  Header: () => <div data-testid="header">Header</div>,
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

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows empty state when not authenticated", async () => {
    mockUseAuth.mockReturnValue({ accessToken: null });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/No Profile Found/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create Profile/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Profile/i }));
    expect(mockPush).toHaveBeenCalledWith("/seller/onboarding");
  });

  it("loads and renders profile when authenticated", async () => {
    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockGetMyProfile.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      rating: 4.5,
      cityName: "Toronto",
      provinceCode: "ON",
      profileImagePath: undefined,
      bannerImagePath: undefined,
    });

    render(<ProfilePage />);

    // call API
    await waitFor(() => {
      expect(mockGetMyProfile).toHaveBeenCalledWith("token-123");
    });

    // Renders name, rating, location
    expect(await screen.findByText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/\(4\.5\)/)).toBeInTheDocument();
    expect(screen.getByText(/Toronto, ON/)).toBeInTheDocument();

    // Default images (when no paths provided)
    expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
  });

  it("shows empty state if API fails", async () => {
    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockGetMyProfile.mockRejectedValue(new Error("boom"));

    render(<ProfilePage />);

    expect(await screen.findByText(/No Profile Found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Profile/i }),
    ).toBeInTheDocument();
  });

  it("shows a loading indicator while fetching, then renders profile", async () => {
    mockUseAuth.mockReturnValue({ accessToken: "token-xyz" });

    let resolveProfile: (v: unknown) => void;
    const pending = new Promise((res) => {
      resolveProfile = res as (v: unknown) => void;
    });
    mockGetMyProfile.mockReturnValue(pending);

    const { queryByText } = render(<ProfilePage />);

    expect(screen.getByText(/Loading profile\.\.\./i)).toBeInTheDocument();

    resolveProfile!({
      firstName: "Alex",
      lastName: "Kim",
      rating: 3.2,
      cityName: "Vancouver",
      provinceCode: "BC",
      profileImagePath: undefined,
      bannerImagePath: undefined,
    });

    expect(await screen.findByText(/Alex Kim/)).toBeInTheDocument();
    await waitFor(() =>
      expect(queryByText(/Loading profile/)).not.toBeInTheDocument(),
    );
  });

  it("shows 'Location not set' when city is missing", async () => {
    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockGetMyProfile.mockResolvedValue({
      firstName: "Pat",
      lastName: "Lee",
      rating: 4.0,
      cityName: undefined,
      provinceCode: undefined,
      profileImagePath: undefined,
      bannerImagePath: undefined,
    });

    render(<ProfilePage />);

    expect(await screen.findByText(/Pat Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Location not set/i)).toBeInTheDocument();
  });

  it("renders the correct number of filled stars based on rating", async () => {
    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockGetMyProfile.mockResolvedValue({
      firstName: "Sam",
      lastName: "Ng",
      rating: 3.2,
      cityName: "Calgary",
      provinceCode: "AB",
      profileImagePath: undefined,
      bannerImagePath: undefined,
    });

    const { container } = render(<ProfilePage />);
    expect(await screen.findByText(/Sam Ng/)).toBeInTheDocument();

    const filledStars = container.querySelectorAll(".fill-yellow-400");
    expect(filledStars.length).toBe(3);
    expect(screen.getByText(/\(3\.2\)/)).toBeInTheDocument();
  });

  it("uses MinIO URLs when image paths are provided", async () => {
    const original = process.env.NEXT_PUBLIC_MINIO_URL;
    process.env.NEXT_PUBLIC_MINIO_URL = "http://minio.test/public";

    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockGetMyProfile.mockResolvedValue({
      firstName: "Jamie",
      lastName: "Fox",
      rating: 5,
      cityName: "Ottawa",
      provinceCode: "ON",
      profileImagePath: "avatars/jamie.jpg",
      bannerImagePath: "banners/jamie-hero.jpg",
    });

    render(<ProfilePage />);

    expect(await screen.findByText(/Jamie Fox/)).toBeInTheDocument();

    const banner = screen.getByAltText(/Profile Banner/i) as HTMLImageElement;
    const avatar = screen.getByAltText(/Jamie Fox/i) as HTMLImageElement;

    expect(banner.src).toContain(
      "http://minio.test/public/banners/jamie-hero.jpg",
    );
    expect(avatar.src).toContain("http://minio.test/public/avatars/jamie.jpg");

    process.env.NEXT_PUBLIC_MINIO_URL = original;
  });
});
