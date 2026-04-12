import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GoogleButton from "@/components/auth/GoogleButton";

describe("GoogleButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with correct text", () => {
    render(<GoogleButton text="Sign in with Google" onClick={mockOnClick} />);

    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("renders Google logo SVG", () => {
    const { container } = render(
      <GoogleButton text="Sign in with Google" onClick={mockOnClick} />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("calls onClick handler when clicked", () => {
    render(<GoogleButton text="Sign in with Google" onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("has type='button' to prevent form submission", () => {
    render(<GoogleButton text="Sign in with Google" onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("has correct CSS classes for Google styling", () => {
    render(<GoogleButton text="Sign in with Google" onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white");
    expect(button).toHaveClass("hover:bg-gray-50");
    expect(button).toHaveClass("border-gray-300");
    expect(button).toHaveClass("text-gray-700");
  });

  it("renders custom text correctly", () => {
    render(<GoogleButton text="Continue with Google" onClick={mockOnClick} />);

    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("is keyboard accessible", () => {
    render(<GoogleButton text="Sign in with Google" onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    button.focus();
    expect(button).toHaveFocus();
  });
});
