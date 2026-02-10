import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/auth/sign-in/page";

// Mock logger
jest.mock("@/components/common/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock sessionStorage
beforeAll(() => {
  Object.defineProperty(window, "sessionStorage", {
    value: {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] || null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
    },
    writable: true,
  });
});

describe("LoginPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    window.sessionStorage.clear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("renders login form correctly", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  // --- API_URL Logic Tests ---

  it("uses NEXT_PUBLIC_API_URL when it is defined", async () => {
    const customUrl = "https://api.swapstreet.ca";
    process.env.NEXT_PUBLIC_API_URL = customUrl;

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: "abc123" }),
    } as Response);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      // Verifies the custom URL was used
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringStartingWith(customUrl),
        expect.any(Object),
      );
    });
  });

  it("falls back to http://localhost/api when NEXT_PUBLIC_API_URL is undefined", async () => {
    // Explicitly remove the env variable to test the fallback branch
    delete process.env.NEXT_PUBLIC_API_URL;
    const fallbackUrl = "http://localhost/api";

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: "abc123" }),
    } as Response);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      // Verifies the fallback URL was used
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringStartingWith(fallbackUrl),
        expect.any(Object),
      );
    });
  });

  // --- Existing Logic Tests ---

  it("stores access token and navigates on successful login", async () => {
    const mockToken = "abc123";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: mockToken }),
    } as Response);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/browse");
    });

    expect(window.sessionStorage.getItem("accessToken")).toBe(mockToken);
  });

  it("shows error message when login fails", async () => {
    const errorMsg = "Login failed";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => errorMsg,
    } as Response);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(errorMsg)).toBeInTheDocument();
  });
});
