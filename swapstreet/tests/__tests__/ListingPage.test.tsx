import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import SellerListingPage from "@/app/seller/listing/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("SellerListingPage", () => {
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back: mockRouterBack });
    global.URL.createObjectURL = jest.fn(() => "mock-url");
  });

  const fillForm = (includeImages = true, includeCategory = true) => {
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test Product" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Test Description" },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: "29.99" },
    });

    if (includeImages) {
      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByLabelText(/images/i), {
        target: { files: [file] },
      });
    }

    if (includeCategory) {
      fireEvent.change(screen.getByLabelText(/^category/i), {
        target: { value: "Shirts" },
      });
      fireEvent.change(screen.getByLabelText(/subcategory/i), {
        target: { value: "T-shirts" },
      });
    }
  };

  describe("Validation Errors", () => {
    it("should show error for missing required fields", async () => {
      render(<SellerListingPage />);
      const form = screen
        .getByRole("button", { name: /create listing/i })
        .closest("form");
      fireEvent.submit(form!);
      expect(
        await screen.findByText("Please enter a title."),
      ).toBeInTheDocument();
    });

    it("should show error for invalid price", async () => {
      render(<SellerListingPage />);
      fillForm(false, false);
      fireEvent.change(screen.getByLabelText(/price/i), {
        target: { value: "0" },
      });
      const form = screen
        .getByRole("button", { name: /create listing/i })
        .closest("form");
      fireEvent.submit(form!);
      expect(
        await screen.findByText("Please enter a valid price."),
      ).toBeInTheDocument();
    });

    it("should show error when no images uploaded", async () => {
      render(<SellerListingPage />);
      fillForm(false, false);
      const form = screen
        .getByRole("button", { name: /create listing/i })
        .closest("form");
      fireEvent.submit(form!);
      expect(
        await screen.findByText("Please upload at least one image."),
      ).toBeInTheDocument();
    });

    it("should show error for more than 5 images", async () => {
      render(<SellerListingPage />);
      const files = Array(6)
        .fill(null)
        .map(
          (_, i) =>
            new File([`test${i}`], `test${i}.png`, { type: "image/png" }),
        );
      fireEvent.change(screen.getByLabelText(/images/i), { target: { files } });
      expect(
        await screen.findByText("You can upload a maximum of 5 images."),
      ).toBeInTheDocument();
    });
  });

  describe("Image Handling", () => {
    it("should display and remove image previews", async () => {
      render(<SellerListingPage />);
      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByLabelText(/images/i), {
        target: { files: [file] },
      });

      await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());

      fireEvent.click(screen.getByRole("button", { name: "×" }));
      await waitFor(() =>
        expect(screen.queryByRole("img")).not.toBeInTheDocument(),
      );
    });
  });

  describe("Category Selection", () => {
    it("should enable subcategory when category selected", () => {
      render(<SellerListingPage />);
      const subcategorySelect = screen.getByLabelText(/subcategory/i);

      expect(subcategorySelect).toBeDisabled();
      fireEvent.change(screen.getByLabelText(/^category/i), {
        target: { value: "Shirts" },
      });
      expect(subcategorySelect).not.toBeDisabled();
    });

    it("should reset subcategory when category changes", () => {
      render(<SellerListingPage />);
      fireEvent.change(screen.getByLabelText(/^category/i), {
        target: { value: "Shirts" },
      });
      fireEvent.change(screen.getByLabelText(/subcategory/i), {
        target: { value: "T-shirts" },
      });
      fireEvent.change(screen.getByLabelText(/^category/i), {
        target: { value: "Pants" },
      });

      expect(screen.getByLabelText(/subcategory/i)).toHaveValue("");
    });
  });

  describe("Form Submission", () => {
    it("should submit successfully with valid data", async () => {
      render(<SellerListingPage />);
      fillForm();

      const form = screen
        .getByRole("button", { name: /create listing/i })
        .closest("form");
      fireEvent.submit(form!);
      await waitFor(() => expect(mockRouterBack).toHaveBeenCalled());
    });

    it("should show loading state during submission", async () => {
      render(<SellerListingPage />);
      fillForm();

      const form = screen
        .getByRole("button", { name: /create listing/i })
        .closest("form");
      fireEvent.submit(form!);
      expect(
        screen.getByRole("button", { name: /create listing/i }),
      ).toBeDisabled();
    });
  });

  describe("Navigation", () => {
    it("should navigate back when cancel clicked", () => {
      render(<SellerListingPage />);
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
});
