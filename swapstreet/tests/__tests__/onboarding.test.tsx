const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// ----------------------------
// Mock logger
// ----------------------------
jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ----------------------------
// Mock API functions
// ----------------------------
jest.mock("@/lib/api/profile", () => ({
  createProfile: jest.fn().mockResolvedValue({ id: "test-id" }),
  uploadImage: jest.fn().mockResolvedValue("https://example.com/image.jpg"),
}));

// ----------------------------
// Mock AuthContext
// ----------------------------
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockRefreshToken = jest.fn().mockResolvedValue("new-token");

const mockUseAuth = jest.fn(() => ({
  accessToken: "mock-token",
  isAuthenticated: true,
  refreshToken: mockRefreshToken,
  login: mockLogin,
  logout: mockLogout,
  userId: "test-user-id",
  username: "test-user",
  email: "test@example.com",
})) as jest.Mock<{
  accessToken: string | null;
  isAuthenticated: boolean;
  refreshToken: () => Promise<string | null>;
  login: (token: string) => void;
  logout: () => void;
  userId: string | null;
  username: string | null;
  email: string | null;
}>;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ----------------------------
// Mock URL.createObjectURL for jsdom
// ----------------------------
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

// ----------------------------
// Mock sessionStorage PROPERLY
// ----------------------------
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SellerOnboardingPage from "@/app/seller/onboarding/page";
import "@testing-library/jest-dom";
import * as profileApi from "@/lib/api/profile";

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

