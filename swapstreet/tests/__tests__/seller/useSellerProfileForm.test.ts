import { renderHook, act, waitFor } from "@testing-library/react";
import { useSellerProfileForm } from "@/components/seller/useSellerProfileForm";

jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/api/profile", () => ({
  uploadImage: jest.fn().mockResolvedValue("uploaded/path.jpg"),
}));

const mockProvinces = [
  { id: 1, name: "Ontario", code: "ON" },
  { id: 2, name: "Quebec", code: "QC" },
];
const mockCities = [
  { id: 10, name: "Toronto", provinceId: 1 },
  { id: 11, name: "Ottawa", provinceId: 1 },
];

function mockFetch(url: string | Request) {
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

const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
const mockOnSuccess = jest.fn();

const defaultOptions = {
  mode: "create" as const,
  accessToken: "test-token",
  refreshToken: jest.fn().mockResolvedValue("refreshed-token"),
  onSubmit: mockOnSubmit,
  onSuccess: mockOnSuccess,
};

describe("useSellerProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(mockFetch) as jest.Mock;
  });

  it("starts with loadingData true and fetches provinces on mount", async () => {
    const { result } = renderHook(() => useSellerProfileForm(defaultOptions));

    expect(result.current.loadingData).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("location/provinces"),
    );
    expect(result.current.provinces).toEqual(mockProvinces);
  });

  it("in edit mode syncs initialValues into form state once", async () => {
    const initialValues = {
      firstName: "Jane",
      lastName: "Doe",
      bio: "Hello",
      fsa: "M5V",
      cityId: 10,
      cityName: "Toronto",
      provinceCode: "ON",
      profileImagePath: undefined,
      bannerImagePath: undefined,
    };

    const { result, rerender } = renderHook(
      (opts) => useSellerProfileForm({ ...defaultOptions, ...opts }),
      {
        initialProps: {
          mode: "edit" as const,
          initialValues,
          accessToken: "token",
          refreshToken: defaultOptions.refreshToken,
          onSubmit: mockOnSubmit,
          onSuccess: mockOnSuccess,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    expect(result.current.firstName).toBe("Jane");
    expect(result.current.lastName).toBe("Doe");
    expect(result.current.bio).toBe("Hello");
    expect(result.current.fsa).toBe("M5V");

    act(() => {
      result.current.setFirstName("Janet");
      result.current.setLastName("D.");
    });

    expect(result.current.firstName).toBe("Janet");
    expect(result.current.lastName).toBe("D.");

    rerender({
      mode: "edit" as const,
      initialValues: { ...initialValues, firstName: "Other" },
      accessToken: "token",
      refreshToken: defaultOptions.refreshToken,
      onSubmit: mockOnSubmit,
      onSuccess: mockOnSuccess,
    });

    await waitFor(() => {});

    expect(result.current.firstName).toBe("Janet");
    expect(result.current.lastName).toBe("D.");
  });

  it("sets error when provinces fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useSellerProfileForm(defaultOptions));

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    expect(result.current.error).toContain("Failed to load location");
  });

  it("sets error when provinces response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useSellerProfileForm(defaultOptions));

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    expect(result.current.provinces).toEqual([]);
  });

  it("handleSubmit sets validation error when first name is empty", async () => {
    const { result } = renderHook(() => useSellerProfileForm(defaultOptions));

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    act(() => {
      result.current.setLastName("Doe");
      result.current.setSelectedProvinceId(1);
      result.current.setSelectedCityId(10);
      result.current.setCityInputValue("Toronto");
      result.current.setFsa("M5V");
    });

    await act(async () => {
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.error).toContain("first name");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("handleSubmit sets validation error when FSA is invalid", async () => {
    const { result } = renderHook(() => useSellerProfileForm(defaultOptions));

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    act(() => {
      result.current.setFirstName("Jane");
      result.current.setLastName("Doe");
      result.current.setFsa("XX");
      result.current.setSelectedProvinceId(1);
    });

    await waitFor(() => {
      expect(result.current.filteredCities.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setSelectedCityId(10);
      result.current.setCityInputValue("Toronto");
    });

    await act(async () => {
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.error).toMatch(/valid FSA|FSA/);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("handleSubmit calls onSubmit with payload and token when valid", async () => {
    const { result } = renderHook(() => useSellerProfileForm(defaultOptions));

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    act(() => {
      result.current.setFirstName("Jane");
      result.current.setLastName("Doe");
      result.current.setBio("Seller");
      result.current.setFsa("M5V");
      result.current.setSelectedProvinceId(1);
    });

    await waitFor(() => {
      expect(result.current.filteredCities.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setSelectedCityId(10);
      result.current.setCityInputValue("Toronto");
    });

    await act(async () => {
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Jane",
          lastName: "Doe",
          bio: "Seller",
          cityId: 10,
          fsa: "M5V",
        }),
        "test-token",
      );
    });
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(result.current.showSuccess).toBe(true);
  });

  it("in edit mode uses initialValues image paths when no new file", async () => {
    const initialValues = {
      firstName: "A",
      lastName: "B",
      fsa: "M5V",
      cityId: 10,
      cityName: "Toronto",
      provinceCode: "ON",
      profileImagePath: "existing/avatar.jpg",
      bannerImagePath: "existing/banner.jpg",
    };

    const { result } = renderHook(() =>
      useSellerProfileForm({
        ...defaultOptions,
        mode: "edit",
        initialValues,
      }),
    );

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.filteredCities.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setSelectedCityId(10);
      result.current.setCityInputValue("Toronto");
    });

    await act(async () => {
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          profileImagePath: "existing/avatar.jpg",
          bannerImagePath: "existing/banner.jpg",
        }),
        expect.any(String),
      );
    });
  });
});
