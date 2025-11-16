import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationPage from "@/app/auth/sign-up/page";
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

describe("RegistrationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders the registration form fields and button", () => {
    render(<RegistrationPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows error if password is too short", async () => {
    render(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    const errorEl = await screen.findByText(/password must be at least 8 characters long/i);
    expect(errorEl).toBeInTheDocument();
  });

  it("shows error if passwords do not match", async () => {
    render(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password321" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    const errorEl = await screen.findByText(/passwords do not match/i);
    expect(errorEl).toBeInTheDocument();
  });

  it("submits successfully and navigates on success", async () => {
    const mockToken = "abc123";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: mockToken }),
    } as Response);

    render(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/seller/onboarding"));

    // Optionally verify token stored if your component does so
    expect(sessionStorage.getItem("accessToken")).toBe(mockToken);
  });

  it("shows error message on failed API call", async () => {
    const errorMsg = "Failed to create account";

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => errorMsg,
    } as Response);

    render(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "fail@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    const errorEl = await screen.findByText(errorMsg);
    expect(errorEl).toBeInTheDocument();
  });
});