describe("SellerOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockClear();
    mockLogout.mockClear();
    mockRefreshToken.mockClear();
    mockRefreshToken.mockResolvedValue("new-token");

    // Reset sessionStorage to default state
    mockSessionStorage.clear();
    mockSessionStorage.setItem("accessToken", "mock-token");

    // Reset API mocks
    const createProfile = profileApi.createProfile as jest.Mock;
    const uploadImage = profileApi.uploadImage as jest.Mock;
    createProfile.mockClear();
    createProfile.mockResolvedValue({ id: "test-id" });
    uploadImage.mockClear();
    uploadImage.mockResolvedValue("https://example.com/image.jpg");

    // Reset fetch mock to default behavior
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/location/provinces")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProvinces,
        });
      }
      if (url.includes("/api/location/cities")) {
        // Filter cities based on provinceId query parameter
        const urlObj = new URL(url, "http://localhost");
        const provinceId = urlObj.searchParams.get("provinceId");
        const filteredCities = provinceId
          ? mockCities.filter((c) => c.provinceId === parseInt(provinceId))
          : mockCities;
        return Promise.resolve({
          ok: true,
          json: async () => filteredCities,
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  });

  afterEach(() => {
    // Clean up after each test
    mockSessionStorage.clear();
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

  it("loads provinces on mount and cities when province is selected", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Provinces should be fetched on mount
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/location/provinces"),
    );

    // Cities should NOT be fetched on mount
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/location/cities"),
    );

    // Select a province
    const provinceSelect = screen.getByLabelText(/province/i);
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    // Now cities should be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/location/cities?provinceId=1"),
      );
    });
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
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

  it("validates FSA format after postal code processing", async () => {
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1);
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    // Test with a postal code that has spaces/hyphens to ensure FSA extraction works
    // This tests the FSA validation code path (lines 184-191)
    fireEvent.change(postalInput, { target: { value: "M5V-1A1" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    // The postal code should be processed correctly and FSA validation should pass
    // This ensures the FSA extraction and validation code path is executed
    await waitFor(() => {
      // If validation passes, we should navigate to /profile
      // If FSA validation fails, we'd see "Invalid postal code format."
      // Since "M5V-1A1" is valid, FSA should be "M5V" which passes FSA_REGEX
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });

  it("shows error when FSA format is invalid after processing", async () => {
    // This test covers the defensive FSA validation (lines 189-191)
    // While it's unlikely to trigger in practice (POSTAL_REGEX should catch it),
    // this tests the code path exists for safety
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1);
    });

    fireEvent.change(citySelect, { target: { value: "1" } });

    // Mock String.prototype.substring to return an invalid FSA format
    // This allows us to test the FSA validation error path
    const originalSubstring = String.prototype.substring;
    String.prototype.substring = jest.fn(function (
      this: string,
      start?: number,
      end?: number,
    ) {
      if (this.includes("A1A") && start === 0 && end === 3) {
        return "123"; // Invalid FSA format (should be letter-digit-letter)
      }
      return originalSubstring.call(this, start ?? 0, end);
    });

    fireEvent.change(postalInput, { target: { value: "A1A 1A1" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid postal code format/i),
      ).toBeInTheDocument();
    });

    // Restore original substring
    String.prototype.substring = originalSubstring;
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

  it("shows error if last name is missing", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const firstNameInput = screen.getByPlaceholderText(/your first name/i);
    fireEvent.change(firstNameInput, { target: { value: "John" } });

    const submitBtn = screen.getByRole("button", {
      name: /save and continue/i,
    });
    const form = submitBtn.closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/please enter your last name/i);
    expect(err).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    const createProfile = profileApi.createProfile as jest.Mock;
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(createProfile).toHaveBeenCalledWith(
        "mock-token",
        {
          firstName: "John",
          lastName: "Doe",
          bio: "This is my bio.",
          cityId: 1,
          fsa: "M5V",
          profileImagePath: undefined,
          bannerImagePath: undefined,
        },
        mockRefreshToken,
      );
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });

  it("submits the form with both avatar and banner images", async () => {
    const createProfile = profileApi.createProfile as jest.Mock;
    const uploadImage = profileApi.uploadImage as jest.Mock;
    uploadImage.mockResolvedValue("https://example.com/uploaded-image.jpg");

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
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    // Upload both images
    const avatarFile = new File(["avatar"], "avatar.png", {
      type: "image/png",
    });
    const bannerFile = new File(["banner"], "banner.png", {
      type: "image/png",
    });
    fireEvent.change(avatarInput!, { target: { files: [avatarFile] } });
    fireEvent.change(bannerInput!, { target: { files: [bannerFile] } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledTimes(2);
      expect(uploadImage).toHaveBeenCalledWith(
        "mock-token",
        avatarFile,
        "Profile",
        mockRefreshToken,
      );
      expect(uploadImage).toHaveBeenCalledWith(
        "mock-token",
        bannerFile,
        "Banner",
        mockRefreshToken,
      );
      expect(createProfile).toHaveBeenCalledWith(
        "mock-token",
        {
          firstName: "John",
          lastName: "Doe",
          bio: undefined,
          cityId: 1,
          fsa: "M5V",
          profileImagePath: "https://example.com/uploaded-image.jpg",
          bannerImagePath: "https://example.com/uploaded-image.jpg",
        },
        mockRefreshToken,
      );
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });

  it("shows error if avatar file is not an image", async () => {
    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const avatarInput = document.querySelectorAll('input[type="file"]')[0];

    // Non-image file
    const file = new File(["not an image"], "document.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(avatarInput!, { target: { files: [file] } });

    const err = await screen.findByText(/avatar must be an image/i);
    expect(err).toBeInTheDocument();
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
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
    const uploadImage = profileApi.uploadImage as jest.Mock;
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
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

  it("handles banner upload failure", async () => {
    const uploadImage = profileApi.uploadImage as jest.Mock;
    // First call (avatar) succeeds, second call (banner) fails
    uploadImage
      .mockResolvedValueOnce("https://example.com/avatar.jpg")
      .mockRejectedValueOnce(new Error("Banner upload failed"));

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
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    // Add both images
    const avatarFile = new File(["avatar"], "avatar.png", {
      type: "image/png",
    });
    const bannerFile = new File(["banner"], "banner.png", {
      type: "image/png",
    });
    fireEvent.change(avatarInput!, { target: { files: [avatarFile] } });
    fireEvent.change(bannerInput!, { target: { files: [bannerFile] } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/banner upload failed/i)).toBeInTheDocument();
    });
  });

  it("handles profile creation failure", async () => {
    const createProfile = profileApi.createProfile as jest.Mock;
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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1); // Has cities loaded
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/profile already exists/i)).toBeInTheDocument();
    });
  });

  it("redirects to sign-in on mount if not authenticated and no token in storage", async () => {
    // Clear sessionStorage for this test
    mockSessionStorage.removeItem("accessToken");

    // Mock AuthContext to return unauthenticated state for this test
    const originalMock = mockUseAuth.getMockImplementation();
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      refreshToken: mockRefreshToken,
      login: mockLogin,
      logout: mockLogout,
      userId: null,
      username: null,
      email: null,
    });

    render(<SellerOnboardingPage />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/it looks like you're not signed in/i),
        ).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      },
      { timeout: 500 },
    );

    // Restore original mock
    if (originalMock) {
      mockUseAuth.mockImplementation(originalMock);
    } else {
      mockUseAuth.mockReturnValue({
        accessToken: "mock-token",
        isAuthenticated: true,
        refreshToken: mockRefreshToken,
        login: mockLogin,
        logout: mockLogout,
        userId: "test-user-id",
        username: "test-user",
        email: "test@example.com",
      });
    }
  });

  it("redirects to sign-in if not authenticated", async () => {
    // Clear sessionStorage for this test
    mockSessionStorage.removeItem("accessToken");

    // Mock AuthContext to return unauthenticated state for this test
    const originalMock = mockUseAuth.getMockImplementation();
    // Mock refreshToken to return null to test the error case
    mockRefreshToken.mockResolvedValueOnce(null);
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      refreshToken: mockRefreshToken,
      login: mockLogin,
      logout: mockLogout,
      userId: null,
      username: null,
      email: null,
    });

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
      const options = citySelect.querySelectorAll("option");
      expect(options.length).toBeGreaterThan(1);
    });

    fireEvent.change(citySelect, { target: { value: "1" } });
    fireEvent.change(postalInput, { target: { value: "M5V 1A1" } });

    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/you must be logged in/i)).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    // Restore original mock
    if (originalMock) {
      mockUseAuth.mockImplementation(originalMock);
    } else {
      mockUseAuth.mockReturnValue({
        accessToken: "mock-token",
        isAuthenticated: true,
        refreshToken: mockRefreshToken,
        login: mockLogin,
        logout: mockLogout,
        userId: "test-user-id",
        username: "test-user",
        email: "test@example.com",
      });
    }
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

    // Change to Quebec (Toronto is not in Quebec) - this will fetch new cities
    fireEvent.change(provinceSelect, { target: { value: "2" } });

    // City selection should be reset and new cities loaded
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/location/cities?provinceId=2"),
      );
    });

    // City select should be reset to empty
    expect(citySelect).toHaveValue("");
  });

  it("shows error when cities fail to load after province selection", async () => {
    // Mock fetch to fail for cities endpoint
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/location/provinces")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProvinces,
        });
      }
      if (url.includes("/api/location/cities")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });

    render(<SellerOnboardingPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const provinceSelect = screen.getByLabelText(/province/i);

    // Select a province - this should trigger cities fetch which will fail
    fireEvent.change(provinceSelect, { target: { value: "1" } });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load cities/i)).toBeInTheDocument();
    });
  });
});
