import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegistrationPage from "@/app/auth/sign-up/page";

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

describe("RegistrationPage - Google Button Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext = {
      isAuthenticated: false,
      authLoaded: true,
    };
  });

  describe("Google Button Rendering", () => {
    it("renders Google button at the bottom", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      expect(googleButton).toBeInTheDocument();
    });

    it("renders OR divider before Google button", () => {
      render(<RegistrationPage />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("positions Google button after the sign-in link", () => {
      const { container } = render(<RegistrationPage />);

      const signInLink = screen.getByText(/already have an account/i);
      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });

      const position = signInLink.compareDocumentPosition(googleButton);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("Google Button Interaction", () => {
    it("redirects to browse page when Google button is clicked", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      fireEvent.click(googleButton);

      expect(mockPush).toHaveBeenCalledWith("/browse");
    });

    it("does not require form validation for Google signup", () => {
      render(<RegistrationPage />);

      const googleButton = screen.getByRole("button", {
        name: /sign up with google/i,
      });
      fireEvent.click(googleButton);

      expect(mockPush).toHaveBeenCalledWith("/browse");
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

    it("has separate button for traditional signup", () => {
      render(<RegistrationPage />);

      expect(
        screen.getByRole("button", { name: /^sign up$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign up with google/i }),
      ).toBeInTheDocument();
    });
  });
});
