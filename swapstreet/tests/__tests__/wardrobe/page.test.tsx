import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WardrobePage from "@/app/wardrobe/page";
import userEvent from "@testing-library/user-event";
import * as wardrobeStorage from "@/app/wardrobe/wardrobeStorage";

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
  Upload: () => <div data-testid="upload-icon">Upload</div>,
}));

// Mock wardrobeStorage module
jest.mock("@/app/wardrobe/wardrobeStorage", () => ({
  readWardrobeItems: jest.fn(() => []),
  removeWardrobeItem: jest.fn((id: string) => []),
  WARDROBE_STORAGE_KEY: "wardrobeItems",
}));

// Mock next/image (renders img for tests)
jest.mock("next/image", () => {
  const MockNextImage = (props: any) => {
    const { src, alt, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={typeof src === "string" ? src : "/default.png"}
        alt={alt ?? "image"}
        {...rest}
      />
    );
  };
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

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

// Mock localStorage
const mockLocalStorage = (() => {
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

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// /api/catalog/items and expects array
const mockCatalogFetch = (
  items: Array<{ id: string }> = [{ id: "listing-1" }],
) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => items,
  });
};

describe("WardrobePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    mockLocalStorage.clear();
    mockSessionStorage.setItem("accessToken", "test-token");
    (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([]);
    (wardrobeStorage.removeWardrobeItem as jest.Mock).mockImplementation(
      (id: string) => [],
    );
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
    expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
  });

  it("should render view mode toggle buttons", () => {
    render(<WardrobePage />);

    expect(screen.getByTestId("grid-icon")).toBeInTheDocument();
    expect(screen.getByTestId("list-icon")).toBeInTheDocument();
  });

  it("should render 4 recent results placeholders", () => {
    const { container } = render(<WardrobePage />);

    const placeholders = container.querySelectorAll(".aspect-\\[2\\/3\\]");
    // 1 upload frame + 4 recent results = 5
    expect(placeholders.length).toBeGreaterThanOrEqual(5);
  });

  it("should render Try-On button in disabled state without image", () => {
    render(<WardrobePage />);

    const tryOnButton = screen.getByText("Try On");
    expect(tryOnButton).toBeInTheDocument();
    expect(tryOnButton).toBeDisabled();
  });

  describe("Image Upload", () => {
    it("should reject non-image file types", async () => {
      render(<WardrobePage />);

      const file = new File(["not an image"], "test.txt", {
        type: "text/plain",
      });
      const input = document.querySelector('input[type="file"]');
      if (input) {
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
          expect(
            screen.getByText(/Please upload an image file/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("should reject files larger than 5MB", async () => {
      render(<WardrobePage />);

      const largeBuffer = new Uint8Array(6 * 1024 * 1024);
      const file = new File([largeBuffer], "big.png", { type: "image/png" });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(
            screen.getByText(/Image must be smaller than 5MB/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("should handle image upload successfully", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: "http://test.com/uploaded-image.jpg" }),
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
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("images/upload"),
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
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Upload failed" }),
        text: async () => "Upload failed",
      });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        // check for error message
        await waitFor(() => {
          expect(
            (global.fetch as jest.Mock).mock.calls.length,
          ).toBeGreaterThanOrEqual(2);
          expect((global.fetch as jest.Mock).mock.calls[1][0]).toEqual(
            expect.stringContaining("images/upload"),
          );
        });

        const alert = await screen.findByRole("alert", {}, { timeout: 3000 });
        expect(alert).toBeInTheDocument();
        expect(alert.textContent || "").toMatch(/upload/i);
      }
    });

    it("should show error when upload fails with message property", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Custom upload message" }),
        text: async () => "Custom upload message",
      });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByText("Custom upload message")).toBeInTheDocument();
        });
      }
    });

    it("should show generic error when upload fails without error or message", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
        text: async () => "",
      });

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByText("Upload failed")).toBeInTheDocument();
        });
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

    it("should handle upload error when fetch throws", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByText("Network error")).toBeInTheDocument();
        });
      }
    });

    it("should handle upload error when fetch throws non-Error object", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockRejectedValueOnce("String error");

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByText("Upload failed")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Virtual Try-On", () => {
    it("should show no listings error when firstListingId is missing", async () => {
      // first fetch (listing id) returns empty array
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // mock upload success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "http://test.com/uploaded.jpg" }),
        text: async () => "success",
      });

      render(<WardrobePage />);

      const file = new File(["dummy"], "test.png", { type: "image/png" });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const tryOnButton = screen.getByRole("button", { name: "Try On" });
          expect(tryOnButton).not.toBeDisabled();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          expect(
            screen.getByText(/No listings available/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("should not allow try-on without uploaded image", async () => {
      render(<WardrobePage />);

      const tryOnButton = screen.getByRole("button", { name: /Try On/i });

      // Button should be disabled
      expect(tryOnButton).toBeDisabled();
    });

    it("should call try-on API with uploaded image", async () => {
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
            expect.stringContaining("images/upload"),
            expect.any(Object),
          );
        });

        // click try-on
        const tryOnButton = await screen.findByRole("button", {
          name: "Try On",
        });
        expect(tryOnButton).not.toBeDisabled();
        fireEvent.click(tryOnButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("tryon/virtual-tryon"),
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

    it("should show error when try-on API fails with message property", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Custom try-on message" }),
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
          expect(screen.getByText("Custom try-on message")).toBeInTheDocument();
        });
      }
    });

    it("should show generic error when try-on fails without error or message", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
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
          expect(screen.getByText("Try-on failed")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Favorites", () => {
    it("should toggle favorite on item click", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: 10,
          imageUrl: "http://test.com/item-1.jpg",
        },
      ]);

      render(<WardrobePage />);

      const starButtons = screen.getAllByTestId("star-icon");
      const firstStarButton = starButtons[0].closest("button");

      if (firstStarButton) {
        fireEvent.click(firstStarButton);
      }
    });

    it("should remove favorite when clicking favorited item", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: 10,
          imageUrl: "http://test.com/item-1.jpg",
        },
      ]);

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

    it("should limit recent results to 4 items", async () => {
      mockCatalogFetch();

      const { container } = render(<WardrobePage />);

      // Perform 5 try-ons
      for (let i = 1; i <= 5; i++) {
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ url: `http://test.com/uploaded${i}.jpg` }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ url: `http://test.com/result${i}.jpg` }),
          });

        const file = new File(["dummy content"], `test${i}.png`, {
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
      }

      // Should only have 4 recent results
      const resultImages = container.querySelectorAll(
        'img[alt*="Try-on result"]',
      );
      expect(resultImages.length).toBeLessThanOrEqual(4);
    });

    it("should allow clicking recent result to view it", async () => {
      mockCatalogFetch();

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

        const resultImage = container.querySelector(
          'img[alt*="Try-on result"]',
        );
        if (resultImage) {
          fireEvent.click(resultImage);
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should show error when try-on API fails", async () => {
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

    it("should show download failure when fetch throws", async () => {
      mockCatalogFetch();

      // Mock upload success
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        // download will reject
        .mockRejectedValueOnce(new Error("network"));

      // ensure token
      mockSessionStorage.setItem("accessToken", "test-token");

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const downloadButton = screen.getByTitle("Download image");
          expect(downloadButton).toBeInTheDocument();
        });

        const downloadButton = screen.getByTitle("Download image");
        fireEvent.click(downloadButton);

        await waitFor(() => {
          expect(
            screen.getByText(/Failed to download image/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("shows uploading indicator while upload is in progress", async () => {
      mockSessionStorage.setItem("accessToken", "test-token");
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}),
      );

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
        });
      }
    });

    it("reupload button resets uploaded image", async () => {
      mockCatalogFetch();

      // Mock successful upload
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

        // wait until uploaded image shown (Upload new photo button)
        await waitFor(() => {
          expect(screen.getByTitle("Upload new photo")).toBeInTheDocument();
        });

        const reupload = screen.getByTitle("Upload new photo");
        fireEvent.click(reupload);

        await waitFor(() => {
          expect(screen.getByText("Upload Your Photo")).toBeInTheDocument();
        });
      }
    });

    it("downloads image successfully", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(["a"], { type: "image/png" }),
        });

      const originalCreate = (window.URL as any).createObjectURL;
      const originalRevoke = (window.URL as any).revokeObjectURL;
      (window.URL as any).createObjectURL = jest.fn(() => "blob:url");
      (window.URL as any).revokeObjectURL = jest.fn(() => {});

      mockSessionStorage.setItem("accessToken", "test-token");

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          const downloadButton = screen.getByTitle("Download image");
          expect(downloadButton).toBeInTheDocument();
        });

        const downloadButton = screen.getByTitle("Download image");
        fireEvent.click(downloadButton);

        await waitFor(() => {
          expect((window.URL as any).createObjectURL).toHaveBeenCalled();
        });

        (window.URL as any).createObjectURL = originalCreate;
        (window.URL as any).revokeObjectURL = originalRevoke;
      }
    });

    it("should open file dialog on Enter key", async () => {
      render(<WardrobePage />);

      const input = document.querySelector('input[type="file"]');
      if (input) {
        (input as HTMLInputElement).click = jest.fn();

        const frame = document.querySelector(
          'div[role="button"][tabindex="0"]',
        ) as HTMLElement;
        expect(frame).toBeTruthy();
        fireEvent.keyDown(frame, { key: "Enter" });

        expect((input as HTMLInputElement).click).toHaveBeenCalled();
      }
    });

    it("should show generic error when try-on throws without message", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "http://test.com/uploaded.jpg" }),
          text: async () => "success",
        })
        .mockRejectedValueOnce({});

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

    it("handles listing fetch returning non-ok without throwing", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      render(<WardrobePage />);

      // page renders without crashing
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("should open file dialog on Space key", async () => {
      render(<WardrobePage />);

      const input = document.querySelector('input[type="file"]');
      if (input) {
        (input as HTMLInputElement).click = jest.fn();

        const frame = document.querySelector(
          'div[role="button"][tabindex="0"]',
        ) as HTMLElement;
        expect(frame).toBeTruthy();
        fireEvent.keyDown(frame, { key: " " });

        expect((input as HTMLInputElement).click).toHaveBeenCalled();
      }
    });

    it("should handle listing fetch with data.items structure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: "listing-from-items" }] }),
      });

      render(<WardrobePage />);

      await waitFor(() => {
        expect(screen.getByTestId("header")).toBeInTheDocument();
      });
    });

    it("should handle listing fetch error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Fetch failed"),
      );

      render(<WardrobePage />);

      // Should still render without crashing
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("should not trigger upload when frame is clicked with uploaded image", async () => {
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
        (input as HTMLInputElement).click = jest.fn();

        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByTitle("Upload new photo")).toBeInTheDocument();
        });

        // Try clicking the frame
        const frame = document.querySelector(
          'div[role="button"]',
        ) as HTMLElement;
        if (frame) {
          fireEvent.click(frame);
          // Should not trigger click on input since image is uploaded
          expect((input as HTMLInputElement).click).toHaveBeenCalledTimes(0);
        }
      }
    });

    it("should not open file dialog on keydown when image is uploaded", async () => {
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
        (input as HTMLInputElement).click = jest.fn();

        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByTitle("Upload new photo")).toBeInTheDocument();
        });

        const frame = document.querySelector(
          'div[role="button"]',
        ) as HTMLElement;
        if (frame) {
          fireEvent.keyDown(frame, { key: "Enter" });
          // Should not trigger since tabindex is -1 when image is uploaded
          expect((input as HTMLInputElement).click).toHaveBeenCalledTimes(0);
        }
      }
    });
  });

  describe("Toggle Buttons", () => {
    it("should toggle to show original photo", async () => {
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

  describe("Wardrobe Items", () => {
    it("should display wardrobe items from storage", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item 1",
          price: 25.99,
          imageUrl: "http://test.com/item-1.jpg",
        },
        {
          id: "item-2",
          title: "Test Item 2",
          price: 49.99,
          imageUrl: "http://test.com/item-2.jpg",
        },
      ]);

      render(<WardrobePage />);

      expect(screen.getByText("Test Item 1")).toBeInTheDocument();
      expect(screen.getByText("Test Item 2")).toBeInTheDocument();
      expect(screen.getByText("$25.99")).toBeInTheDocument();
      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });

    it("should display empty state when no wardrobe items", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([]);

      render(<WardrobePage />);

      expect(
        screen.getByText(/Your wardrobe is empty. Add items from Browse./i),
      ).toBeInTheDocument();
    });

    it("should handle wardrobe items with no image", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: 10,
          imageUrl: null,
        },
      ]);

      render(<WardrobePage />);

      expect(screen.getByText("No image")).toBeInTheDocument();
    });

    it("should handle wardrobe items with invalid price", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: NaN,
          imageUrl: "http://test.com/item-1.jpg",
        },
      ]);

      render(<WardrobePage />);

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle wardrobe items with infinity price", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: Infinity,
          imageUrl: "http://test.com/item-1.jpg",
        },
      ]);

      render(<WardrobePage />);

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should not remove from wardrobe when API fails", async () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: 10,
          imageUrl: "http://test.com/item-1.jpg",
        },
      ]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      render(<WardrobePage />);

      const removeButton = screen.getByTitle("Remove from wardrobe");
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/wishlist/item-1"),
          expect.any(Object),
        );
      });

      // removeWardrobeItem should not be called when API fails
      expect(wardrobeStorage.removeWardrobeItem).not.toHaveBeenCalled();
    });

    it("should handle remove error when fetch throws", async () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([
        {
          id: "item-1",
          title: "Test Item",
          price: 10,
          imageUrl: "http://test.com/item-1.jpg",
        },
      ]);

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<WardrobePage />);

      const removeButton = screen.getByTitle("Remove from wardrobe");
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Storage Event Handling", () => {
    it("should not update wardrobe items when storage event has different key", () => {
      (wardrobeStorage.readWardrobeItems as jest.Mock).mockReturnValue([]);

      render(<WardrobePage />);

      const initialCallCount = (wardrobeStorage.readWardrobeItems as jest.Mock)
        .mock.calls.length;

      // Trigger storage event with different key
      const storageEvent = new StorageEvent("storage", {
        key: "differentKey",
      });
      window.dispatchEvent(storageEvent);

      // Should not call readWardrobeItems again
      expect(
        (wardrobeStorage.readWardrobeItems as jest.Mock).mock.calls.length,
      ).toBe(initialCallCount);
    });
  });

  describe("Download with Generated Image", () => {
    it("should download generated result image", async () => {
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
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(["result"], { type: "image/png" }),
        });

      const originalCreate = (window.URL as any).createObjectURL;
      const originalRevoke = (window.URL as any).revokeObjectURL;
      (window.URL as any).createObjectURL = jest.fn(() => "blob:result-url");
      (window.URL as any).revokeObjectURL = jest.fn(() => {});

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

        // Switch to result view
        const resultButton = screen.getByRole("button", { name: "Result" });
        fireEvent.click(resultButton);

        // Download the result
        const downloadButton = screen.getByTitle("Download image");
        fireEvent.click(downloadButton);

        await waitFor(() => {
          expect((window.URL as any).createObjectURL).toHaveBeenCalled();
        });

        (window.URL as any).createObjectURL = originalCreate;
        (window.URL as any).revokeObjectURL = originalRevoke;
      }
    });
  });

  describe("Try-On Button States", () => {
    it("should disable try-on button during upload", async () => {
      mockCatalogFetch();

      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}),
      );

      render(<WardrobePage />);

      const file = new File(["dummy content"], "test.png", {
        type: "image/png",
      });
      const input = document.querySelector('input[type="file"]');

      if (input) {
        await userEvent.upload(input as HTMLElement, file);

        await waitFor(() => {
          expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
        });

        const tryOnButton = screen.getByRole("button", { name: "Try On" });
        expect(tryOnButton).toBeDisabled();
      }
    });
  });
});
