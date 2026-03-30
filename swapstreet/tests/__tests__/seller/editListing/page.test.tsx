import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EditListingPage from "@/app/seller/editListing/page";

const mockPush = jest.fn();

let searchParamsValue = new URLSearchParams("id=listing-1");
let authToken: string | null = "test-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
  useSearchParams: () => searchParamsValue,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    accessToken: authToken,
    userId: "user-1",
    isAuthenticated: !!authToken,
  }),
}));

const mockListing = {
  id: "listing-1",
  title: "Blue Jacket",
  description: "A nice blue jacket",
  price: 29.99,
  category: "Tops",
  brand: "Nike",
  condition: "Good",
  size: "M",
  colour: "Blue",
  images: [
    { id: "img-1", imageUrl: "https://example.com/jacket-1.jpg" },
    { id: "img-2", imageUrl: "https://example.com/jacket-2.jpg" },
  ],
};

const setupDefaultFetch = () => {
  global.fetch = jest.fn((url: string, options?: RequestInit) => {
    if (url.includes("/search/listing/listing-1")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockListing,
      } as Response);
    }

    if (url.includes("/listings/listing-1") && options?.method === "PUT") {
      return Promise.resolve({ ok: true, status: 204 } as Response);
    }

    if (url.includes("/images/upload") && options?.method === "POST") {
      return Promise.resolve({ ok: true, status: 200 } as Response);
    }

    return Promise.reject(new Error(`Unmocked URL: ${url}`));
  }) as jest.Mock;
};

