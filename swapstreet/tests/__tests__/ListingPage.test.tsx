import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter } from "next/navigation";
import SellerListingPage from "@/app/seller/listing/page";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

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

  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(<SellerListingPage />);
      [
        "Title",
        "Description",
        "Price",
        "Category",
        "Subcategory",
        "Images",
      ].forEach((field) => {
        expect(
          screen.getByLabelText(new RegExp(`^${field}`, "i")),
        ).toBeInTheDocument();
      });
    });

    it("renders page heading and description", () => {
      render(<SellerListingPage />);
      expect(screen.getByText(/Create a new listing/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Add a new item to your product catalog/i),
      ).toBeInTheDocument();
    });

    it("renders all category options", () => {
      render(<SellerListingPage />);
      ["Shirts", "Pants", "Dresses", "Accessories", "Portables"].forEach(
        (cat) => {
          expect(screen.getByRole("option", { name: cat })).toBeInTheDocument();
        },
      );
    });

    it("renders submit and cancel buttons", () => {
      render(<SellerListingPage />);
      expect(
        screen.getByRole("button", { name: /Create Listing/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Cancel/i }),
      ).toBeInTheDocument();
    });
  });

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

  describe("Image Handling", () => {
    it("displays image preview after upload", async () => {
      render(<SellerListingPage />);
      const file = createFile();
      uploadImage([file]);
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument(),
      );
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it("allows multiple images up to 5", async () => {
      render(<SellerListingPage />);
      const files = Array.from({ length: 3 }, (_, i) =>
        createFile(`test${i}.png`),
      );
      uploadImage(files);
      await waitFor(() => {
        ["Preview 1", "Preview 2", "Preview 3"].forEach((alt) => {
          expect(screen.getByAltText(alt)).toBeInTheDocument();
        });
      });
    });

    it("allows adding more images to existing ones", async () => {
      render(<SellerListingPage />);
      uploadImage([createFile("test1.png")]);
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument(),
      );
      uploadImage([createFile("test2.png")]);
      await waitFor(() =>
        expect(screen.getByAltText("Preview 2")).toBeInTheDocument(),
      );
    });

    it("shows error for more than 5 images", async () => {
      render(<SellerListingPage />);
      uploadImage(
        Array.from({ length: 6 }, (_, i) => createFile(`test${i}.png`)),
      );
      await waitFor(() =>
        expect(screen.getByText(/maximum of 5 images/i)).toBeInTheDocument(),
      );
    });

    it("removes image when delete button clicked", async () => {
      render(<SellerListingPage />);
      uploadImage([createFile()]);
      await waitFor(() =>
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole("button", { name: "×" }));
      await waitFor(() =>
        expect(screen.queryByAltText("Preview 1")).not.toBeInTheDocument(),
      );
    });

    it("removes correct image when multiple images exist", async () => {
      render(<SellerListingPage />);
      uploadImage(
        Array.from({ length: 3 }, (_, i) => createFile(`test${i}.png`)),
      );
      await waitFor(() => {
        ["Preview 1", "Preview 2", "Preview 3"].forEach((alt) => {
          expect(screen.getByAltText(alt)).toBeInTheDocument();
        });
      });
      fireEvent.click(screen.getAllByRole("button", { name: "×" })[1]);
      await waitFor(() => {
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument();
        expect(screen.getByAltText("Preview 2")).toBeInTheDocument();
        expect(screen.queryByAltText("Preview 3")).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "×" })).toHaveLength(2);
      });
    });

    it("handles empty file input", () => {
      render(<SellerListingPage />);
      uploadImage([]);
      expect(screen.queryByAltText(/Preview/i)).not.toBeInTheDocument();
    });
  });

  describe("Validation Errors", () => {
    it("shows error for missing title", async () => {
      render(<SellerListingPage />);
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/enter a title/i)).toBeInTheDocument(),
      );
    });

    it("shows error for title with only whitespace", async () => {
      render(<SellerListingPage />);
      changeField(/Title/i, "   ");
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/enter a title/i)).toBeInTheDocument(),
      );
    });

    it("shows error for missing description", async () => {
      render(<SellerListingPage />);
      changeField(/Title/i, "Title");
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/enter a description/i)).toBeInTheDocument(),
      );
    });

    it("shows error for description with only whitespace", async () => {
      render(<SellerListingPage />);
      changeField(/Title/i, "Title");
      changeField(/Description/i, "   ");
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/enter a description/i)).toBeInTheDocument(),
      );
    });

    it.each([
      ["missing price", ""],
      ["zero price", "0"],
      ["negative price", "-10"],
    ])("shows error for %s", async (_, price) => {
      render(<SellerListingPage />);
      changeField(/Title/i, "Title");
      changeField(/Description/i, "Description");
      if (price) changeField(/Price/i, price);
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/valid price/i)).toBeInTheDocument(),
      );
    });

    it("shows error for missing images", async () => {
      render(<SellerListingPage />);
      changeField(/Title/i, "Title");
      changeField(/Description/i, "Description");
      changeField(/Price/i, "10");
      submitForm();
      await waitFor(() =>
        expect(
          screen.getByText(/upload at least one image/i),
        ).toBeInTheDocument(),
      );
    });

    it("shows error for missing category", async () => {
      render(<SellerListingPage />);
      changeField(/^Title/i, "Title");
      changeField(/^Description/i, "Description");
      changeField(/^Price/i, "10");
      uploadImage([createFile()]);
      submitForm();
      await waitFor(
        () =>
          expect(
            screen.getByText(/Please select a category/i),
          ).toBeInTheDocument(),
        { timeout: 2000 },
      );
    });

    it("shows error for missing subcategory", async () => {
      render(<SellerListingPage />);
      changeField(/^Title/i, "Title");
      changeField(/^Description/i, "Description");
      changeField(/^Price/i, "10");
      changeField(/^Category \*/i, "Shirts");
      uploadImage([createFile()]);
      submitForm();
      await waitFor(
        () =>
          expect(
            screen.getByText(/Please select a subcategory/i),
          ).toBeInTheDocument(),
        { timeout: 2000 },
      );
    });

    it("clears previous error when new validation error occurs", async () => {
      render(<SellerListingPage />);
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/enter a title/i)).toBeInTheDocument(),
      );
      changeField(/^Title/i, "Title");
      submitForm();
      await waitFor(() => {
        expect(screen.queryByText(/enter a title/i)).not.toBeInTheDocument();
        expect(screen.getByText(/enter a description/i)).toBeInTheDocument();
      });
    });
  });

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
        const saved = JSON.parse(
          localStorageMock.setItem.mock.calls[0][1] || "[]",
        );
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
          title: "Test Product",
          description: "Test Description",
          price: 29.99,
          category: "Shirts",
          subcategory: "T-shirts",
          status: "active",
        });
        ["id", "timestamp", "images"].forEach((prop) =>
          expect(saved[0]).toHaveProperty(prop),
        );
      });
    });

    it("appends to existing listings in localStorage", async () => {
      const existingListing = {
        id: "1",
        title: "Existing",
        price: 10,
        category: "Pants",
        subcategory: "Jeans",
      };
      localStorageMock.setItem(
        "seller:listings",
        JSON.stringify([existingListing]),
      );
      render(<SellerListingPage />);
      fillValidForm();
      submitForm();
      await waitFor(() => {
        const saved = JSON.parse(
          localStorageMock.setItem.mock.calls[
            localStorageMock.setItem.mock.calls.length - 1
          ][1] || "[]",
        );
        expect(saved).toHaveLength(2);
        expect(saved[0]).toMatchObject(existingListing);
      });
    });

    it("trims whitespace from title and description", async () => {
      render(<SellerListingPage />);
      changeField(/^Title/i, "  Test Product  ");
      changeField(/^Description/i, "  Test Description  ");
      changeField(/^Price/i, "29.99");
      changeField(/^Category \*/i, "Shirts");
      changeField(/^Subcategory \*/i, "T-shirts");
      uploadImage([createFile()]);
      submitForm();
      await waitFor(() => {
        const saved = JSON.parse(
          localStorageMock.setItem.mock.calls[
            localStorageMock.setItem.mock.calls.length - 1
          ][1] || "[]",
        );
        expect(saved[0].title).toBe("Test Product");
        expect(saved[0].description).toBe("Test Description");
      });
    });

    it("disables submit button while submitting", async () => {
      render(<SellerListingPage />);
      fillValidForm();
      const submitButton = screen.getByRole("button", {
        name: /Create Listing/i,
      });
      expect(submitButton).not.toBeDisabled();
      submitForm();
      await waitFor(() => expect(mockPush).toHaveBeenCalled());
    });

    it("shows creating text on submit button while submitting", async () => {
      render(<SellerListingPage />);
      fillValidForm();
      submitForm();
      await waitFor(() => expect(mockPush).toHaveBeenCalled());
    });

    it("handles localStorage error gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });
      render(<SellerListingPage />);
      fillValidForm();
      submitForm();
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(screen.getByText(/Failed to save listing/i)).toBeInTheDocument();
      });
      consoleErrorSpy.mockRestore();
    });

    it("re-enables submit button after error", async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });
      render(<SellerListingPage />);
      fillValidForm();
      const submitButton = screen.getByRole("button", {
        name: /Create Listing/i,
      });
      submitForm();
      await waitFor(() => expect(submitButton).not.toBeDisabled());
    });
  });

  describe("Navigation", () => {
    it("navigates back when cancel button clicked", () => {
      render(<SellerListingPage />);
      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("Error Display", () => {
    it("displays error message in red box", async () => {
      render(<SellerListingPage />);
      submitForm();
      await waitFor(() => {
        const errorDiv = screen.getByText(/enter a title/i).closest("div");
        expect(errorDiv).toHaveClass("bg-red-50");
        expect(errorDiv).toHaveClass("border-red-200");
      });
    });

    it("hides error message initially", () => {
      render(<SellerListingPage />);
      expect(screen.queryByText(/enter a title/i)).not.toBeInTheDocument();
    });
  });
});
