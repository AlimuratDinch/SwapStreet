import { render, screen, fireEvent } from "@testing-library/react";
import RegistrationPage from "@/app/(auth)/sign-up/page";
import "@testing-library/jest-dom";

describe("RegistrationPage", () => {
  it("renders the Register heading", () => {
    render(<RegistrationPage />);
    expect(
      screen.getByRole("heading", { name: /register/i }),
    ).toBeInTheDocument();
  });

  it("renders all input fields", () => {
    render(<RegistrationPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("renders the Sign Up button", () => {
    render(<RegistrationPage />);
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("renders the Sign In prompt", () => {
    render(<RegistrationPage />);
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("shows error if password is too short", () => {
    render(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it("shows error if passwords do not match", () => {
    render(<RegistrationPage />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });
});
