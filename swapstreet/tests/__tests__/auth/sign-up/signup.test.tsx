import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationPage from "@/app/auth/sign-up/page";
import { AuthProvider } from "@/contexts/AuthContext";
import "@testing-library/jest-dom";

// Mock logger
jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock router for client component
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Helper to render with AuthProvider
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("RegistrationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the registration form fields and button", () => {
    renderWithAuth(<RegistrationPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("shows error if password is too short", () => {
    renderWithAuth(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(
      screen.getByText(/password must be at least 8 characters long/i),
    ).toBeInTheDocument();
  });

  it("shows error if passwords do not match", () => {
    renderWithAuth(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("submits successfully and navigates on success", async () => {
    const mockResponse = { accessToken: "abc123" }; // <-- must match component
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    renderWithAuth(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/seller/onboarding");
    });
  });

  it("shows error message on failed API call", async () => {
    const errorMsg = "Failed to create account";
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => errorMsg,
    } as Response);

    renderWithAuth(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    const errorEl = await screen.findByText(errorMsg);
    expect(errorEl).toBeInTheDocument();
  });

  it("shows error if response does not contain accessToken", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // missing accessToken
    } as Response);

    renderWithAuth(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    const errorEl = await screen.findByText(
      /access token not returned from backend/i,
    );
    expect(errorEl).toBeInTheDocument();
  });

  it("shows error on network failure during registration", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    renderWithAuth(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    const errorEl = await screen.findByText(/network error/i);
    expect(errorEl).toBeInTheDocument();
  });
});
