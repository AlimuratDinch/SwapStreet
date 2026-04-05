import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import OAuthCallbackPage from "@/app/auth/callback/page";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("@/components/common/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogin = jest.fn();

let mockSearchParams = new Map<string, string>();
let mockAuthContext = {
  login: mockLogin,
  isAuthenticated: false,
  authLoaded: true,
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

describe("OAuthCallbackPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSearchParams = new Map<string, string>();
    mockAuthContext = {
      login: mockLogin,
      isAuthenticated: false,
      authLoaded: true,
    };

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key) || null,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Loading States", () => {
    it("shows loading spinner when auth is not loaded", () => {
      mockAuthContext.authLoaded = false;

      render(<OAuthCallbackPage />);

      expect(
        screen.getByText(/completing authentication/i)
      ).toBeInTheDocument();
    });

    it("shows loading state initially", async () => {
      mockSearchParams.set("accessToken", "test-token");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe("Successful Authentication", () => {
    it("logs in user with access token from URL", async () => {
      mockSearchParams.set("accessToken", "test-jwt-token");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test-jwt-token");
      });
    });

    it("redirects to browse page after successful login", async () => {
      mockSearchParams.set("accessToken", "test-jwt-token");

      render(<OAuthCallbackPage />);

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/browse");
      });
    });

    it("redirects immediately if already authenticated", () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.authLoaded = true;

      render(<OAuthCallbackPage />);

      expect(mockReplace).toHaveBeenCalledWith("/browse");
    });
  });

  describe("Error Handling", () => {
    it("shows error message when error param is present", async () => {
      mockSearchParams.set("error", "access_denied");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /authentication failed/i })
        ).toBeInTheDocument();
        expect(screen.getByText(/access_denied/i)).toBeInTheDocument();
      });
    });

    it("shows error description when provided", async () => {
      mockSearchParams.set("error", "access_denied");
      mockSearchParams.set("error_description", "User denied access");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText(/user denied access/i)).toBeInTheDocument();
      });
    });

    it("prioritizes error_description over error code", async () => {
      mockSearchParams.set("error", "some_error");
      mockSearchParams.set(
        "error_description",
        "A more helpful error message"
      );

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/a more helpful error message/i)
        ).toBeInTheDocument();
      });
    });

    it("shows generic error when both accessToken and error are missing", async () => {
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid authentication response/i)
        ).toBeInTheDocument();
      });
    });

    it("shows error when login throws exception", async () => {
      mockSearchParams.set("accessToken", "test-token");
      mockLogin.mockImplementationOnce(() => {
        throw new Error("Login failed");
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to complete authentication/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Screen Actions", () => {
    it("has 'Back to Sign In' button that navigates to sign-in page", async () => {
      mockSearchParams.set("error", "access_denied");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /back to sign in/i,
        });
        expect(button).toBeInTheDocument();

        button.click();
        expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
      });
    });

    it("has 'Go to Home' button that navigates to home page", async () => {
      mockSearchParams.set("error", "access_denied");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /go to home/i });
        expect(button).toBeInTheDocument();

        button.click();
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Visual Elements", () => {
    it("shows error icon when authentication fails", async () => {
      mockSearchParams.set("error", "access_denied");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        const errorHeading = screen.getByRole("heading", {
          name: /authentication failed/i,
        });
        expect(errorHeading).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty error parameter", async () => {
      mockSearchParams.set("error", "");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid authentication response/i)
        ).toBeInTheDocument();
      });
    });

    it("handles empty accessToken parameter", async () => {
      mockSearchParams.set("accessToken", "");

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid authentication response/i)
        ).toBeInTheDocument();
      });
    });

    it("does not process when auth is still loading", () => {
      mockAuthContext.authLoaded = false;
      mockSearchParams.set("accessToken", "test-token");

      render(<OAuthCallbackPage />);

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
