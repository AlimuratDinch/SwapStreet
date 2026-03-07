import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SellerProfileForm } from "@/components/seller/SellerProfileForm";

jest.mock("@/components/image/ImageCropModal", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="crop-modal">Crop modal</div> : null,
}));

function createMockFormProps(overrides: Record<string, unknown> = {}) {
  return {
    idPrefix: "test",
    title: "Test Profile Form",
    subtitle: "Fill in your details.",
    submitLabel: "Save",
    firstName: "",
    setFirstName: jest.fn(),
    lastName: "",
    setLastName: jest.fn(),
    bio: "",
    setBio: jest.fn(),
    fsa: "",
    setFsa: jest.fn(),
    selectedProvinceId: null as number | null,
    setSelectedProvinceId: jest.fn(),
    selectedCityId: null as number | null,
    setSelectedCityId: jest.fn(),
    cityInputValue: "",
    setCityInputValue: jest.fn(),
    cityDropdownOpen: false,
    setCityDropdownOpen: jest.fn(),
    provinces: [
      { id: 1, name: "Ontario", code: "ON" },
      { id: 2, name: "Quebec", code: "QC" },
    ],
    filteredCities: [],
    citiesFilteredByName: [],
    avatarInputRef: { current: null },
    bannerInputRef: { current: null },
    handleAvatarChange: jest.fn(),
    handleBannerChange: jest.fn(),
    closeCropModal: jest.fn(),
    handleCropConfirm: jest.fn(),
    cropTarget: null as "avatar" | "banner" | null,
    cropPreviewUrl: "",
    cropFile: null as File | null,
    error: "",
    setError: jest.fn(),
    loading: false,
    handleSubmit: jest.fn((e: React.FormEvent) => {
      e.preventDefault();
      return Promise.resolve();
    }),
    currentAvatarUrl: "/images/default-avatar-icon.jpg",
    currentBannerUrl: "/images/default-seller-banner.png",
    avatarFile: null as File | null,
    avatarPreview: "",
    bannerFile: null as File | null,
    bannerPreview: "",
    loadingData: false,
    showSuccess: false,
    ...overrides,
  };
}

describe("SellerProfileForm", () => {
  it("renders title and subtitle", () => {
    const props = createMockFormProps();
    render(<SellerProfileForm {...props} />);
    expect(screen.getByText("Test Profile Form")).toBeInTheDocument();
    expect(screen.getByText("Fill in your details.")).toBeInTheDocument();
  });

  it("renders form fields with idPrefix in ids", () => {
    const props = createMockFormProps();
    render(<SellerProfileForm {...props} />);
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute(
      "id",
      "test-first-name",
    );
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute(
      "id",
      "test-last-name",
    );
    expect(screen.getByLabelText(/FSA/i)).toHaveAttribute("id", "test-fsa");
    expect(screen.getByLabelText(/bio/i)).toHaveAttribute("id", "test-bio");
    expect(screen.getByLabelText(/province/i)).toHaveAttribute(
      "id",
      "test-province",
    );
    expect(screen.getByLabelText(/city/i)).toHaveAttribute("id", "test-city");
    expect(screen.getByLabelText(/avatar image/i)).toHaveAttribute(
      "id",
      "test-avatar",
    );
    expect(screen.getByLabelText(/banner image/i)).toHaveAttribute(
      "id",
      "test-banner",
    );
  });

  it("renders province options from provinces prop", () => {
    const props = createMockFormProps();
    render(<SellerProfileForm {...props} />);
    const select = screen.getByLabelText(/province/i);
    expect(select).toHaveTextContent("Ontario");
    expect(select).toHaveTextContent("Quebec");
  });

  it("displays error when error prop is set", () => {
    const props = createMockFormProps({ error: "Something went wrong." });
    render(<SellerProfileForm {...props} />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("shows not signed in warning when showNotSignedInWarning is true", () => {
    const props = createMockFormProps({ showNotSignedInWarning: true });
    render(<SellerProfileForm {...props} />);
    expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
  });

  it("does not show not signed in warning when showNotSignedInWarning is false", () => {
    const props = createMockFormProps({ showNotSignedInWarning: false });
    render(<SellerProfileForm {...props} />);
    expect(screen.queryByText(/not signed in/i)).not.toBeInTheDocument();
  });

  it("renders cancel button when cancelButton is provided", () => {
    const onCancel = jest.fn();
    const props = createMockFormProps({
      cancelButton: { label: "Cancel", onClick: onCancel },
    });
    render(<SellerProfileForm {...props} />);
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not render cancel button when cancelButton is not provided", () => {
    const props = createMockFormProps();
    render(<SellerProfileForm {...props} />);
    expect(
      screen.queryByRole("button", { name: /cancel/i }),
    ).not.toBeInTheDocument();
  });

  it("renders submit button with submitLabel", () => {
    const props = createMockFormProps({ submitLabel: "Create profile" });
    render(<SellerProfileForm {...props} />);
    expect(
      screen.getByRole("button", { name: /create profile/i }),
    ).toBeInTheDocument();
  });

  it("calls handleSubmit when form is submitted", () => {
    const handleSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    const props = createMockFormProps({ handleSubmit });
    render(<SellerProfileForm {...props} />);
    fireEvent.submit(
      screen.getByRole("button", { name: /save/i }).closest("form")!,
    );
    expect(handleSubmit).toHaveBeenCalled();
  });

  it("disables submit button when loading is true", () => {
    const props = createMockFormProps({
      loading: true,
      submitLabel: "Saving...",
    });
    render(<SellerProfileForm {...props} />);
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("displays current avatar and banner images", () => {
    const props = createMockFormProps({
      currentAvatarUrl: "https://example.com/avatar.jpg",
      currentBannerUrl: "https://example.com/banner.jpg",
    });
    render(<SellerProfileForm {...props} />);
    const images = screen.getAllByRole("img");
    const avatar = images.find(
      (img) => (img as HTMLImageElement).alt === "Avatar",
    );
    const banner = images.find(
      (img) => (img as HTMLImageElement).alt === "Banner",
    );
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(banner).toHaveAttribute("src", "https://example.com/banner.jpg");
  });

  it("calls setFirstName when first name input changes", () => {
    const setFirstName = jest.fn();
    const props = createMockFormProps({ setFirstName });
    render(<SellerProfileForm {...props} />);
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Jane" },
    });
    expect(setFirstName).toHaveBeenCalledWith("Jane");
  });

  it("calls setFsa with uppercased value when FSA input changes", () => {
    const setFsa = jest.fn();
    const props = createMockFormProps({ setFsa, fsa: "" });
    render(<SellerProfileForm {...props} />);
    const fsaInput = screen.getByLabelText(/FSA/i);
    fireEvent.change(fsaInput, { target: { value: "m5v" } });
    expect(setFsa).toHaveBeenCalledWith("M5V");
  });
});
