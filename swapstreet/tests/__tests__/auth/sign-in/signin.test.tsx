import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/auth/sign-in/page";
import "@testing-library/jest-dom";

// Mock router for client component
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("renders the Sign Up prompt", () => {
    render(<LoginPage />);
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/auth/sign-up",
    );
  });

  it("calls handleSubmit on successful form submit", async () => {
    // Mock fetch success
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "abc123" }),
    } as Response);

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const form = emailInput.closest("form");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form!);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/browse"));
    expect(global.fetch).toHaveBeenCalled();
  });

  it("shows error message on failed login", async () => {
    // Mock fetch failure
    const errorMsg = "Login failed";
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
  });
});
