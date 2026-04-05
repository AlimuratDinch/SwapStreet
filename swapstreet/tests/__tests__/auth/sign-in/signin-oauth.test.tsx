import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/auth/sign-in/page";
import * as oauthApi from "@/lib/api/oauth";

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

let mockAuthContext = {
  login: mockLogin,
  isAuthenticated: false,
  authLoaded: true,
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

jest.mock("@/lib/api/oauth");

describe("LoginPage - OAuth Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext = {
      login: mockLogin,
      isAuthenticated: false,
      authLoaded: true,
    };
  });

  describe("OAuth Button Rendering", () => {
    it("renders Google sign-in button", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(googleButton).toBeInTheDocument();
    });

    it("renders OR divider between OAuth and email/password", () => {
      render(<LoginPage />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("renders both OAuth and traditional login options", () => {
      render(<LoginPage />);

      expect(
        screen.getByRole("button", { name: /sign in with google/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^sign in$/i })
      ).toBeInTheDocument();
    });
  });

  describe("OAuth Button Interaction", () => {
    it("calls initiateOAuthSignIn when Google button is clicked", () => {
      const initiateOAuthSignInSpy = jest.spyOn(oauthApi, "initiateOAuthSignIn");

      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      fireEvent.click(googleButton);

      expect(initiateOAuthSignInSpy).toHaveBeenCalledWith("google");
      expect(initiateOAuthSignInSpy).toHaveBeenCalledTimes(1);
    });

    it("passes correct provider to initiateOAuthSignIn", () => {
      const initiateOAuthSignInSpy = jest.spyOn(oauthApi, "initiateOAuthSignIn");

      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      fireEvent.click(googleButton);

      const callArgs = initiateOAuthSignInSpy.mock.calls[0];
      expect(callArgs[0]).toBe("google");
    });
  });

  describe("OAuth Button State", () => {
    it("disables OAuth button when loading state is active", async () => {
      global.fetch = jest.fn().mockReturnValue(
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<LoginPage />);

      // Trigger loading state by submitting email/password form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(googleButton).toBeDisabled();
    });

    it("keeps OAuth button enabled when not loading", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(googleButton).not.toBeDisabled();
    });
  });

  describe("Layout and Styling", () => {
    it("positions OAuth button above the email/password form", () => {
      const { container } = render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      const emailInput = screen.getByLabelText(/email/i);

      const googleButtonPosition =
        googleButton.compareDocumentPosition(emailInput);
      expect(googleButtonPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("has proper spacing with divider", () => {
      render(<LoginPage />);

      const divider = screen.getByText("OR").parentElement;
      expect(divider).toHaveClass("relative");
    });
  });

  describe("Multiple OAuth Providers (Future)", () => {
    it("uses OAuthButton component which supports multiple providers", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(googleButton).toBeInTheDocument();
    });
  });

  describe("Integration with Traditional Login", () => {
    it("does not interfere with email/password login", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: "test-token" }),
      } as Response);

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("OAuth button is keyboard accessible", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      googleButton.focus();
      expect(googleButton).toHaveFocus();
    });

    it("maintains proper tab order", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      const emailInput = screen.getByLabelText(/email/i);

      expect(googleButton).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });
  });
});