beforeAll(() => {
  Object.defineProperty(global.URL, "createObjectURL", {
    writable: true,
    value: jest.fn(() => "blob:preview-url"),
  });
  Object.defineProperty(global.URL, "revokeObjectURL", {
    writable: true,
    value: jest.fn(),
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockReset();
  searchParamsValue = new URLSearchParams("id=listing-1");
  authToken = "test-token";
  setupDefaultFetch();
});

describe("EditListingPage", () => {
  it("loads and displays listing data", async () => {
    render(<EditListingPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument();
      expect(screen.getByDisplayValue("A nice blue jacket")).toBeInTheDocument();
      expect(screen.getByDisplayValue("29.99")).toBeInTheDocument();
    });
  });

  it("shows fetch error when listing cannot be loaded", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<EditListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Could not load listing")).toBeInTheDocument();
    });
  });

  it("navigates back using Back and Cancel", async () => {
    const user = userEvent.setup();
    render(<EditListingPage />);

    await waitFor(() => expect(screen.getByText("Back")).toBeInTheDocument());

    await user.click(screen.getByText("Back"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockPush).toHaveBeenCalledWith("/seller/manageListings");
  });

  it("validates title, description and price", async () => {
    const user = userEvent.setup();
    render(<EditListingPage />);

    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    const title = screen.getByDisplayValue("Blue Jacket") as HTMLInputElement;
    const description = screen.getByDisplayValue("A nice blue jacket") as HTMLTextAreaElement;
    const price = screen.getByDisplayValue("29.99") as HTMLInputElement;

    await user.clear(title);
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await waitFor(() => expect(screen.getByText("Please enter a title.")).toBeInTheDocument());

    await user.type(title, "Updated title");
    await user.clear(description);
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await waitFor(() =>
      expect(screen.getByText("Please enter a description.")).toBeInTheDocument()
    );

    await user.type(description, "Updated description");
    await user.clear(price);
    await user.type(price, "0");
    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await waitFor(() =>
      expect(screen.getByText("Please enter a valid price.")).toBeInTheDocument()
    );
  });

  it("validates enum dropdowns when missing", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockListing, category: "", brand: "", condition: "", size: "", colour: "" }),
        } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<EditListingPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await waitFor(() => expect(screen.getByText("Please select a category.")).toBeInTheDocument());
  });

  it("validates image requirement when all existing images are removed", async () => {
    const user = userEvent.setup();
    render(<EditListingPage />);

    await waitFor(() => expect(screen.getByText("Current Images")).toBeInTheDocument());

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[0]);
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await waitFor(() =>
      expect(screen.getByText("Please keep at least one image or upload new ones.")).toBeInTheDocument()
    );
  });

  it("uploads pending images before listing update", async () => {
    const user = userEvent.setup();
    const calls: Array<{ url: string; method?: string }> = [];

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      calls.push({ url, method: options?.method });
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({ ok: true, json: async () => mockListing } as Response);
      }
      if (url.includes("/images/upload") && options?.method === "POST") {
        return Promise.resolve({ ok: true, status: 200 } as Response);
      }
      if (url.includes("/listings/listing-1") && options?.method === "PUT") {
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<EditListingPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    const file = new File(["img"], "test.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      const uploadCall = calls.find((c) => c.url.includes("/images/upload"));
      const putCall = calls.find((c) => c.url.includes("/listings/listing-1") && c.method === "PUT");
      expect(uploadCall).toBeDefined();
      expect(putCall).toBeDefined();
    });
  });

  it("handles image upload failure and does not continue", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({ ok: true, json: async () => mockListing } as Response);
      }
      if (url.includes("/images/upload") && options?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 400,
          text: async () => "Image upload failed",
        } as Response);
      }
      if (url.includes("/listings/listing-1") && options?.method === "PUT") {
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<EditListingPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    const file = new File(["img"], "bad.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Image upload failed")).toBeInTheDocument();
    });
  });

  it("handles too many uploaded images", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockListing, images: new Array(5).fill(null).map((_, i) => ({ id: `img-${i}`, imageUrl: `https://x/${i}.jpg` })) }),
        } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<EditListingPage />);
    await waitFor(() => expect(screen.getByText("Upload New Images (max 5 total)")).toBeInTheDocument());

    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    await user.upload(fileInput, new File(["img"], "over.png", { type: "image/png" }));

    await waitFor(() => {
      expect(screen.getByText("You can upload a maximum of 5 images total.")).toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  it("removes pending image and revokes object URL", async () => {
    const user = userEvent.setup();
    render(<EditListingPage />);

    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    await user.upload(fileInput, new File(["img"], "preview.png", { type: "image/png" }));

    await waitFor(() => expect(screen.getByAltText("Preview")).toBeInTheDocument());

    const removePending = screen.getAllByRole("button", { name: "Remove" }).find((btn) =>
      btn.closest("div")?.querySelector('img[alt="Preview"]')
    );

    expect(removePending).toBeDefined();
    await user.click(removePending as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  it("submits valid update payload and redirects", async () => {
    const user = userEvent.setup();
    let capturedBody = "";

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({ ok: true, json: async () => mockListing } as Response);
      }

      if (url.includes("/listings/listing-1") && options?.method === "PUT") {
        capturedBody = String(options.body || "");
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }

      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<EditListingPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    const title = screen.getByDisplayValue("Blue Jacket") as HTMLInputElement;
    await user.clear(title);
    await user.type(title, "  Updated Jacket  ");

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(capturedBody).toContain('"title":"Updated Jacket"');
      expect(mockPush).toHaveBeenCalledWith("/seller/manageListings");
    });
  });

  it("shows update API error message", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({ ok: true, json: async () => mockListing } as Response);
      }

      if (url.includes("/listings/listing-1") && options?.method === "PUT") {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: async () => "Failed to update listing",
        } as Response);
      }

      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<EditListingPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Save Changes/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to update listing")).toBeInTheDocument();
    });
  });

  it("validates brand, condition, size and colour branches", async () => {
    const user = userEvent.setup();
    const scenarios = [
      {
        field: "brand",
        message: "Please select a brand.",
        data: { ...mockListing, brand: "" },
      },
      {
        field: "condition",
        message: "Please select a condition.",
        data: { ...mockListing, condition: "" },
      },
      {
        field: "size",
        message: "Please select a size.",
        data: { ...mockListing, size: "" },
      },
      {
        field: "colour",
        message: "Please select a colour.",
        data: { ...mockListing, colour: "" },
      },
    ];

    for (const scenario of scenarios) {
      global.fetch = jest.fn((url: string) => {
        if (url.includes("/search/listing/listing-1")) {
          return Promise.resolve({ ok: true, json: async () => scenario.data } as Response);
        }
        return Promise.reject(new Error(`Unmocked URL: ${url}`));
      }) as jest.Mock;

      const { unmount } = render(<EditListingPage />);
      await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /Save Changes/i }));
      await waitFor(() => {
        expect(screen.getByText(scenario.message)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it("handles select onChange handlers for all enum fields", async () => {
    const user = userEvent.setup();
    render(<EditListingPage />);

    await waitFor(() => expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument());

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const categorySelect = selects[0];
    const brandSelect = selects[1];
    const conditionSelect = selects[2];
    const sizeSelect = selects[3];
    const colourSelect = selects[4];

    await user.selectOptions(categorySelect, categorySelect.options[1].value);
    await user.selectOptions(brandSelect, brandSelect.options[1].value);
    await user.selectOptions(conditionSelect, conditionSelect.options[1].value);
    await user.selectOptions(sizeSelect, sizeSelect.options[1].value);
    await user.selectOptions(colourSelect, colourSelect.options[1].value);

    expect(categorySelect.value).toBe(categorySelect.options[1].value);
    expect(brandSelect.value).toBe(brandSelect.options[1].value);
    expect(conditionSelect.value).toBe(conditionSelect.options[1].value);
    expect(sizeSelect.value).toBe(sizeSelect.options[1].value);
    expect(colourSelect.value).toBe(colourSelect.options[1].value);
  });

  it("handles missing token or missing listing id state", async () => {
    authToken = null;
    searchParamsValue = new URLSearchParams("");

    render(<EditListingPage />);

    await waitFor(() => {
      expect(screen.getByText("Loading listing...")).toBeInTheDocument();
    });
  });
});
