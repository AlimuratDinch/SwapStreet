import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import OAuthButton from "@/components/auth/OAuthButton";

describe("OAuthButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Google Provider", () => {
    it("renders Google sign-in button with correct text", () => {
      render(
        <OAuthButton
          provider="google"
          variant="signin"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    });

    it("renders Google sign-up button with correct text", () => {
      render(
        <OAuthButton
          provider="google"
          variant="signup"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
    });

    it("renders Google link button with correct text", () => {
      render(
        <OAuthButton provider="google" variant="link" onClick={mockOnClick} />
      );

      expect(screen.getByText("Link Google account")).toBeInTheDocument();
    });

    it("renders Google button with default variant when not specified", () => {
      render(<OAuthButton provider="google" onClick={mockOnClick} />);

      expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    });

    it("calls onClick handler when clicked", () => {
      render(
        <OAuthButton provider="google" onClick={mockOnClick} variant="signin" />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when disabled prop is true", () => {
      render(
        <OAuthButton
          provider="google"
          onClick={mockOnClick}
          disabled={true}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("does not call onClick when disabled and clicked", () => {
      render(
        <OAuthButton
          provider="google"
          onClick={mockOnClick}
          disabled={true}
        />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("has correct CSS classes for Google styling", () => {
      render(<OAuthButton provider="google" onClick={mockOnClick} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-white");
      expect(button).toHaveClass("hover:bg-gray-50");
      expect(button).toHaveClass("text-gray-700");
      expect(button).toHaveClass("border-gray-300");
    });
  });

  describe("Facebook Provider", () => {
    it("renders Facebook sign-in button with correct text", () => {
      render(
        <OAuthButton
          provider="facebook"
          variant="signin"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText("Sign in with Facebook")).toBeInTheDocument();
    });

    it("renders Facebook sign-up button with correct text", () => {
      render(
        <OAuthButton
          provider="facebook"
          variant="signup"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText("Sign up with Facebook")).toBeInTheDocument();
    });

    it("renders Facebook link button with correct text", () => {
      render(
        <OAuthButton
          provider="facebook"
          variant="link"
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText("Link Facebook account")).toBeInTheDocument();
    });

    it("has correct CSS classes for Facebook styling", () => {
      render(<OAuthButton provider="facebook" onClick={mockOnClick} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-[#1877F2]");
      expect(button).toHaveClass("text-white");
    });
  });

  describe("Apple Provider", () => {
    it("renders Apple sign-in button with correct text", () => {
      render(
        <OAuthButton provider="apple" variant="signin" onClick={mockOnClick} />
      );

      expect(screen.getByText("Sign in with Apple")).toBeInTheDocument();
    });

    it("renders Apple sign-up button with correct text", () => {
      render(
        <OAuthButton provider="apple" variant="signup" onClick={mockOnClick} />
      );

      expect(screen.getByText("Sign up with Apple")).toBeInTheDocument();
    });

    it("renders Apple link button with correct text", () => {
      render(
        <OAuthButton provider="apple" variant="link" onClick={mockOnClick} />
      );

      expect(screen.getByText("Link Apple account")).toBeInTheDocument();
    });

    it("has correct CSS classes for Apple styling", () => {
      render(<OAuthButton provider="apple" onClick={mockOnClick} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-black");
      expect(button).toHaveClass("text-white");
    });
  });

  describe("Button type", () => {
    it("has type='button' to prevent form submission", () => {
      render(<OAuthButton provider="google" onClick={mockOnClick} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Accessibility", () => {
    it("button is keyboard accessible", () => {
      render(<OAuthButton provider="google" onClick={mockOnClick} />);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
