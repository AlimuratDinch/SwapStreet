import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegistrationPage from "@/app/auth/sign-up/page";
import { AuthProvider } from "@/contexts/AuthContext";
import "@testing-library/jest-dom";

// FIXED LOGGER MOCK (no hoisting issue)
jest.mock("@/components/common/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from "@/components/common/logger";

// Mock router
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("RegistrationPage — branch coverage booster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    renderWithAuth(<RegistrationPage />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("does not call API if password too short", () => {
    global.fetch = jest.fn();

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "short" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not call API if passwords mismatch", () => {
    global.fetch = jest.fn();

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "u@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password321" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses fallback API url branch", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "fallback error",
    } as Response);

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await screen.findByText(/fallback error/i);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/auth/register",
      expect.any(Object),
    );
  });

  it("handles ok=false with empty text branch", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      text: async () => "",
    } as Response);

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/failed to create account/i),
    ).toBeInTheDocument();
  });

  it("success branch → modal + logger.info", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    expect(logger.info).toHaveBeenCalled();
  });

  it("network error branch", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalled();
  });

  it("unknown thrown error branch", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce("string failure");

    renderWithAuth(<RegistrationPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/failed to create account. please try again/i),
    ).toBeInTheDocument();

    expect(logger.error).toHaveBeenCalled();
  });
});
