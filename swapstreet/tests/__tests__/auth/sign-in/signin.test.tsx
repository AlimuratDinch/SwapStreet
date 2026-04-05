import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/auth/sign-in/page";

// --- Mocks ---

const loginMock = jest.fn();
const pushMock = jest.fn();
const replaceMock = jest.fn();

// We need a way to change these values per test
let mockAuthContext = {
  login: loginMock,
  isAuthenticated: false,
  authLoaded: true,
};

jest.mock("@/components/common/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default state: Page is loaded and user is not logged in (shows form)
    mockAuthContext = {
      login: loginMock,
      isAuthenticated: false,
      authLoaded: true,
    };
  });

  it("shows loading spinner when auth is not loaded", () => {
    mockAuthContext.authLoaded = false;
    render(<LoginPage />);
    expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("redirects automatically if already authenticated", () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.authLoaded = true;

    render(<LoginPage />);

    expect(replaceMock).toHaveBeenCalledWith("/browse");
  });

  it("renders login form correctly when loaded and unauthenticated", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  it("returns generic message for 400 status", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ status: 400 }),
    } as Response);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });

  it("stores access token and navigates using replace on successful login", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      // Note: We updated the code to use replace()
      expect(replaceMock).toHaveBeenCalledWith("/browse");
    });

    expect(loginMock).toHaveBeenCalledWith(mockToken);
  });

  it("disables button and shows 'Signing in...' during submission", async () => {
    // Create a promise that we can control to simulate a pending request
    let resolveFetch: (value: any) => void;
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password" },
    });

    const button = screen.getByRole("button", { name: /^sign in$/i });
    fireEvent.click(button);

    // Verify loading state
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/signing in/i);

    // Clean up the pending promise
    resolveFetch!({ ok: true, json: async () => ({ accessToken: "tok" }) });
  });

  it("handles network failure (fetch throws)", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "net@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });
});
