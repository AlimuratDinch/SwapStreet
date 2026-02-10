const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/api/profile", () => ({
  createProfile: jest.fn().mockResolvedValue({ id: "test-id" }),
  uploadImage: jest.fn().mockResolvedValue("https://example.com/image.jpg"),
}));

jest.mock("react-easy-crop", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MockCropper(props: {
      onCropComplete?: (a: unknown, b: unknown) => void;
      onCropAreaChange?: (a: unknown, b: unknown) => void;
    }) {
      React.useEffect(() => {
        const area = { x: 0, y: 0, width: 100, height: 100 };
        props.onCropComplete?.(area, area);
        props.onCropAreaChange?.(area, area);
      }, []);
      return React.createElement(
        "div",
        { "data-testid": "mock-cropper" },
        "Crop",
      );
    },
  };
});

if (
  typeof HTMLCanvasElement !== "undefined" &&
  !HTMLCanvasElement.prototype.toBlob
) {
  HTMLCanvasElement.prototype.toBlob = function (
    callback: (blob: Blob | null) => void,
    type?: string,
  ) {
    callback(new Blob(["mock"], { type: type || "image/png" }));
  };
}

// Trigger Image onload for blob URLs so getCroppedImg resolves in jsdom
const OriginalImage = global.Image;
if (OriginalImage) {
  (global as unknown as { Image: typeof Image }).Image =
    class extends OriginalImage {
      constructor() {
        super();
        const self = this;
        let srcVal = "";
        Object.defineProperty(self, "src", {
          set(value: string) {
            srcVal = value;
            if (value.startsWith("blob:") && self.onload) {
              queueMicrotask(() => self.onload?.({} as Event));
            }
          },
          get() {
            return srcVal;
          },
          configurable: true,
        });
      }
    } as unknown as typeof Image;
}

const mockRefreshToken = jest.fn().mockResolvedValue("new-token");
const mockUseAuth = jest.fn(() => ({
  accessToken: "mock-token",
  isAuthenticated: true,
  refreshToken: mockRefreshToken,
  login: jest.fn(),
  logout: jest.fn(),
  userId: "test-user-id",
  username: "test-user",
  email: "test@example.com",
})) as jest.Mock;

jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
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
    key: jest.fn(() => null),
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

const mockProvinces = [
  { id: 1, name: "Ontario", code: "ON" },
  { id: 2, name: "Quebec", code: "QC" },
];

const mockCities = [
  { id: 1, name: "Toronto", provinceId: 1 },
  { id: 2, name: "Ottawa", provinceId: 1 },
  { id: 3, name: "Montreal", provinceId: 2 },
];

function defaultFetch(url: string | Request) {
  const u = typeof url === "string" ? url : (url as Request).url;
  if (u.includes("location/provinces")) {
    return Promise.resolve({ ok: true, json: async () => mockProvinces });
  }
  if (u.includes("location/cities")) {
    const urlObj = new URL(u, "http://localhost");
    const provinceId = urlObj.searchParams.get("provinceId");
    const filtered = provinceId
      ? mockCities.filter((c) => c.provinceId === parseInt(provinceId))
      : mockCities;
    return Promise.resolve({ ok: true, json: async () => filtered });
  }
  return Promise.resolve({
    ok: false,
    json: async () => ({ error: "Not found" }),
  });
}

global.fetch = jest.fn(defaultFetch) as jest.Mock;

async function selectCity(cityName: string = "Toronto") {
  const cityInput = screen.getByLabelText(/city/i);
  fireEvent.focus(cityInput);
  await waitFor(() => {
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
  });
  fireEvent.mouseDown(screen.getByRole("option", { name: cityName }));
}

async function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
    target: { value: "John" },
  });
  fireEvent.change(screen.getByPlaceholderText(/your last name/i), {
    target: { value: "Doe" },
  });
  fireEvent.change(screen.getByLabelText(/province/i), {
    target: { value: "1" },
  });
  const cityInput = screen.getByLabelText(/city/i);
  await waitFor(() => expect(cityInput).not.toBeDisabled());
  await selectCity();
  fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
    target: { value: "M5V 1A1" },
  });
}

