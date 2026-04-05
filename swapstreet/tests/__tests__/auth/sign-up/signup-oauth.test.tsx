import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegistrationPage from "@/app/auth/sign-up/page";
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

let mockAuthContext = {
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

describe("RegistrationPage - OAuth Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext = {
      isAuthenticated: false,
      authLoaded: true,
    };
  });

  describe("OAuth Button Rendering", () => {
    it("renders Google sign-up button", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      expect(googleButton).toBeInTheDocument();
    });

    it("renders OR divider between OAuth and email/password", () => {
      render(<RegistrationPage />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("renders both OAuth and traditional registration options", () => {
      render(<RegistrationPage />);

      expect(
        screen.getByRole("button", { name: /sign up with google/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    });
  });

  describe("OAuth Button Interaction", () => {
    it("calls initiateOAuthSignIn with signup=true when Google button is clicked", () => {
      const initiateOAuthSignInSpy = jest.spyOn(
        oauthApi,
        "initiateOAuthSignIn",
      );

      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      fireEvent.click(googleButton);

      expect(initiateOAuthSignInSpy).toHaveBeenCalledWith("google", true);
      expect(initiateOAuthSignInSpy).toHaveBeenCalledTimes(1);
    });

    it("passes signup=true to indicate new user registration", () => {
      const initiateOAuthSignInSpy = jest.spyOn(
        oauthApi,
        "initiateOAuthSignIn",
      );

      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      fireEvent.click(googleButton);

      const callArgs = initiateOAuthSignInSpy.mock.calls[0];
      expect(callArgs[0]).toBe("google");
      expect(callArgs[1]).toBe(true);
    });
  });

  describe("OAuth Button State", () => {
    it("disables OAuth button when loading state is active", async () => {
      global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

      render(<RegistrationPage />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText(/^email$/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(
        screen.getByRole("checkbox", {
          name: /i agree to the use of cookies/i,
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      expect(googleButton).toBeDisabled();
    });

    it("keeps OAuth button enabled when not loading", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      expect(googleButton).not.toBeDisabled();
    });
  });

  describe("Layout and Styling", () => {
    it("positions OAuth button above the registration form", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      const usernameInput = screen.getByLabelText(/username/i);

      const googleButtonPosition =
        googleButton.compareDocumentPosition(usernameInput);
      expect(
        googleButtonPosition & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("has proper spacing with divider", () => {
      render(<RegistrationPage />);

      const divider = screen.getByText("OR").parentElement;
      expect(divider).toHaveClass("relative");
    });
  });

  describe("Integration with Traditional Registration", () => {
    it("does not interfere with email/password registration", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      render(<RegistrationPage />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText(/^email$/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(
        screen.getByRole("checkbox", {
          name: /i agree to the use of cookies/i,
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("Cookie Consent with OAuth", () => {
    it("OAuth signup also requires cookie consent via backend", () => {
      render(<RegistrationPage />);

      const cookieConsent = screen.getByRole("checkbox", {
        name: /i agree to the use of cookies/i,
      });
      expect(cookieConsent).toBeInTheDocument();
    });
  });

  describe("User Experience", () => {
    it("provides clear visual separation between OAuth and traditional signup", () => {
      render(<RegistrationPage />);

      const divider = screen.getByText("OR");
      expect(divider).toBeInTheDocument();
      expect(divider.parentElement).toHaveClass("relative");
    });

    it("shows appropriate button text for signup context", () => {
      render(<RegistrationPage />);

      expect(
        screen.getByRole("button", { name: /sign up with google/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /sign in with google/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("OAuth button is keyboard accessible", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      googleButton.focus();
      expect(googleButton).toHaveFocus();
    });

    it("maintains proper tab order", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      const usernameInput = screen.getByLabelText(/username/i);

      expect(googleButton).toBeInTheDocument();
      expect(usernameInput).toBeInTheDocument();
    });
  });

  describe("Redirect Behavior", () => {
    it("redirects authenticated users to browse", () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.authLoaded = true;

      render(<RegistrationPage />);

      expect(mockReplace).toHaveBeenCalledWith("/browse");
    });
  });
});
