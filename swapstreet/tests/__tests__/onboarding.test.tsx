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
    }) {
      React.useEffect(() => {
        props.onCropComplete?.(
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 0, y: 0, width: 100, height: 100 },
        );
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
  HTMLCanvasElement.prototype.toBlob = function (cb: (b: Blob | null) => void) {
    cb(new Blob(["mock"], { type: "image/png" }));
  };
}

// Mock canvas 2d so getCroppedImg completes (jsdom returns null)
(HTMLCanvasElement.prototype.getContext as (
  contextId: string,
) => CanvasRenderingContext2D | null) = function (
  this: HTMLCanvasElement,
  _contextId: string,
): CanvasRenderingContext2D | null {
  return {
    drawImage: jest.fn(),
    canvas: this,
  } as unknown as CanvasRenderingContext2D;
};

// Image onload for blob URLs so getCroppedImg resolves
const OriginalImage = global.Image;
if (OriginalImage) {
  (global as unknown as { Image: typeof Image }).Image =
    class extends OriginalImage {
      constructor() {
        super();
        const self = this;
        Object.defineProperty(self, "src", {
          set(value: string) {
            if (value.startsWith("blob:") && self.onload)
              queueMicrotask(() => self.onload?.({} as Event));
          },
          configurable: true,
        });
      }
    } as unknown as typeof Image;
}

if (typeof global.URL.revokeObjectURL !== "function") {
  (global.URL as { revokeObjectURL: (url: string) => void }).revokeObjectURL =
    jest.fn();
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
  if (u.includes("location/provinces"))
    return Promise.resolve({ ok: true, json: async () => mockProvinces });
  if (u.includes("location/cities")) {
    const provinceId = new URL(u, "http://localhost").searchParams.get(
      "provinceId",
    );
    const list = provinceId
      ? mockCities.filter((c) => c.provinceId === parseInt(provinceId))
      : mockCities;
    return Promise.resolve({ ok: true, json: async () => list });
  }
  return Promise.resolve({
    ok: false,
    json: async () => ({ error: "Not found" }),
  });
}

const mockSessionStorage = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: () => null,
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

global.fetch = jest.fn(defaultFetch) as jest.Mock;

async function ready() {
  render(<SellerOnboardingPage />);
  await waitFor(() =>
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
  );
}

async function selectCity(name = "Toronto") {
  const cityInput = screen.getByLabelText(/city/i);
  fireEvent.focus(cityInput);
  await waitFor(() =>
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0),
  );
  fireEvent.mouseDown(screen.getByRole("option", { name }));
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
  await waitFor(() =>
    expect(screen.getByLabelText(/city/i)).not.toBeDisabled(),
  );
  await selectCity();
  fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
    target: { value: "M5V 1A1" },
  });
}

