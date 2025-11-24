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
// Mock API functions
// ----------------------------
jest.mock("@/lib/api/profile", () => ({
  createProfile: jest.fn().mockResolvedValue({ id: "test-id" }),
  uploadImage: jest.fn().mockResolvedValue("https://example.com/image.jpg"),
}));

// ----------------------------
// Mock URL.createObjectURL for jsdom
// ----------------------------
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

// ----------------------------
// Mock fetch for location data
// ----------------------------
const mockProvinces = [
  { id: 1, name: "Ontario", code: "ON" },
  { id: 2, name: "Quebec", code: "QC" },
];

const mockCities = [
  { id: 1, name: "Toronto", provinceId: 1 },
  { id: 2, name: "Ottawa", provinceId: 1 },
  { id: 3, name: "Montreal", provinceId: 2 },
];

global.fetch = jest.fn((url) => {
  if (url.includes("/api/location/provinces")) {
    return Promise.resolve({
      ok: true,
      json: async () => mockProvinces,
    });
  }
  if (url.includes("/api/location/cities")) {
    return Promise.resolve({
      ok: true,
      json: async () => mockCities,
    });
  }
  return Promise.resolve({
    ok: false,
    json: async () => ({ error: "Not found" }),
  });
}) as jest.Mock;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn((key) => {
    if (key === "accessToken") return "mock-token";
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

describe("SellerOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === "accessToken") return "mock-token";
      return null;
    });

    // Reset fetch mock to default behavior
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/location/provinces")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProvinces,
        });
      }
      if (url.includes("/api/location/cities")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCities,
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  });

  it("shows error if city is missing", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/please select a city/i);
    expect(err).toBeInTheDocument();
  });

  it("loads provinces and cities on mount", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/location/provinces"),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/location/cities"),
    );
  });

  it("shows error when postal code is invalid format", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "INVALID" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/valid canadian postal code/i);
    expect(err).toBeInTheDocument();
  });

  it("renders the onboarding heading and form fields", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/set up your seller profile/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/a1a 1a1/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/brag a little!/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save and continue/i }),
    ).toBeInTheDocument();
  });

  it("shows error if first name is missing", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/please enter your first name/i);
    expect(err).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    const { createProfile } = require("@/lib/api/profile");
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);
    const bioInput = screen.getByPlaceholderText(/brag a little!/i);

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(bioInput, { target: { value: "This is my bio." } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(createProfile).toHaveBeenCalledWith("mock-token", {
        firstName: "John",
        lastName: "Doe",
        bio: "This is my bio.",
        locationId: 1,
        fsa: "M5V",
        profileImagePath: undefined,
        bannerImagePath: undefined,
      });
      expect(mockPush).toHaveBeenCalledWith("/seller/me");
    });
  });

  it("shows error if avatar file is not an image", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(avatarInput!, { target: { files: [file] } });

    expect(
      screen.getByText(/avatar must be an image file/i),
    ).toBeInTheDocument();
  });

  it("shows avatar preview when a valid image is selected", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const imageFile = new File(["(⌐□_□)"], "avatar.png", { type: "image/png" });

    fireEvent.change(avatarInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      const img = screen.getByAltText(/avatar preview/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-url");
    });
  });

  it("shows error if banner file is not an image", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    const file = new File(["bad"], "banner.txt", { type: "text/plain" });
    fireEvent.change(bannerInput!, { target: { files: [file] } });

    expect(
      screen.getByText(/banner must be an image file/i),
    ).toBeInTheDocument();
  });

  it("shows banner preview when a valid image is selected", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    const imageFile = new File(["123"], "banner.png", { type: "image/png" });

    fireEvent.change(bannerInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      const img = screen.getByAltText(/banner preview/i);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-url");
    });
  });

  it("shows error if postal code is missing", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    fireEvent.change(citySelect, { target: { value: "1" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/postal code is required/i);
    expect(err).toBeInTheDocument();
  });

  it("filters cities based on selected province", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);

    // Initially city should be disabled
    expect(citySelect).toBeDisabled();

    // Select Ontario
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });
  });

  it("shows error when location data fails to load", async () => {
    // Mock fetch to fail
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error")),
    );

    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(/failed to load location data/i),
    ).toBeInTheDocument();
  });

  it("shows error when location API returns non-ok response", async () => {
    // Mock fetch to return non-ok response
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/location/provinces")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Server error" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCities,
      });
    });

    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Provinces should be empty
    const provinceSelect = screen.getByLabelText(/province/i);
    const options = provinceSelect.querySelectorAll("option");
    expect(options.length).toBe(1); // Only the disabled placeholder
  });

  it("clears avatar preview when file input is cleared", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const imageFile = new File(["test"], "avatar.png", { type: "image/png" });

    // Add file
    fireEvent.change(avatarInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(screen.getByAltText(/avatar preview/i)).toBeInTheDocument();
    });

    // Clear file
    fireEvent.change(avatarInput!, { target: { files: [] } });

    await waitFor(() => {
      expect(screen.queryByAltText(/avatar preview/i)).not.toBeInTheDocument();
    });
  });

  it("clears banner preview when file input is cleared", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    const imageFile = new File(["test"], "banner.png", { type: "image/png" });

    // Add file
    fireEvent.change(bannerInput!, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(screen.getByAltText(/banner preview/i)).toBeInTheDocument();
    });

    // Clear file
    fireEvent.change(bannerInput!, { target: { files: [] } });

    await waitFor(() => {
      expect(screen.queryByAltText(/banner preview/i)).not.toBeInTheDocument();
    });
  });

  it("handles image upload failure", async () => {
    const { uploadImage } = require("@/lib/api/profile");
    uploadImage.mockRejectedValueOnce(new Error("Upload failed"));

    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    // Add avatar file
    const imageFile = new File(["test"], "avatar.png", { type: "image/png" });
    fireEvent.change(avatarInput!, { target: { files: [imageFile] } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it("handles profile creation failure", async () => {
    const { createProfile } = require("@/lib/api/profile");
    createProfile.mockRejectedValueOnce(new Error("Profile already exists"));

    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/profile already exists/i)).toBeInTheDocument();
    });
  });

  it("redirects to sign-in if not authenticated", async () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/your last name/i);
    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);
    const postalInput = screen.getByPlaceholderText(/a1a 1a1/i);

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/you must be logged in/i)).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  it("resets city selection when changing province to one without the selected city", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const provinceSelect = screen.getByLabelText(/province/i);
    const citySelect = screen.getByLabelText(/city/i);

    // Select Ontario
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
    });

    // Select Toronto
    fireEvent.change(citySelect, { target: { value: "1" } });
    expect(citySelect).toHaveValue("1");

    // Change to Quebec (Toronto is not in Quebec)
    fireEvent.change(provinceSelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(citySelect).toHaveValue("");
    });
  });
});
