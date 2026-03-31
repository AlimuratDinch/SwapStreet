import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EditListingPage from "@/app/seller/editListing/page";

const mockPush = jest.fn();
let searchParamsValue = new URLSearchParams("id=listing-1");
let authToken: string | null = "test-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
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

type FetchOptions = {
  listing?: typeof mockListing;
  listingOk?: boolean;
  putOk?: boolean;
  putText?: string;
  uploadOk?: boolean;
  uploadText?: string;
  onPut?: (options?: RequestInit) => void;
};

const stubFetch = ({
  listing = mockListing,
  listingOk = true,
  putOk = true,
  putText = "Failed to update listing",
  uploadOk = true,
  uploadText = "Image upload failed",
  onPut,
}: FetchOptions = {}) => {
  global.fetch = jest.fn((url: string, options?: RequestInit) => {
    if (url.includes("/search/listing/listing-1")) {
      return listingOk
        ? Promise.resolve({ ok: true, json: async () => listing } as Response)
        : Promise.resolve({ ok: false, status: 404 } as Response);
    }

    if (url.includes("/images/upload") && options?.method === "POST") {
      return uploadOk
        ? Promise.resolve({ ok: true, status: 200 } as Response)
        : Promise.resolve({
            ok: false,
            status: 400,
            text: async () => uploadText,
          } as Response);
    }

    if (
      url.includes("/listings/listing-1/images/") &&
      options?.method === "DELETE"
    ) {
      return Promise.resolve({ ok: true, status: 204 } as Response);
    }

    if (url.includes("/listings/listing-1") && options?.method === "PUT") {
      if (onPut) onPut(options);
      return putOk
        ? Promise.resolve({ ok: true, status: 204 } as Response)
        : Promise.resolve({
            ok: false,
            status: 500,
            text: async () => putText,
          } as Response);
    }

    return Promise.reject(new Error(`Unmocked URL: ${url}`));
  }) as jest.Mock;
};

const renderLoaded = async () => {
  render(<EditListingPage />);
  await waitFor(() =>
    expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument(),
  );
};

const clickSave = async (user = userEvent.setup()) => {
  await user.click(screen.getByRole("button", { name: /Save Changes/i }));
  return user;
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
  stubFetch();
});