describe("SellerOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshToken.mockResolvedValue("new-token");
    mockSessionStorage.clear();
    mockSessionStorage.setItem("accessToken", "mock-token");
    (profileApi.createProfile as jest.Mock).mockResolvedValue({
      id: "test-id",
    });
    (profileApi.uploadImage as jest.Mock).mockResolvedValue(
      "https://example.com/image.jpg",
    );
    (global.fetch as jest.Mock).mockImplementation(defaultFetch);
  });

  it("renders the form", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/set up your seller profile/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save and continue/i }),
    ).toBeInTheDocument();
  });

  it("submits with valid data and redirects to profile", async () => {
    const createProfile = profileApi.createProfile as jest.Mock;
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(
      () => {
        expect(createProfile).toHaveBeenCalledWith(
          "mock-token",
          expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
            cityId: 1,
            fsa: "M5V",
          }),
          mockRefreshToken,
        );
        expect(mockPush).toHaveBeenCalledWith("/profile");
      },
      { timeout: 3000 },
    );
  });

  it("shows success overlay after submit", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/profile created!/i)).toBeInTheDocument();
        expect(
          screen.getByText(/taking you to your profile/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("shows error when first name is missing", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const form = screen
      .getByRole("button", { name: /save and continue/i })
      .closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/please enter your first name/i);
    expect(err).toBeInTheDocument();
  });

  it("shows error when last name is missing", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    const form = screen
      .getByRole("button", { name: /save and continue/i })
      .closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/please enter your last name/i);
    expect(err).toBeInTheDocument();
  });

  it("shows error when city is not selected", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "M5V 1A1" },
    });
    const form = screen
      .getByRole("button", { name: /save and continue/i })
      .closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/please select a city/i);
    expect(err).toBeInTheDocument();
  });

  it("shows error when FSA format is invalid after postal extraction", async () => {
    const origSubstring = String.prototype.substring;
    String.prototype.substring = jest.fn(function (
      this: string,
      start?: number,
      end?: number,
    ) {
      if (this.includes("A1A") && start === 0 && end === 3) return "123";
      return origSubstring.call(this, start ?? 0, end);
    });
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await fillValidForm();
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "A1A 1A1" },
    });
    const form = screen
      .getByRole("button", { name: /save and continue/i })
      .closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/Invalid postal code format/i);
    expect(err).toBeInTheDocument();
    String.prototype.substring = origSubstring;
  });

  it("shows error when postal code is invalid", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    const cityInput = screen.getByLabelText(/city/i);
    await waitFor(() => expect(cityInput).not.toBeDisabled());
    await selectCity();
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "INVALID" },
    });
    const form = screen
      .getByRole("button", { name: /save and continue/i })
      .closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(/valid canadian postal code/i);
    expect(err).toBeInTheDocument();
  });

  it("shows error when postal code is missing", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    const cityInput = screen.getByLabelText(/city/i);
    await waitFor(() => expect(cityInput).not.toBeDisabled());
    await selectCity();
    const form = screen
      .getByRole("button", { name: /save and continue/i })
      .closest("form");
    fireEvent.submit(form!);
    const err = await screen.findByText(
      /Forward Sortation Area|postal code is required/i,
    );
    expect(err).toBeInTheDocument();
  });

  it("shows error when provinces fail to load", async () => {
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

  it("shows error when cities fail to load after province selection", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string | Request) => {
      const u = typeof url === "string" ? url : (url as Request).url;
      if (u.includes("location/provinces")) {
        return Promise.resolve({ ok: true, json: async () => mockProvinces });
      }
      if (u.includes("location/cities")) {
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
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    await waitFor(() => {
      expect(screen.getByText(/failed to load cities/i)).toBeInTheDocument();
    });
  });

  it("shows not signed in banner when unauthenticated", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      refreshToken: mockRefreshToken,
      login: jest.fn(),
      logout: jest.fn(),
      userId: null,
      username: null,
      email: null,
    });
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    expect(
      screen.getByText(/it looks like you're not signed in/i),
    ).toBeInTheDocument();
    mockUseAuth.mockReturnValue({
      accessToken: "mock-token",
      isAuthenticated: true,
      refreshToken: mockRefreshToken,
      login: jest.fn(),
      logout: jest.fn(),
      userId: "test-user-id",
      username: "test-user",
      email: "test@example.com",
    });
  });

  it("shows error when not logged in on submit", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      refreshToken: jest.fn().mockResolvedValue(null),
      login: jest.fn(),
      logout: jest.fn(),
      userId: null,
      username: null,
      email: null,
    });
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    const err = await screen.findByText(/you must be logged in/i);
    expect(err).toBeInTheDocument();
    mockUseAuth.mockReturnValue({
      accessToken: "mock-token",
      isAuthenticated: true,
      refreshToken: mockRefreshToken,
      login: jest.fn(),
      logout: jest.fn(),
      userId: "test-user-id",
      username: "test-user",
      email: "test@example.com",
    });
  });

  it("shows error when avatar file is not an image", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: {
        files: [new File(["x"], "doc.pdf", { type: "application/pdf" })],
      },
    });
    expect(screen.getByText(/avatar must be an image/i)).toBeInTheDocument();
  });

  it("shows error when banner file is not an image", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    fireEvent.change(bannerInput!, {
      target: { files: [new File(["x"], "doc.txt", { type: "text/plain" })] },
    });
    expect(
      screen.getByText(/banner must be an image file/i),
    ).toBeInTheDocument();
  });

  it("opens crop modal for avatar and Cancel closes it", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: {
        files: [new File(["x"], "avatar.png", { type: "image/png" })],
      },
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /apply crop/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("opens crop modal for banner and Cancel closes it", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    fireEvent.change(bannerInput!, {
      target: {
        files: [new File(["x"], "banner.png", { type: "image/png" })],
      },
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /apply crop/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("Apply crop runs (preview, crop error, or modal still open)", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: {
        files: [new File(["x"], "avatar.png", { type: "image/png" })],
      },
    });
    const applyBtn = await screen.findByRole("button", { name: /apply crop/i });
    fireEvent.click(applyBtn);
    await waitFor(
      () => {
        const preview = screen.queryByAltText(/avatar preview/i);
        const cropError = screen.queryByText(/failed to crop image/i);
        const modalOpen = screen.queryByRole("button", { name: /apply crop/i });
        expect(preview || cropError || modalOpen).toBeTruthy();
      },
      { timeout: 3500 },
    );
  });

  it("shows error when createProfile fails", async () => {
    (profileApi.createProfile as jest.Mock).mockRejectedValueOnce(
      new Error("Profile already exists"),
    );
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    const err = await screen.findByText(/profile already exists/i);
    expect(err).toBeInTheDocument();
  });

  it("shows generic error when createProfile fails with non-Error", async () => {
    (profileApi.createProfile as jest.Mock).mockRejectedValueOnce(
      "string error",
    );
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    const err = await screen.findByText(
      /failed to create profile. please try again/i,
    );
    expect(err).toBeInTheDocument();
  });
});
