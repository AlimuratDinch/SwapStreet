import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";
import SellerListingPage from "@/app/seller/listing/page";

const mockPush = jest.fn();
const mockBack = jest.fn();

// Properly mock next/navigation
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
  const changeField = (label: RegExp, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const uploadImage = (files: File[]) =>
    fireEvent.change(screen.getByLabelText(/^Images/i), { target: { files } });
  const createFile = (name = "test.png") =>
    new File(["img"], name, { type: "image/png" });

  // ----------------------------
  // Rendering tests
  // ----------------------------
  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(<SellerListingPage />);
      ["Title", "Description", "Price", "Category", "Subcategory", "Images"].forEach(
        (field) => {
          expect(screen.getByLabelText(new RegExp(`^${field}`, "i"))).toBeInTheDocument();
        }
      );
    });

    it("renders page heading and description", () => {
      render(<SellerListingPage />);
      expect(screen.getByText(/Create a new listing/i)).toBeInTheDocument();
      expect(screen.getByText(/Add a new item to your product catalog/i)).toBeInTheDocument();
    });

    it("renders all category options", () => {
      render(<SellerListingPage />);
      ["Shirts", "Pants", "Dresses", "Accessories", "Portables"].forEach((cat) => {
        expect(screen.getByRole("option", { name: cat })).toBeInTheDocument();
      });
    });

    it("renders submit and cancel buttons", () => {
      render(<SellerListingPage />);
      expect(screen.getByRole("button", { name: /Create Listing/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  // ----------------------------
  // Form input handling tests
  // ----------------------------
  describe("Form Input Handling", () => {
    it.each([
      ["title", "Test Title"],
      ["description", "Test Description"],
    ])("updates %s input", (field, value) => {
      render(<SellerListingPage />);
      const input = screen.getByLabelText(new RegExp(`^${field}`, "i"));
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
    });

    it("updates price input with valid number", () => {
      render(<SellerListingPage />);
      changeField(/^Price/i, "29.99");
      expect(screen.getByLabelText(/^Price/i)).toHaveValue(29.99);
    });

    it("handles empty price input", () => {
      render(<SellerListingPage />);
      changeField(/^Price/i, "");
      expect(screen.getByLabelText(/^Price/i)).toHaveValue(null);
    });
  });

  // ----------------------------
  // Category/Subcategory selection
  // ----------------------------
  describe("Category and Subcategory Selection", () => {
    it("enables subcategory when category is selected", () => {
      render(<SellerListingPage />);
      const subcategory = screen.getByLabelText(/^Subcategory \*/i);
      expect(subcategory).toBeDisabled();
      changeField(/^Category \*/i, "Shirts");
      expect(subcategory).not.toBeDisabled();
    });

    it("resets subcategory when category changes", () => {
      render(<SellerListingPage />);
      changeField(/^Category \*/i, "Shirts");
      changeField(/^Subcategory \*/i, "T-shirts");
      changeField(/^Category \*/i, "Pants");
      expect(screen.getByLabelText(/^Subcategory \*/i)).toHaveValue("");
    });

    it.each([
      ["Shirts", ["T-shirts", "Polos", "Blouses"]],
      ["Pants", ["Jeans", "Trousers", "Shorts"]],
      ["Dresses", ["Long", "Short"]],
      ["Accessories", ["Shoes", "Bags", "Jewelry"]],
      ["Portables", ["Backpacks", "Tote Bags", "Messenger Bags"]],
    ])("displays correct subcategories for %s", (category, subcategories) => {
      render(<SellerListingPage />);
      changeField(/^Category \*/i, category);
      subcategories.forEach((sub) => {
        expect(screen.getByRole("option", { name: sub })).toBeInTheDocument();
      });
    });
  });

  // ----------------------------
  // Image handling
  // ----------------------------
  describe("Image Handling", () => {
    it("displays image preview after upload", async () => {
      render(<SellerListingPage />);
      const file = createFile();
      uploadImage([file]);
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument()
      );
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it("allows multiple images up to 5", async () => {
      render(<SellerListingPage />);
      const files = Array.from({ length: 3 }, (_, i) => createFile(`test${i}.png`));
      uploadImage(files);
      await waitFor(() => {
        ["Preview 1", "Preview 2", "Preview 3"].forEach((alt) => {
          expect(screen.getByAltText(alt)).toBeInTheDocument();
        });
      });
    });

    it("removes image when delete button clicked", async () => {
      render(<SellerListingPage />);
      uploadImage([createFile()]);
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole("button", { name: "×" }));
      await waitFor(() =>
        expect(screen.queryByAltText("Preview 1")).not.toBeInTheDocument()
      );
    });
  });

  // ----------------------------
  // Form submission and validation
  // ----------------------------
  describe("Form Submission", () => {
    const fillValidForm = () => {
      changeField(/^Title/i, "Test Product");
      changeField(/^Description/i, "Test Description");
      changeField(/^Price/i, "29.99");
      changeField(/^Category \*/i, "Shirts");
      changeField(/^Subcategory \*/i, "T-shirts");
      uploadImage([createFile()]);
    };

    it("submits form successfully with valid data", async () => {
      render(<SellerListingPage />);
      fillValidForm();
      submitForm();
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/seller/me"));
    });

    it("saves listing to localStorage", async () => {
      render(<SellerListingPage />);
      fillValidForm();
      submitForm();
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });
  });

  // ----------------------------
  // Navigation
  // ----------------------------
  describe("Navigation", () => {
    it("navigates back when cancel button clicked", () => {
      render(<SellerListingPage />);
      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