describe("EditListingPage", () => {
  it("loads listing fields", async () => {
    await renderLoaded();
    expect(screen.getByDisplayValue("A nice blue jacket")).toBeInTheDocument();
    expect(screen.getByDisplayValue("29.99")).toBeInTheDocument();
  });

  it("shows load error when listing fetch fails", async () => {
    stubFetch({ listingOk: false });
    render(<EditListingPage />);
    await waitFor(() =>
      expect(screen.getByText("Could not load listing")).toBeInTheDocument(),
    );
  });

  it("navigates via Back and Cancel", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByText("Back"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockPush).toHaveBeenCalledWith("/seller/manageListings");
  });

  it("validates title, description, and price", async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const title = screen.getByDisplayValue("Blue Jacket") as HTMLInputElement;
    const description = screen.getByDisplayValue(
      "A nice blue jacket",
    ) as HTMLTextAreaElement;
    const price = screen.getByDisplayValue("29.99") as HTMLInputElement;

    await user.clear(title);
    await clickSave(user);
    await waitFor(() =>
      expect(screen.getByText("Please enter a title.")).toBeInTheDocument(),
    );

    await user.type(title, "Updated title");
    await user.clear(description);
    await clickSave(user);
    await waitFor(() =>
      expect(
        screen.getByText("Please enter a description."),
      ).toBeInTheDocument(),
    );

    await user.type(description, "Updated description");
    await user.clear(price);
    await user.type(price, "0");
    await clickSave(user);
    await waitFor(() =>
      expect(
        screen.getByText("Please enter a valid price."),
      ).toBeInTheDocument(),
    );
  });

  it("validates category first when enum fields are empty", async () => {
    const user = userEvent.setup();
    stubFetch({
      listing: {
        ...mockListing,
        category: "",
        brand: "",
        condition: "",
        size: "",
        colour: "",
      },
    });
    await renderLoaded();
    await clickSave(user);
    await waitFor(() =>
      expect(screen.getByText("Please select a category.")).toBeInTheDocument(),
    );
  });

  it("validates remaining enum branches", async () => {
    const user = userEvent.setup();
    const scenarios = [
      { key: "brand", message: "Please select a brand." },
      { key: "condition", message: "Please select a condition." },
      { key: "size", message: "Please select a size." },
      { key: "colour", message: "Please select a colour." },
    ] as const;

    for (const scenario of scenarios) {
      stubFetch({
        listing: { ...mockListing, [scenario.key]: "" } as typeof mockListing,
      });
      const { unmount } = render(<EditListingPage />);
      await waitFor(() =>
        expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument(),
      );
      await clickSave(user);
      await waitFor(() =>
        expect(screen.getByText(scenario.message)).toBeInTheDocument(),
      );
      unmount();
    }
  });

  it("validates image requirement after removing existing images", async () => {
    const user = userEvent.setup();
    await renderLoaded();

    let removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[0]);
    removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[0]);

    await clickSave(user);
    await waitFor(() =>
      expect(
        screen.getByText("Please keep at least one image or upload new ones."),
      ).toBeInTheDocument(),
    );
  });

  it("shows error when deleting existing image fails", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        } as Response);
      }

      if (
        url.includes("/listings/listing-1/images/") &&
        options?.method === "DELETE"
      ) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: async () => "Delete failed",
        } as Response);
      }

      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    await renderLoaded();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });

  it("shows missing-context error when auth token disappears before remove", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EditListingPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Blue Jacket")).toBeInTheDocument();
    });

    authToken = null;
    rerender(<EditListingPage />);

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to delete image: missing listing or authentication context.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("uploads pending image before PUT", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      calls.push(`${options?.method || "GET"}:${url}`);
      if (url.includes("/search/listing/listing-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockListing,
        } as Response);
      }
      if (url.includes("/images/upload") && options?.method === "POST") {
        return Promise.resolve({ ok: true, status: 200 } as Response);
      }
      if (url.includes("/listings/listing-1") && options?.method === "PUT") {
        return Promise.resolve({ ok: true, status: 204 } as Response);
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    await renderLoaded();
    const input = document.getElementById("image-upload") as HTMLInputElement;
    await user.upload(
      input,
      new File(["img"], "new.png", { type: "image/png" }),
    );
    await clickSave(user);

    await waitFor(() => {
      const uploadIndex = calls.findIndex(
        (c) => c.includes("POST:") && c.includes("/images/upload"),
      );
      const putIndex = calls.findIndex(
        (c) => c.includes("PUT:") && c.includes("/listings/listing-1"),
      );
      expect(uploadIndex).toBeGreaterThanOrEqual(0);
      expect(putIndex).toBeGreaterThan(uploadIndex);
    });
  });

  it("shows upload error and blocks submit continuation", async () => {
    const user = userEvent.setup();
    stubFetch({ uploadOk: false, uploadText: "Image upload failed" });
    await renderLoaded();

    const input = document.getElementById("image-upload") as HTMLInputElement;
    await user.upload(
      input,
      new File(["img"], "bad.png", { type: "image/png" }),
    );
    await clickSave(user);

    await waitFor(() =>
      expect(screen.getByText("Image upload failed")).toBeInTheDocument(),
    );
  });

  it("shows too-many-images error and revokes object URL", async () => {
    const user = userEvent.setup();
    stubFetch({
      listing: {
        ...mockListing,
        images: Array.from({ length: 5 }, (_, i) => ({
          id: `img-${i}`,
          imageUrl: `https://x/${i}.jpg`,
        })),
      },
    });

    await renderLoaded();
    const input = document.getElementById("image-upload") as HTMLInputElement;
    await user.upload(
      input,
      new File(["img"], "over.png", { type: "image/png" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("You can upload a maximum of 5 images total."),
      ).toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  it("removes pending image and revokes preview URL", async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const input = document.getElementById("image-upload") as HTMLInputElement;
    await user.upload(
      input,
      new File(["img"], "preview.png", { type: "image/png" }),
    );
    await waitFor(() =>
      expect(screen.getByAltText("Preview")).toBeInTheDocument(),
    );

    const removePending = screen
      .getAllByRole("button", { name: "Remove" })
      .find((btn) => btn.closest("div")?.querySelector('img[alt="Preview"]'));

    expect(removePending).toBeDefined();
    await user.click(removePending as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  it("submits valid payload and redirects", async () => {
    const user = userEvent.setup();
    let capturedBody = "";
    stubFetch({
      onPut: (options) => (capturedBody = String(options?.body || "")),
    });

    await renderLoaded();
    const title = screen.getByDisplayValue("Blue Jacket") as HTMLInputElement;
    await user.clear(title);
    await user.type(title, "  Updated Jacket  ");
    await clickSave(user);

    await waitFor(() => {
      expect(capturedBody).toContain('"title":"Updated Jacket"');
      expect(mockPush).toHaveBeenCalledWith("/seller/manageListings");
    });
  });

  it("shows update API error message", async () => {
    const user = userEvent.setup();
    stubFetch({ putOk: false, putText: "Failed to update listing" });
    await renderLoaded();
    await clickSave(user);
    await waitFor(() =>
      expect(screen.getByText("Failed to update listing")).toBeInTheDocument(),
    );
  });

  it("updates all select controls on change", async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    for (const select of selects) {
      await user.selectOptions(select, select.options[1].value);
      expect(select.value).toBe(select.options[1].value);
    }
  });

  it("stays in loading state when token/id are missing", async () => {
    authToken = null;
    searchParamsValue = new URLSearchParams("");
    render(<EditListingPage />);
    await waitFor(() =>
      expect(screen.getByText("Loading listing...")).toBeInTheDocument(),
    );
  });
});
