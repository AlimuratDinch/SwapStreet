import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EditSellerProfilePage from "@/app/seller/profile/edit/page";
import { logger } from "@/components/common/logger";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetMyProfile = jest.fn();
const mockUpdateProfile = jest.fn();
jest.mock("@/lib/api/profile", () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

const mockRefreshToken = jest.fn().mockResolvedValue("refreshed-token");
const mockUseAuth = jest.fn(() => ({
  accessToken: "test-token",
  refreshToken: mockRefreshToken,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockProvinces = [
  { id: 1, name: "Ontario", code: "ON" },
  { id: 2, name: "Quebec", code: "QC" },
];
const mockCities = [
  { id: 10, name: "Toronto", provinceId: 1 },
  { id: 11, name: "Ottawa", provinceId: 1 },
];

function defaultFetch(url: string | Request) {
  const u = typeof url === "string" ? url : (url as Request).url;
  if (u.includes("location/provinces")) {
    return Promise.resolve({ ok: true, json: async () => mockProvinces });
  }
  if (u.includes("location/cities")) {
    const provinceId = new URL(u, "http://localhost").searchParams.get(
      "provinceId",
    );
    const list = provinceId
      ? mockCities.filter((c) => c.provinceId === parseInt(provinceId))
      : mockCities;
    return Promise.resolve({ ok: true, json: async () => list });
  }
  return Promise.resolve({ ok: false });
}

const defaultProfile = {
  id: "user-1",
  firstName: "Jane",
  lastName: "Doe",
  bio: "Hello",
  fsa: "M5V 3A8",
  cityId: 10,
  cityName: "Toronto",
  provinceCode: "ON",
  provinceName: "Ontario",
  profileImagePath: undefined,
  bannerImagePath: undefined,
  status: "Offline",
  verifiedSeller: false,
  rating: 4,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("EditSellerProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      accessToken: "test-token",
      refreshToken: mockRefreshToken,
    });
    mockGetMyProfile.mockResolvedValue(defaultProfile);
    mockUpdateProfile.mockResolvedValue({});
    global.fetch = jest.fn(defaultFetch) as unknown as typeof fetch;
  });

  it("does not update state after unmount when getMyProfile resolves later", async () => {
    let resolveGetMyProfile: (v: typeof defaultProfile) => void;
    const profilePromise = new Promise<typeof defaultProfile>((res) => {
      resolveGetMyProfile = res;
    });
    mockGetMyProfile.mockReturnValue(profilePromise);

    const { unmount } = render(<EditSellerProfilePage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    unmount();

    resolveGetMyProfile!(defaultProfile);

    await profilePromise;

    expect(mockReplace).toHaveBeenCalledTimes(0);
  });

  it("redirects to profile when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      accessToken: null,
      refreshToken: mockRefreshToken,
    } as unknown as ReturnType<typeof mockUseAuth>);
    render(<EditSellerProfilePage />);
    expect(mockReplace).toHaveBeenCalledWith("/profile");
  });

  it("shows loading while profile is being fetched", () => {
    mockGetMyProfile.mockReturnValue(new Promise(() => {}));
    render(<EditSellerProfilePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error and Back to profile when getMyProfile fails", async () => {
    mockGetMyProfile.mockRejectedValue(new Error("Network error"));
    render(<EditSellerProfilePage />);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to profile/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to profile/i }));
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("shows generic error when getMyProfile rejects with non-Error", async () => {
    mockGetMyProfile.mockRejectedValue("string error");
    render(<EditSellerProfilePage />);

    expect(
      await screen.findByText(/failed to load profile\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to profile/i }),
    ).toBeInTheDocument();
  });

  it("calls logger.error when getMyProfile fails", async () => {
    const err = new Error("Network error");
    mockGetMyProfile.mockRejectedValue(err);
    render(<EditSellerProfilePage />);

    await screen.findByText(/network error/i);
    expect(logger.error).toHaveBeenCalledWith("Failed to load profile", err);
  });

  it("shows Loading when profile is loaded but form data (provinces) is still loading", async () => {
    mockGetMyProfile.mockResolvedValue(defaultProfile);
    const provincesNeverResolve = new Promise<never>(() => {});
    global.fetch = jest.fn((url: string | Request) => {
      const u = typeof url === "string" ? url : (url as Request).url;
      if (typeof u === "string" && u.includes("location/provinces")) {
        return provincesNeverResolve;
      }
      if (typeof u === "string" && u.includes("location/cities")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCities,
        });
      }
      return Promise.resolve({ ok: false });
    }) as unknown as typeof fetch;

    render(<EditSellerProfilePage />);

    await waitFor(() => {
      expect(mockGetMyProfile).toHaveBeenCalledWith("test-token");
    });

    await waitFor(
      () => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        expect(screen.getByTestId("header")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("redirects to profile with updated flag after successful submit", async () => {
    render(<EditSellerProfilePage />);

    await screen.findByDisplayValue("Jane");
    await waitFor(
      () => {
        expect(screen.getByLabelText(/city/i)).toHaveValue("Toronto");
      },
      { timeout: 3000 },
    );

    const form = screen
      .getByRole("button", { name: /save changes/i })
      .closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/profile?updated=true");
    });
  });

  it("loads profile and shows form when profile and provinces are loaded", async () => {
    render(<EditSellerProfilePage />);

    await waitFor(() => {
      expect(mockGetMyProfile).toHaveBeenCalledWith("test-token");
    });

    expect(await screen.findByText(/edit your profile/i)).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Jane")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("M5V 3A8")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("Cancel button navigates to profile", async () => {
    render(<EditSellerProfilePage />);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /cancel/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("submits form and calls updateProfile with form data", async () => {
    render(<EditSellerProfilePage />);

    await screen.findByDisplayValue("Jane");
    await waitFor(
      () => {
        expect(screen.getByLabelText(/city/i)).toHaveValue("Toronto");
      },
      { timeout: 3000 },
    );

    const form = screen
      .getByRole("button", { name: /save changes/i })
      .closest("form");
    fireEvent.submit(form!);

    await waitFor(
      () => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          "test-token",
          expect.objectContaining({
            firstName: "Jane",
            lastName: "Doe",
            fsa: "M5V 3A8",
            cityId: 10,
          }),
        );
      },
      { timeout: 5000 },
    );
  });

  it("shows validation error when required field is empty", async () => {
    render(<EditSellerProfilePage />);

    await screen.findByDisplayValue("Jane");

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "" },
    });
    const form = screen
      .getByRole("button", { name: /save changes/i })
      .closest("form");
    fireEvent.submit(form!);

    expect(
      await screen.findByText(/please enter your first name/i),
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });
});
