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
      return React.createElement("div", { "data-testid": "mock-cropper" }, "Crop");
    },
  };
});

if (typeof HTMLCanvasElement !== "undefined" && !HTMLCanvasElement.prototype.toBlob) {
  HTMLCanvasElement.prototype.toBlob = function (
    callback: (blob: Blob | null) => void,
    type?: string,
  ) {
    callback(new Blob(["mock"], { type: type || "image/png" }));
  };
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

global.fetch = jest.fn((url) => {
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
  return Promise.resolve({ ok: false, json: async () => ({ error: "Not found" }) });
}) as jest.Mock;

async function selectCity(cityName: string = "Toronto") {
  const cityInput = screen.getByLabelText(/city/i);
  fireEvent.focus(cityInput);
  await waitFor(() => {
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
  });
  fireEvent.mouseDown(screen.getByRole("option", { name: cityName }));
}

describe("SellerOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshToken.mockResolvedValue("new-token");
    mockSessionStorage.clear();
    mockSessionStorage.setItem("accessToken", "mock-token");
    (profileApi.createProfile as jest.Mock).mockResolvedValue({ id: "test-id" });
    (profileApi.uploadImage as jest.Mock).mockResolvedValue("https://example.com/image.jpg");
    (global.fetch as jest.Mock).mockImplementation((url: string | Request) => {
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
      return Promise.resolve({ ok: false, json: async () => ({ error: "Not found" }) });
    });
  });

  it("renders the form", async () => {
    render(<SellerOnboardingPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/set up your seller profile/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save and continue/i })).toBeInTheDocument();
  });

  it("submits with valid data and redirects to profile", async () => {
    const createProfile = profileApi.createProfile as jest.Mock;
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
    fireEvent.change(screen.getByLabelText(/province/i), { target: { value: "1" } });

    const cityInput = screen.getByLabelText(/city/i);
    await waitFor(() => expect(cityInput).not.toBeDisabled());
    await selectCity();

    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "M5V 1A1" },
    });

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
    fireEvent.change(screen.getByLabelText(/province/i), { target: { value: "1" } });

    const cityInput = screen.getByLabelText(/city/i);
    await waitFor(() => expect(cityInput).not.toBeDisabled());
    await selectCity();
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "INVALID" },
    });

    const form = screen.getByRole("button", { name: /save and continue/i }).closest("form");
    fireEvent.submit(form!);

    const err = await screen.findByText(/valid canadian postal code/i);
    expect(err).toBeInTheDocument();
  });
});
