import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SellerOnboardingPage from "@/app/seller/onboarding/page";
import "@testing-library/jest-dom";

// ----------------------------
// Mock router for client component
// ----------------------------
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// ----------------------------
// Mock URL.createObjectURL for jsdom
// ----------------------------
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

describe("SellerOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows error if city is missing", async () => {
    render(<SellerOnboardingPage />);
    const nameInput = screen.getByPlaceholderText(/what should we call you/i);
    fireEvent.change(nameInput, { target: { value: "Seller Name" } });
    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/please enter your city/i);
    expect(err).toBeInTheDocument();
  });

  it("shows error if province is not selected", async () => {
    render(<SellerOnboardingPage />);
    const nameInput = screen.getByPlaceholderText(/what should we call you/i);
    const cityInput = screen.getByPlaceholderText(/^city$/i);
    fireEvent.change(nameInput, { target: { value: "Seller Name" } });
    fireEvent.change(cityInput, { target: { value: "Toronto" } });
    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/please select a province/i);
    expect(err).toBeInTheDocument();
  });

  it("shows error when postal code is invalid format", async () => {
    render(<SellerOnboardingPage />);
    const nameInput = screen.getByPlaceholderText(/what should we call you/i);
    const cityInput = screen.getByPlaceholderText(/^city$/i);
    const provinceSelect = document.querySelector("select");
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);

    fireEvent.change(nameInput, { target: { value: "Seller Name" } });
    fireEvent.change(cityInput, { target: { value: "Toronto" } });
    fireEvent.change(provinceSelect!, { target: { value: "ON" } });
    fireEvent.change(postalInput, { target: { value: "INVALID" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/valid canadian postal code/i);
    expect(err).toBeInTheDocument();
  });

  it("renders the onboarding heading and form fields", () => {
    render(<SellerOnboardingPage />);
    expect(screen.getByText(/set up your seller profile/i)).toBeInTheDocument();
    // Updated placeholders and fields
    expect(
      screen.getByPlaceholderText(/what should we call you/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^city$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/a1a 1a1/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/brag a little!/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save and continue/i }),
    ).toBeInTheDocument();
  });

  it("shows error if display name is missing", async () => {
    render(<SellerOnboardingPage />);
    // Submit the form directly to bypass native required validation in JSDOM
    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/please enter a display name/i);
    expect(err).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    render(<SellerOnboardingPage />);

    const nameInput = screen.getByPlaceholderText(/what should we call you/i);
    const cityInput = screen.getByPlaceholderText(/^city$/i);
    const provinceSelect = document.querySelector("select");
    const bioInput = screen.getByPlaceholderText(/brag a little!/i);

    fireEvent.change(nameInput, { target: { value: "Seller Name" } });
    fireEvent.change(cityInput, { target: { value: "Toronto" } });
    fireEvent.change(bioInput, { target: { value: "This is my bio." } });
    // Select a province
    fireEvent.change(provinceSelect!, { target: { value: "ON" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/please enter a display name/i),
      ).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/seller/me?init=1");
    });
  });

  it("shows error if avatar file is not an image", () => {
    render(<SellerOnboardingPage />);
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(avatarInput!, { target: { files: [file] } });
    expect(
      screen.getByText(/avatar must be an image file/i),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText(/banner must be an image file/i),
    ).toBeInTheDocument();
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
