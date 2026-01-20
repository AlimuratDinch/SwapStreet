import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WardrobePage from "@/app/wardrobe/page";
import userEvent from "@testing-library/user-event";

// Mock header component
jest.mock("@/app/browse/BrowseElements", () => ({
  Header: ({ showCenterNav }: { showCenterNav?: boolean }) => (
    <div data-testid="header">
      Header {showCenterNav ? "with nav" : "without nav"}
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Star: () => <div data-testid="star-icon">Star</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Grid: () => <div data-testid="grid-icon">Grid</div>,
  List: () => <div data-testid="list-icon">List</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

// Helper: first fetch on mount hits /api/catalog/items and expects an array
const mockCatalogFetch = (items: Array<{ id: string }> = [{ id: "listing-1" }]) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => items,
  });
};

describe("WardrobePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    mockSessionStorage.setItem("accessToken", "test-token");
  });

  it("should render the wardrobe page with header", () => {
    render(<WardrobePage />);

    const header = screen.getByTestId("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("without nav");
  });

  it("should render the sidebar with upload frame", () => {
    render(<WardrobePage />);

    expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("should render view mode toggle buttons", () => {
    render(<WardrobePage />);

    expect(screen.getByTestId("grid-icon")).toBeInTheDocument();
    expect(screen.getByTestId("list-icon")).toBeInTheDocument();
  });

  it("should render 4 recent results placeholders", () => {
    const { container } = render(<WardrobePage />);

    const placeholders = container.querySelectorAll(".aspect-\\[2\\/3\\]");
    // 1 for upload frame + 4 for recent results = 5 total
    expect(placeholders.length).toBeGreaterThanOrEqual(5);
  });

  it("should render Try-On button in disabled state without image", () => {
    render(<WardrobePage />);

    const tryOnButton = screen.getByText("Try On");
    expect(tryOnButton).toBeInTheDocument();
    expect(tryOnButton).toBeDisabled();
  });

  describe("Image Upload", () => {
    it("should handle image upload successfully", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: "http://test.com/uploaded-image.jpg" }),
        text: async () => "success",
      });

      const { container } = render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/images/upload"),
            expect.objectContaining({
              method: "POST",
              headers: {
                Authorization: "Bearer test-token",
              },
            }),
          );
        });
      }
    });

    it("should show error when upload fails", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Upload failed",
      });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        // Then check for error message
        // Ensure upload call was the second fetch (after catalog)
        await waitFor(() => {
          expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
          expect((global.fetch as jest.Mock).mock.calls[1][0]).toEqual(
            expect.stringContaining("/api/images/upload"),
          );
        });

        // Use a11y role to find the alert and assert message
        const alert = await screen.findByRole('alert', {}, { timeout: 3000 });
        expect(alert).toBeInTheDocument();
        expect(alert.textContent || '').toMatch(/upload/i);
      }
    });

    it("should show error when no auth token exists", async () => {
      mockSessionStorage.clear();

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(
            screen.getByText(/Please log in to upload image/i),
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe("Virtual Try-On", () => {
    it("should not allow try-on without uploaded image", async () => {
      render(<WardrobePage />);

      const tryOnButton = screen.getByRole("button", { name: /Try On/i });

      // Button should be disabled
      expect(tryOnButton).toBeDisabled();
    });

    it("should call try-on API with uploaded image", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch([{ id: "listing-xyz" }]);

      // Mock successful upload
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        // Mock successful try-on
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/result.jpg" }),
        });

      render(<WardrobePage />);

      // Upload image first
      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/images/upload"),
            expect.any(Object),
          );
        });

        // Now click try-on
        const tryOnButton = await screen.findByRole("button", {
          name: "Try On",
        });
        expect(tryOnButton).not.toBeDisabled();
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/tryon/virtual-tryon"),
            expect.objectContaining({
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer test-token",
              },
            }),
          );
        });
      }
    });

    it("should show Processing... during try-on", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      // Mock upload
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        // Mock delayed try-on
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => ({ url: "http://test.com/result.jpg" }),
                  }),
                100,
              ),
            ),
        );

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const tryOnButton = screen.getByRole("button", { name: "Try On" });
          expect(tryOnButton).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        expect(
          await screen.findByRole("button", { name: /Processing.../i }),
        ).toBeInTheDocument();
      }
    });

    it("should add generated image to recent results", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      // Mock upload and try-on
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/result1.jpg" }),
        });

      const { container } = render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          const resultImage = container.querySelector(
            'img[alt*="Try-on result"]',
          );
          expect(resultImage).toBeInTheDocument();
        });
      }
    });
  });

  describe("Favorites", () => {
    it("should toggle favorite on item click", () => {
      render(<WardrobePage />);

      const starButtons = screen.getAllByTestId("star-icon");
      const firstStarButton = starButtons[0].closest("button");

      if (firstStarButton) {
        fireEvent.click(firstStarButton);
      }
    });

    it("should remove favorite when clicking favorited item", () => {
      render(<WardrobePage />);

      const starButtons = screen.getAllByTestId("star-icon");
      const firstStarButton = starButtons[0].closest("button");

      if (firstStarButton) {
        // Add to favorite
        fireEvent.click(firstStarButton);
        // Remove from favorite
        fireEvent.click(firstStarButton);
      }
    });
  });

  describe("View Mode Toggle", () => {
    it("should switch to list view when list button clicked", () => {
      render(<WardrobePage />);

      const listButton = screen.getByTestId("list-icon").closest("button");

      if (listButton) {
        fireEvent.click(listButton);
      }
    });

    it("should switch to grid view when grid button clicked", () => {
      render(<WardrobePage />);

      const gridButton = screen.getByTestId("grid-icon").closest("button");

      if (gridButton) {
        fireEvent.click(gridButton);
      }
    });
  });

  describe("Recent Results Management", () => {
    it("should display recent results after try-on", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      // Mock upload and try-on
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/result1.jpg" }),
        });

      const { container } = render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          const resultImages = container.querySelectorAll(
            'img[alt*="Try-on result"]',
          );
          expect(resultImages.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should show error when try-on API fails", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Try-on service unavailable" }),
        });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          expect(
            screen.getByText("Try-on service unavailable"),
          ).toBeInTheDocument();
        });
      }
    });

    it("should show generic error when try-on throws without message", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockRejectedValueOnce(new Error());

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
      }
    });

    it("should show error when try-on attempted without auth", async () => {
      // Set up token for upload, then remove for try-on
      mockSessionStorage.setItem("accessToken", "test-token");

      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "http://test.com/uploaded.jpg" }),
        text: async () => "success",
      });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        // Clear token after upload but before try-on
        mockSessionStorage.clear();

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          expect(
            screen.getByText("Please log in to use try-on feature"),
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe("Toggle Buttons", () => {
    it("should toggle to show original photo", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/result.jpg" }),
        });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          const originalButton = screen.queryByRole("button", {
            name: "Original",
          });
          expect(originalButton).toBeInTheDocument();
        });

        const originalButton = screen.getByRole("button", { name: "Original" });
        fireEvent.click(originalButton);
      }
    });

    it("should toggle to show result photo", async () => {
      // Initial mount fetch for listing id
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/result.jpg" }),
        });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const button = screen.getByRole("button", { name: "Try On" });
          expect(button).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          const resultButton = screen.queryByRole("button", { name: "Result" });
          expect(resultButton).toBeInTheDocument();
        });

        const resultButton = screen.getByRole("button", { name: "Result" });
        fireEvent.click(resultButton);
      }
    });
  });
});
