import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/auth/sign-in/page";

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

describe("LoginPage - Google Button Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext = {
      login: mockLogin,
      isAuthenticated: false,
      authLoaded: true,
    };
  });

  describe("Google Button Rendering", () => {
    it("renders Google button at the bottom", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /continue with google/i,
      });
      expect(googleButton).toBeInTheDocument();
    });

    it("renders OR divider before Google button", () => {
      render(<LoginPage />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("positions Google button after the sign-up link", () => {
      const { container } = render(<LoginPage />);

      const signUpLink = screen.getByText(/don't have an account/i);
      const googleButton = screen.getByRole("button", {
        name: /continue with google/i,
      });

      const position = signUpLink.compareDocumentPosition(googleButton);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("Google Button Interaction", () => {
    it("redirects to browse page when Google button is clicked", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /continue with google/i,
      });
      fireEvent.click(googleButton);

      expect(mockPush).toHaveBeenCalledWith("/browse");
    });

    it("does not call login function when Google button is clicked", () => {
      render(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /continue with google/i,
      });
      fireEvent.click(googleButton);

      expect(mockLogin).not.toHaveBeenCalled();
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

    it("has separate button for traditional login", () => {
      render(<LoginPage />);

      expect(
        screen.getByRole("button", { name: /^sign in$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /continue with google/i })
      ).toBeInTheDocument();
    });
  });
});