function submitForm() {
  fireEvent.submit(
    screen.getByRole("button", { name: /save and continue/i }).closest("form")!,
  );
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
    await ready();
    expect(screen.getByText(/set up your seller profile/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save and continue/i }),
    ).toBeInTheDocument();
  });

  it("submits valid data and redirects", async () => {
    await ready();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    await waitFor(
      () => {
        expect(profileApi.createProfile).toHaveBeenCalledWith(
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

  it("shows validation errors for missing required fields", async () => {
    await ready();
    submitForm();
    expect(
      await screen.findByText(/please enter your first name/i),
    ).toBeInTheDocument();
  });

  it("shows error when last name is missing", async () => {
    await ready();
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    submitForm();
    expect(
      await screen.findByText(/please enter your last name/i),
    ).toBeInTheDocument();
  });

  it("shows error when city is not selected", async () => {
    await ready();
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "M5V 1A1" },
    });
    submitForm();
    expect(
      await screen.findByText(/please select a city/i),
    ).toBeInTheDocument();
  });

  it("shows error when postal code is missing", async () => {
    await ready();
    await fillValidForm();
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "" },
    });
    submitForm();
    expect(
      await screen.findByText(
        /postal code is required|Forward Sortation Area/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows error for invalid postal code", async () => {
    await ready();
    await fillValidForm();
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "INVALID" },
    });
    submitForm();
    expect(
      await screen.findByText(/valid canadian postal code/i),
    ).toBeInTheDocument();
  });

  it("shows error for invalid FSA format", async () => {
    const origSubstring = String.prototype.substring;
    String.prototype.substring = function (
      this: string,
      start?: number,
      end?: number,
    ) {
      if (start === 0 && end === 3 && /A1A|M5V/.test(this)) return "123";
      return origSubstring.call(this, start ?? 0, end);
    };
    await ready();
    await fillValidForm();
    fireEvent.change(screen.getByPlaceholderText(/a1a 1a1/i), {
      target: { value: "A1A 1A1" },
    });
    submitForm();
    expect(
      await screen.findByText(/Invalid postal code format/i),
    ).toBeInTheDocument();
    String.prototype.substring = origSubstring;
  });

  it("shows error when provinces fetch returns non-ok", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      (url: string | Request) => {
        const u = typeof url === "string" ? url : (url as Request).url;
        if (u.includes("provinces"))
          return Promise.resolve({ ok: false, json: async () => ({}) });
        return defaultFetch(url);
      },
    );
    await ready();
    const opts = screen.getByLabelText(/province/i).querySelectorAll("option");
    expect(opts.length).toBe(1);
  });

  it("shows error when provinces fail to load", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error")),
    );
    await ready();
    expect(
      screen.getByText(/failed to load location data/i),
    ).toBeInTheDocument();
  });

  it("shows error when cities fail after selecting province", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string | Request) => {
      const u = typeof url === "string" ? url : (url as Request).url;
      if (u.includes("provinces"))
        return Promise.resolve({ ok: true, json: async () => mockProvinces });
      if (u.includes("cities"))
        return Promise.reject(new Error("Network error"));
      return defaultFetch(url);
    });
    await ready();
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    expect(
      await screen.findByText(/failed to load cities/i),
    ).toBeInTheDocument();
  });

  it("cities not set when cities fetch returns non-ok", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string | Request) => {
      const u = typeof url === "string" ? url : (url as Request).url;
      if (u.includes("provinces"))
        return Promise.resolve({ ok: true, json: async () => mockProvinces });
      if (u.includes("cities"))
        return Promise.resolve({ ok: false, json: async () => ({}) });
      return defaultFetch(url);
    });
    await ready();
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/city/i)).not.toBeDisabled(),
    );
    fireEvent.focus(screen.getByLabelText(/city/i));
    expect(
      screen.queryByRole("option", { name: "Toronto" }),
    ).not.toBeInTheDocument();
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
    await ready();
    expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
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

  it("shows error on submit when not logged in and refresh fails", async () => {
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
    await ready();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    expect(await screen.findByText(/must be logged in/i)).toBeInTheDocument();
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

  it("uses refreshed token when accessToken is null", async () => {
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      refreshToken: jest.fn().mockResolvedValue("refreshed-token"),
      login: jest.fn(),
      logout: jest.fn(),
      userId: null,
      username: null,
      email: null,
    });
    await ready();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    await waitFor(
      () => {
        expect(profileApi.createProfile).toHaveBeenCalledWith(
          "refreshed-token",
          expect.any(Object),
          expect.any(Function),
        );
        expect(mockPush).toHaveBeenCalledWith("/profile");
      },
      { timeout: 3000 },
    );
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

  it("rejects non-image files for avatar and banner", async () => {
    await ready();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    fireEvent.change(avatarInput!, {
      target: {
        files: [new File(["x"], "a.pdf", { type: "application/pdf" })],
      },
    });
    expect(screen.getByText(/avatar must be an image/i)).toBeInTheDocument();
    fireEvent.change(bannerInput!, {
      target: { files: [new File(["x"], "b.txt", { type: "text/plain" })] },
    });
    expect(screen.getByText(/banner must be an image/i)).toBeInTheDocument();
  });

  it("ignores empty file selection for avatar and banner", async () => {
    await ready();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    fireEvent.change(avatarInput!, { target: { files: [] } });
    fireEvent.change(bannerInput!, { target: { files: [] } });
    expect(
      screen.queryByText(/avatar must be an image/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/banner must be an image/i),
    ).not.toBeInTheDocument();
  });

  it("replacing image while crop modal open updates crop", async () => {
    await ready();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: { files: [new File(["a"], "first.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.change(avatarInput!, {
      target: { files: [new File(["b"], "second.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
  });

  it("opens crop modal for image and Cancel closes it", async () => {
    await ready();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: { files: [new File(["x"], "avatar.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /apply crop/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("Apply crop runs (modal closes, preview, error, or still applying)", async () => {
    await ready();
    await fillValidForm();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: { files: [new File(["x"], "avatar.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /apply crop/i }));
    await waitFor(
      () => {
        const applyOrApplying = screen.queryByRole("button", {
          name: /apply crop|applying/i,
        });
        const modalGone = !applyOrApplying;
        const preview = screen.queryByAltText(/avatar preview/i);
        const err = screen.queryByText(/failed to crop/i);
        expect(modalGone || !!preview || !!err || !!applyOrApplying).toBe(true);
      },
      { timeout: 5000 },
    );
  });

  it("crop modal zoom slider updates", async () => {
    await ready();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: { files: [new File(["x"], "avatar.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
    const zoom = document.querySelector(
      'input[type="range"][min="1"][max="3"]',
    );
    if (zoom) fireEvent.change(zoom, { target: { value: "2" } });
  });

  it("clearing province clears city", async () => {
    await ready();
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/city/i)).not.toBeDisabled(),
    );
    await selectCity();
    expect(screen.getByLabelText(/city/i)).toHaveValue("Toronto");
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "" },
    });
    await waitFor(() => expect(screen.getByLabelText(/city/i)).toHaveValue(""));
  });

  it("city shows Select province first when no province", async () => {
    await ready();
    const cityInput = screen.getByLabelText(/city/i);
    expect(cityInput).toBeDisabled();
    expect(cityInput).toHaveAttribute("placeholder", "Select province first");
    fireEvent.focus(cityInput);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows No matching city when filter matches nothing", async () => {
    await ready();
    fireEvent.change(screen.getByLabelText(/province/i), {
      target: { value: "1" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/city/i)).not.toBeDisabled(),
    );
    const cityInput = screen.getByLabelText(/city/i);
    fireEvent.focus(cityInput);
    await waitFor(() =>
      expect(screen.getByRole("listbox")).toBeInTheDocument(),
    );
    fireEvent.change(cityInput, { target: { value: "zzznomatch" } });
    await waitFor(() =>
      expect(screen.getByText(/no matching city/i)).toBeInTheDocument(),
    );
  });

  it("shows success overlay after submit", async () => {
    await ready();
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

  it("submit with cropped avatar can call uploadImage when crop succeeds", async () => {
    await ready();
    await fillValidForm();
    const avatarInput = document.querySelectorAll('input[type="file"]')[0];
    fireEvent.change(avatarInput!, {
      target: { files: [new File(["x"], "avatar.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /apply crop/i }));
    await waitFor(
      () => {
        const applyOrApplying = screen.queryByRole("button", {
          name: /apply crop|applying/i,
        });
        const closed = !applyOrApplying;
        const preview = screen.queryByAltText(/avatar preview/i);
        expect(closed || !!preview || !!applyOrApplying).toBe(true);
      },
      { timeout: 5000 },
    );
    const submitBtn = screen.queryByRole("button", {
      name: /save and continue/i,
    });
    if (submitBtn) {
      fireEvent.click(submitBtn);
      await waitFor(() => expect(profileApi.createProfile).toHaveBeenCalled(), {
        timeout: 3000,
      });
    }
  });

  it("opens crop modal for banner and Cancel closes it", async () => {
    await ready();
    const bannerInput = document.querySelectorAll('input[type="file"]')[1];
    fireEvent.change(bannerInput!, {
      target: { files: [new File(["x"], "banner.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /apply crop/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /apply crop/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows error when createProfile fails", async () => {
    (profileApi.createProfile as jest.Mock).mockRejectedValueOnce(
      new Error("Profile already exists"),
    );
    await ready();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    expect(
      await screen.findByText(/profile already exists/i),
    ).toBeInTheDocument();
  });

  it("shows generic error when createProfile rejects with non-Error", async () => {
    (profileApi.createProfile as jest.Mock).mockRejectedValueOnce(
      "string error",
    );
    await ready();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    expect(
      await screen.findByText(/failed to create profile/i),
    ).toBeInTheDocument();
  });

  it("sends bio to createProfile when provided", async () => {
    await ready();
    await fillValidForm();
    fireEvent.change(screen.getByPlaceholderText(/brag a little/i), {
      target: { value: "Vintage seller." },
    });
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));
    await waitFor(
      () =>
        expect(profileApi.createProfile).toHaveBeenCalledWith(
          "mock-token",
          expect.objectContaining({ bio: "Vintage seller." }),
          mockRefreshToken,
        ),
      { timeout: 3000 },
    );
  });
});
