"use client";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationPage from "@/app/auth/sign-up/page";
import "@testing-library/jest-dom";

// --- Mocks ---
const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from "@/components/common/logger";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

let mockAuthContext = {
  isAuthenticated: false,
  authLoaded: true,
};

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

describe("RegistrationPage", () => {
  beforeEach(() => {
    // CRITICAL: Initialize fetch as a mock before every test
    global.fetch = jest.fn();
    jest.clearAllMocks();
    mockAuthContext = {
      isAuthenticated: false,
      authLoaded: true,
    };
  });

  it("shows loading spinner when auth check is pending", () => {
    mockAuthContext.authLoaded = false;
    render(<RegistrationPage />);
    expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
  });

  it("redirects to browse if user is already logged in", () => {
    mockAuthContext.isAuthenticated = true;
    render(<RegistrationPage />);
    expect(replaceMock).toHaveBeenCalledWith("/browse");
  });

  it("shows error if cookie agreement is not checked", async () => {
    render(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/you must agree to the cookie policy/i),
    ).toBeInTheDocument();
    // This will now pass because fetch is initialized in beforeEach
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows error from json.error field on failed signup", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => JSON.stringify({ error: "Email already in use" }),
    });

    render(<RegistrationPage />);

    // Fill EVERY field including username
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "TestUser" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "taken@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByLabelText(/i agree to the use of cookies/i));
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/email already in use/i),
    ).toBeInTheDocument();
  });

  it("disables button and shows 'Creating Account...' during submission", async () => {
    // 1. Mock fetch to return a promise that NEVER resolves (simulates a long request)
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    render(<RegistrationPage />);

    // 2. FILL OUT EVERY REQUIRED FIELD
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "TestUser" },
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

    // 3. AGREE TO COOKIES
    fireEvent.click(screen.getByLabelText(/i agree to the use of cookies/i));

    // 4. CLICK SUBMIT
    const button = screen.getByRole("button", { name: /sign up/i });
    fireEvent.click(button);

    // 5. ASSERTIONS
    // Use waitFor because state updates are asynchronous
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    expect(button).toHaveTextContent(/creating account/i);
  });
});
