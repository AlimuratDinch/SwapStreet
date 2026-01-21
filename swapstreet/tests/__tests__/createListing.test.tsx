import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";

// Mock AuthContext
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ accessToken: "test-token" }),
}));

import SellerListingPage from "@/app/seller/createListing/page";

// Mock fetch for profile API
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    if (typeof url === "string" && url.includes("/api/profile/me")) {
      return Promise.resolve(({
        ok: true,
        json: () => Promise.resolve({ id: "test-profile-id", fsa: "A1A" }),
      } as unknown) as Response);
    }
    // Default mock for other fetches
    return Promise.resolve(({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve("")
    } as unknown) as Response);
  }) as unknown as jest.Mock;
});

afterAll(() => {
  jest.resetAllMocks();
});

const mockPush = jest.fn();
const mockBack = jest.fn();

// mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("SellerListingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  const getForm = () =>
    screen.getByRole("button", { name: /Create Listing/i }).closest("form")!;
  const submitForm = () => fireEvent.submit(getForm());
  const createFile = (name = "test.png") =>
    new File(["img"], name, { type: "image/png" });

  // ----------------------------
  // Rendering tests
  // ----------------------------
  describe("Rendering", () => {
    it("renders all form fields", async () => {
      render(<SellerListingPage />);
      await waitFor(() => {
        [
          "Title",
          "Description",
          "Price",
          "Images",
        ].forEach((field) => {
          expect(
            screen.getByLabelText(new RegExp(`^${field}`, "i")),
          ).toBeInTheDocument();
        });
      });
    });

    it("renders page heading and description", () => {
      render(<SellerListingPage />);
      expect(screen.getByText(/Create a new listing/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Add a new item to your product catalog/i),
      ).toBeInTheDocument();
    });


    it("renders submit and cancel buttons", async () => {
      render(<SellerListingPage />);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Create Listing/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Cancel/i }),
        ).toBeInTheDocument();
      });
    });
  });

  // ----------------------------
  // Form input handling tests
  // ----------------------------
  describe("Form Input Handling", () => {
    it.each([
      ["title", "Test Title"],
      ["description", "Test Description"],
    ])("updates %s input", async (field, value) => {
      render(<SellerListingPage />);
      const input = await screen.findByLabelText(new RegExp(`^${field}`, "i"));
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
    });

    it("updates price input with valid number", async () => {
      render(<SellerListingPage />);
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "29.99" } });
      expect(priceInput).toHaveValue(29.99);
    });

    it("handles empty price input", async () => {
      render(<SellerListingPage />);
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "" } });
      expect(priceInput).toHaveValue(null);
    });
  });


  // ----------------------------
  // Image handling
  // ----------------------------
  describe("Image Handling", () => {
    it("displays image preview after upload", async () => {
      render(<SellerListingPage />);
      const imagesInput = await screen.findByLabelText(/^Images/i);
      const file = createFile();
      fireEvent.change(imagesInput, { target: { files: [file] } });
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument(),
      );
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it("allows multiple images up to 5", async () => {
      render(<SellerListingPage />);
      const imagesInput = await screen.findByLabelText(/^Images/i);
      const files = Array.from({ length: 3 }, (_, i) =>
        createFile(`test${i}.png`),
      );
      fireEvent.change(imagesInput, { target: { files } });
      await waitFor(() => {
        ["Preview 1", "Preview 2", "Preview 3"].forEach((alt) => {
          expect(screen.getByAltText(alt)).toBeInTheDocument();
        });
      });
    });

    it("allows exactly 5 images", async () => {
      render(<SellerListingPage />);
      const imagesInput = await screen.findByLabelText(/^Images/i);
      const files = Array.from({ length: 5 }, (_, i) =>
        createFile(`test${i}.png`),
      );
      fireEvent.change(imagesInput, { target: { files } });
      await waitFor(() => {
        [
          "Preview 1",
          "Preview 2",
          "Preview 3",
          "Preview 4",
          "Preview 5",
        ].forEach((alt) => {
          expect(screen.getByAltText(alt)).toBeInTheDocument();
        });
      });
    });

    it("removes image when delete button clicked", async () => {
      render(<SellerListingPage />);
      const imagesInput = await screen.findByLabelText(/^Images/i);
      fireEvent.change(imagesInput, { target: { files: [createFile()] } });
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole("button", { name: "×" }));
      await waitFor(() =>
        expect(screen.queryByAltText("Preview 1")).not.toBeInTheDocument(),
      );
    });
  });

  // ----------------------------
  // Form submission and validation
  // ----------------------------
  describe("Form Submission", () => {
    const fillValidForm = async () => {
      const titleInput = await screen.findByLabelText(/^Title/i);
      fireEvent.change(titleInput, { target: { value: "Test Product" } });
      const descInput = await screen.findByLabelText(/^Description/i);
      fireEvent.change(descInput, { target: { value: "Test Description" } });
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "29.99" } });
      const imagesInput = await screen.findByLabelText(/^Images/i);
      fireEvent.change(imagesInput, { target: { files: [createFile()] } });
    };

    it("submits form successfully with valid data", async () => {
      render(<SellerListingPage />);
      await fillValidForm();
      submitForm();
      await waitFor(() => expect(mockPush).toHaveBeenCalled());
    });


    it("shows error when title is missing", async () => {
      render(<SellerListingPage />);
      const descInput = await screen.findByLabelText(/^Description/i);
      fireEvent.change(descInput, { target: { value: "Test Description" } });
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "29.99" } });
      const imagesInput = await screen.findByLabelText(/^Images/i);
      fireEvent.change(imagesInput, { target: { files: [createFile()] } });
      submitForm();
      await waitFor(() => {
        expect(screen.getByText(/Please enter a title/i)).toBeInTheDocument();
      });
    });

    it("shows error when description is missing", async () => {
      render(<SellerListingPage />);
      const titleInput = await screen.findByLabelText(/^Title/i);
      fireEvent.change(titleInput, { target: { value: "Test Product" } });
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "29.99" } });
      const imagesInput = await screen.findByLabelText(/^Images/i);
      fireEvent.change(imagesInput, { target: { files: [createFile()] } });
      submitForm();
      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a description/i),
        ).toBeInTheDocument();
      });
    });

    it("shows error when price is missing", async () => {
      render(<SellerListingPage />);
      const titleInput = await screen.findByLabelText(/^Title/i);
      fireEvent.change(titleInput, { target: { value: "Test Product" } });
      const descInput = await screen.findByLabelText(/^Description/i);
      fireEvent.change(descInput, { target: { value: "Test Description" } });
      const imagesInput = await screen.findByLabelText(/^Images/i);
      fireEvent.change(imagesInput, { target: { files: [createFile()] } });
      submitForm();
      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid price/i),
        ).toBeInTheDocument();
      });
    });

    it("shows error when price is zero or negative", async () => {
      render(<SellerListingPage />);
      const titleInput = await screen.findByLabelText(/^Title/i);
      fireEvent.change(titleInput, { target: { value: "Test Product" } });
      const descInput = await screen.findByLabelText(/^Description/i);
      fireEvent.change(descInput, { target: { value: "Test Description" } });
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "0" } });
      const imagesInput = await screen.findByLabelText(/^Images/i);
      fireEvent.change(imagesInput, { target: { files: [createFile()] } });
      submitForm();
      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid price/i),
        ).toBeInTheDocument();
      });
    });

    it("shows error when no images are uploaded", async () => {
      render(<SellerListingPage />);
      const titleInput = await screen.findByLabelText(/^Title/i);
      fireEvent.change(titleInput, { target: { value: "Test Product" } });
      const descInput = await screen.findByLabelText(/^Description/i);
      fireEvent.change(descInput, { target: { value: "Test Description" } });
      const priceInput = await screen.findByLabelText(/^Price/i);
      fireEvent.change(priceInput, { target: { value: "29.99" } });
      submitForm();
      await waitFor(() => {
        expect(
          screen.getByText(/Please upload at least one image/i),
        ).toBeInTheDocument();
      });
    });


    it("shows error when more than 5 images are uploaded", async () => {
      render(<SellerListingPage />);
      const imagesInput = await screen.findByLabelText(/^Images/i);
      const files = Array.from({ length: 6 }, (_, i) =>
        createFile(`test${i}.png`),
      );
      fireEvent.change(imagesInput, { target: { files } });
      await waitFor(() => {
        expect(
          screen.getByText(/You can upload a maximum of 5 images/i),
        ).toBeInTheDocument();
      });
    });

    it("shows error when backend submission fails", async () => {
      // Mock fetch for listing creation to fail
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/profile/me")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ id: "test-profile-id", fsa: "A1A" }),
          } as unknown) as Response);
        }
        if (typeof url === "string" && url.includes("/api/listings")) {
          return Promise.resolve(({
            ok: false,
            text: () => Promise.resolve("Failed to create listing"),
          } as unknown) as Response);
        }
        return Promise.resolve(({
          ok: true,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve("")
        } as unknown) as Response);
      });

      render(<SellerListingPage />);
      await fillValidForm();
      submitForm();

      expect(await screen.findByText(/Failed to create listing/i)).toBeInTheDocument();
    });

    it("shows error when profile fetch fails", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/profile/me")) {
          return Promise.resolve(({
            ok: false,
            text: () => Promise.resolve("fail")
          } as unknown) as Response);
        }
        return Promise.resolve(({
          ok: true,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve("")
        } as unknown) as Response);
      });

      render(<SellerListingPage />);
      expect(await screen.findByText(/Could not load profile info/i)).toBeInTheDocument();
    });

    it("shows error when profileId is missing", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/profile/me")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ fsa: "A1A" })
          } as unknown) as Response);
        }
        if (typeof url === "string" && url.includes("/api/listings")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ id: "new-id" })
          } as unknown) as Response);
        }
        return Promise.resolve(({
          ok: true,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve("")
        } as unknown) as Response);
      });

      render(<SellerListingPage />);
      await fillValidForm();
      submitForm();
      expect(await screen.findByText(/Profile ID missing/i)).toBeInTheDocument();
    });

    it("shows error when fsa is missing", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/profile/me")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ id: "test-profile-id" })
          } as unknown) as Response);
        }
        if (typeof url === "string" && url.includes("/api/listings")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ id: "new-id" })
          } as unknown) as Response);
        }
        if (typeof url === "string" && url.includes("/api/images/upload")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve("")
          } as unknown) as Response);
        }
        return Promise.resolve(({
          ok: true,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve("")
        } as unknown) as Response);
      });

      render(<SellerListingPage />);
      await fillValidForm();
      submitForm();
      expect(await screen.findByText(/FSA missing/i)).toBeInTheDocument();
    });

    it("shows error when image upload fails after listing creation", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/profile/me")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ id: "test-profile-id", fsa: "A1A" })
          } as unknown) as Response);
        }
        if (typeof url === "string" && url.includes("/api/listings")) {
          return Promise.resolve(({
            ok: true,
            json: () => Promise.resolve({ id: "new-listing" })
          } as unknown) as Response);
        }
        if (typeof url === "string" && url.includes("/api/images/upload")) {
          return Promise.resolve(({
            ok: false,
            text: () => Promise.resolve("Image upload failed")
          } as unknown) as Response);
        }
        return Promise.resolve(({
          ok: true,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve("")
        } as unknown) as Response);
      });

      render(<SellerListingPage />);
      await fillValidForm();
      submitForm();
      expect(await screen.findByText(/Failed to create listing/i)).toBeInTheDocument();
    });
  });

  // ----------------------------
  // Navigation
  // ----------------------------
  describe("Navigation", () => {
    it("navigates back when cancel button clicked", async () => {
      render(<SellerListingPage />);
      await waitFor(() => {
        const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
        fireEvent.click(cancelBtn);
        expect(mockBack).toHaveBeenCalled();
      });
    });
  });
});
