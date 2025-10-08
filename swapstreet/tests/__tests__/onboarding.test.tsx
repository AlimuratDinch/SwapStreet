import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SellerOnboardingPage from "@/app/seller/onboarding/page";
import "@testing-library/jest-dom";

// ----------------------------
// Mock router for client component
// ----------------------------
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ----------------------------
// Mock URL.createObjectURL for jsdom
// ----------------------------
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

describe("SellerOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the onboarding heading and form fields", () => {
    render(<SellerOnboardingPage />);
    expect(screen.getByText(/set up your seller profile/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/alex johnson/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/city, country/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/share your style/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save and continue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip for now/i })).toBeInTheDocument();
  });

  it("shows error if display name is missing", async () => {
    render(<SellerOnboardingPage />);

    const nameInput = screen.getByPlaceholderText(/alex johnson/i);
    nameInput.removeAttribute("required");

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    const err = await screen.findByText(/please enter a display name/i);
    expect(err).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    render(<SellerOnboardingPage />);

    const nameInput = screen.getByPlaceholderText(/alex johnson/i);
    const locationInput = screen.getByPlaceholderText(/city, country/i);
    const bioInput = screen.getByPlaceholderText(/share your style/i);

    fireEvent.change(nameInput, { target: { value: "Seller Name" } });
    fireEvent.change(locationInput, { target: { value: "City, Country" } });
    fireEvent.change(bioInput, { target: { value: "This is my bio." } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.queryByText(/please enter a display name/i)).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("navigates home when clicking 'Skip for now'", () => {
    render(<SellerOnboardingPage />);
    const skipButton = screen.getByRole("button", { name: /skip for now/i });
    fireEvent.click(skipButton);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows error if avatar file is not an image", () => {
    render(<SellerOnboardingPage />);
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(avatarInput!, { target: { files: [file] } });
    expect(screen.getByText(/avatar must be an image file/i)).toBeInTheDocument();
  });

  it("shows avatar preview when a valid image is selected", async () => {
    render(<SellerOnboardingPage />);
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const imageFile = new File(["(⌐□_□)"], "avatar.png", { type: "image/png" });

    fireEvent.change(avatarInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      const img = screen.getByAltText(/avatar preview/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-url");
    });
  });

  it("shows error if banner file is not an image", () => {
    render(<SellerOnboardingPage />);
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    const file = new File(["bad"], "banner.txt", { type: "text/plain" });
    fireEvent.change(bannerInput!, { target: { files: [file] } });
    expect(screen.getByText(/banner must be an image file/i)).toBeInTheDocument();
  });

  it("shows banner preview when a valid image is selected", async () => {
    render(<SellerOnboardingPage />);
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    const imageFile = new File(["123"], "banner.png", { type: "image/png" });

    fireEvent.change(bannerInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      const img = screen.getByAltText(/banner preview/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-url");
    });
  });

  it("shows banner preview when a valid image is selected", async () => {
    render(<SellerOnboardingPage />);
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    const imageFile = new File(["123"], "banner.png", { type: "image/png" });

    fireEvent.change(bannerInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      const img = screen.getByAltText(/banner preview/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-url");
    });
  });
});
