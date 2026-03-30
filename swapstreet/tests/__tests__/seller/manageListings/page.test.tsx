import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ManageListingsPage from "@/app/seller/manageListings/page";

const mockPush = jest.fn();
let authToken: string | null = "test-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    accessToken: authToken,
    userId: "user-1",
    isAuthenticated: !!authToken,
  }),
}));

const mockProfile = {
  id: "profile-1",
  firstName: "John",
  lastName: "Doe",
};

const mockItems = [
  {
    id: "listing-1",
    title: "Blue Jacket",
    price: 29.99,
    images: [{ id: "img-1", imageUrl: "https://example.com/jacket.jpg" }],
  },
  {
    id: "listing-2",
    title: "Red Shoes",
    price: 49.99,
    images: [{ id: "img-2", imageUrl: "https://example.com/shoes.jpg" }],
  },
];

const setupDefaultFetch = () => {
  global.fetch = jest.fn((url: string, options?: RequestInit) => {
    if (url.includes("/profile/me")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockProfile,
      } as Response);
    }

    if (url.includes("/search/search")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: mockItems }),
      } as Response);
    }

    if (url.includes("/listings/") && options?.method === "DELETE") {
      return Promise.resolve({ ok: true, status: 204 } as Response);
    }

    return Promise.reject(new Error(`Unmocked URL: ${url}`));
  }) as jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockReset();
  authToken = "test-token";
  setupDefaultFetch();
});

describe("ManageListingsPage", () => {
  it("loads and shows listings", async () => {
    render(<ManageListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument();
      expect(screen.getByText("Red Shoes")).toBeInTheDocument();
      expect(screen.getByText("$29.99")).toBeInTheDocument();
      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });
  });

  it("shows loading state while requests are pending", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<ManageListingsPage />);

    expect(screen.getByText("Loading listings...")).toBeInTheDocument();
  });

  it("handles missing access token branch", async () => {
    authToken = null;
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;

    render(<ManageListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Loading listings...")).toBeInTheDocument();
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("shows profile fetch failure", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load profile")).toBeInTheDocument();
    });
  });

  it("shows listings API error message", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfile,
        } as Response);
      }
      if (url.includes("/search/search")) {
        return Promise.resolve({ ok: false, status: 503 } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("API error: 503")).toBeInTheDocument();
    });
  });

  it("shows empty state when no listings exist", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfile,
        } as Response);
      }
      if (url.includes("/search/search")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("No listings to manage")).toBeInTheDocument();
    });
  });

  it("navigates back to profile", async () => {
    const user = userEvent.setup();
    render(<ManageListingsPage />);

    await user.click(screen.getByRole("button", { name: /Back/i }));

    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("navigates to edit page", async () => {
    const user = userEvent.setup();
    render(<ManageListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument(),
    );

    const editButton = screen.getAllByTitle("Edit listing")[0];
    await user.click(editButton);

    expect(mockPush).toHaveBeenCalledWith("/seller/editListing?id=listing-1");
  });

  it("shows and cancels delete confirmation", async () => {
    const user = userEvent.setup();
    render(<ManageListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument(),
    );

    await user.click(screen.getAllByTitle("Delete listing")[0]);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Confirm Delete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("button", { name: /Confirm Delete/i }),
    ).not.toBeInTheDocument();
  });

  it("deletes listing successfully", async () => {
    const user = userEvent.setup();
    render(<ManageListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument(),
    );

    await user.click(screen.getAllByTitle("Delete listing")[0]);
    await user.click(screen.getByRole("button", { name: /Confirm Delete/i }));

    await waitFor(() => {
      expect(screen.queryByText("Blue Jacket")).not.toBeInTheDocument();
    });
  });

  it("handles delete error text response", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfile,
        } as Response);
      }
      if (url.includes("/search/search")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockItems }),
        } as Response);
      }
      if (url.includes("/listings/") && options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 403,
          text: async () => "Permission denied",
        } as Response);
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument(),
    );

    await user.click(screen.getAllByTitle("Delete listing")[0]);
    await user.click(screen.getByRole("button", { name: /Confirm Delete/i }));

    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });

  it("handles non-Error delete rejection branch", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfile,
        } as Response);
      }
      if (url.includes("/search/search")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockItems }),
        } as Response);
      }
      if (url.includes("/listings/") && options?.method === "DELETE") {
        return Promise.reject("fail");
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument(),
    );

    await user.click(screen.getAllByTitle("Delete listing")[0]);
    await user.click(screen.getByRole("button", { name: /Confirm Delete/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to delete listing")).toBeInTheDocument();
    });
  });

  it("shows deleting state while delete is in progress", async () => {
    const user = userEvent.setup();
    let resolveDelete: (() => void) | null = null;

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfile,
        } as Response);
      }
      if (url.includes("/search/search")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: mockItems }),
        } as Response);
      }
      if (url.includes("/listings/") && options?.method === "DELETE") {
        return new Promise((resolve) => {
          resolveDelete = () => resolve({ ok: true, status: 204 } as Response);
        });
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Jacket")).toBeInTheDocument(),
    );

    await user.click(screen.getAllByTitle("Delete listing")[0]);
    await user.click(screen.getByRole("button", { name: /Confirm Delete/i }));

    await waitFor(() => {
      const deletingBtn = screen.getByRole("button", { name: /Deleting.../i });
      expect(deletingBtn).toBeDisabled();
    });

    if (resolveDelete) {
      resolveDelete();
    }
  });

  it("renders listing without image branch", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/profile/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockProfile,
        } as Response);
      }
      if (url.includes("/search/search")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{ id: "a", title: "No Image", price: 9, images: [] }],
          }),
        } as Response);
      }
      return Promise.reject(new Error("Unmocked"));
    }) as jest.Mock;

    render(<ManageListingsPage />);

    await waitFor(() => {
      expect(screen.getByText("No Image")).toBeInTheDocument();
      expect(screen.getByText("$9")).toBeInTheDocument();
    });
  });
});
