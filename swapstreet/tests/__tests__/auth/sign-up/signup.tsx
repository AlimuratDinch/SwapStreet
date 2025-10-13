import { render, screen, fireEvent } from "@testing-library/react";
import RegistrationPage from "@/app/auth/sign-up/page";
import "@testing-library/jest-dom";

// Mock router for client component
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("RegistrationPage", () => {
  it("renders the registration form fields and button", () => {
    render(<RegistrationPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
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
      screen.getByText(/password must be at least 8 characters long/i),
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
