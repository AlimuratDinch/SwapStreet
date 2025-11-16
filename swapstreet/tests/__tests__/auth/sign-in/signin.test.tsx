import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/sign-in/page";
import "@testing-library/jest-dom";

// Mock router for client component
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders the Login heading", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the Sign In button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders the Sign Up prompt", () => {
    render(<LoginPage />);
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/auth/sign-up"
    );
  });

  it("calls handleSubmit on successful form submit and stores access token", async () => {
    // Mock fetch success
    const mockToken = "abc123";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: mockToken }),
    } as Response);

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = emailInput.closest("form");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form!);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/browse"));

    // Check token stored in sessionStorage
    expect(sessionStorage.getItem("accessToken")).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("handles failed login and logs error", async () => {
    const errorMsg = "Login failed";

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock fetch failure
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => errorMsg,
    } as Response);

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = emailInput.closest("form");

    fireEvent.change(emailInput, { target: { value: "fail@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error:",
        expect.objectContaining({ message: errorMsg })
      );
    });

    consoleSpy.mockRestore();
  });
});
