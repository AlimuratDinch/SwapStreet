import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import VerifyEmailPage from "@/app/auth/verify-email/page";

// Mock fetch globally
global.fetch = jest.fn();

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
  useSearchParams: () => ({
    get: jest.fn((param: string) => {
      if (param === "token") return "test-token-123";
      if (param === "email") return "test@example.com";
      return null;
    }),
  }),
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the logo", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(<VerifyEmailPage />);
    expect(screen.getByText("SWAP")).toBeInTheDocument();
    expect(screen.getByText("STREET")).toBeInTheDocument();
  });

  it("shows verifying state initially", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}), // keep verifying state
    );

    render(<VerifyEmailPage />);

    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please wait while we verify/i),
    ).toBeInTheDocument();
  });

  it("calls verification API with token and email", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/auth/verify-email",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            token: "test-token-123",
            email: "test@example.com",
          }),
        }),
      );
    });
  });

  it("shows success state and redirects on successful verification", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/your email has been successfully verified/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/redirecting you to sign in/i)).toBeInTheDocument();

    // trigger redirect
    jest.runAllTimers();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  it("shows error state on failed verification", async () => {
    const errorMsg = "Invalid verification token";
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: errorMsg }),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(errorMsg)).toBeInTheDocument();
    expect(
      screen.getByText(/the verification link may have expired or is invalid/i),
    ).toBeInTheDocument();
  });

  it("shows error and displays 'Go to Sign Up' button on verification failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "Verification failed" }),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /go to sign up/i }),
      ).toBeInTheDocument();
    });
  });

  it("navigates to sign-up when 'Go to Sign Up' button is clicked", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "Verification failed" }),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /go to sign up/i });
      button.click();
    });

    expect(pushMock).toHaveBeenCalledWith("/auth/sign-up");
  });

  it("shows error state when API call fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it("shows error state and 'Go to Sign Up' button is clickable", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "Token expired" }),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      const button = screen.getByRole("button", {
        name: /go to sign up/i,
      }) as HTMLButtonElement;
      expect(button).toBeInTheDocument();
      expect(button.disabled).toBe(false);
    });
  });

  it("verifies email and shows success with redirect message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      expect(screen.getByText(/successfully verified/i)).toBeInTheDocument();
    });

    // Verify redirect after 3s
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/auth/sign-in");
    });
  });

  it("handles JSON parsing error from response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
  });

  it("displays logo and error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "Test error" }),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText("SWAP")).toBeInTheDocument();
      expect(screen.getByText("STREET")).toBeInTheDocument();
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });
  });

  it("verifies email successfully and shows checkmark icon", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      // Verify success icon is displayed
      const greenBg = container.querySelector(".bg-green-100");
      expect(greenBg).toBeInTheDocument();
    });
  });

  it("shows error with X icon on failed verification", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "Verification error" }),
    } as unknown as Response);

    const { container } = render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      // Verify error icon is displayed
      const redBg = container.querySelector(".bg-red-100");
      expect(redBg).toBeInTheDocument();
    });
  });

  it("shows resend verification email button on error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ Error: "Token expired" }),
    } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /resend verification email/i }),
      ).toBeInTheDocument();
    });
  });

  it("resends verification email successfully", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ Error: "Token expired" }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByRole("button", {
      name: /resend verification email/i,
    });
    resendButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/auth/resend-verification",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
    });
  });

  it("shows loading state when resending email", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ Error: "Token expired" }),
      } as unknown as Response)
      .mockImplementationOnce(
        () => new Promise(() => {}), // keep loading state
      );

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByRole("button", {
      name: /resend verification email/i,
    });
    resendButton.click();

    await waitFor(() => {
      expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();
    });
  });

  it("handles resend email failure", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ Error: "Token expired" }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ Error: "Failed to send email" }),
      } as unknown as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByRole("button", {
      name: /resend verification email/i,
    });
    resendButton.click();

    await waitFor(() => {
      expect(screen.getByText(/failed to send email/i)).toBeInTheDocument();
    });
  });

  it("disables resend button while sending", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ Error: "Token expired" }),
      } as unknown as Response)
      .mockImplementationOnce(
        () => new Promise(() => {}), // keep loading state
      );

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByRole("button", {
      name: /resend verification email/i,
    }) as HTMLButtonElement;
    resendButton.click();

    await waitFor(() => {
      expect(resendButton.disabled).toBe(true);
    });
  });
});
