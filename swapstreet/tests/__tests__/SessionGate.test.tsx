import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SessionGate from "@/components/auth/SessionGate";

// --- Mocks ---
let mockAuthLoaded = false;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    authLoaded: mockAuthLoaded,
  }),
}));

describe("SessionGate", () => {
  const MockChild = () => <div data-testid="app-content">Main Application</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a loading spinner and hides children when authLoaded is false", () => {
    mockAuthLoaded = false;

    render(
      <SessionGate>
        <MockChild />
      </SessionGate>,
    );

    // Now it works because role="status" exists in the component
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();

    // Verify children are NOT rendered
    expect(screen.queryByTestId("app-content")).not.toBeInTheDocument();
  });

  it("renders children and hides spinner when authLoaded is true", () => {
    mockAuthLoaded = true;

    render(
      <SessionGate>
        <MockChild />
      </SessionGate>,
    );

    // Verify the main app content is now visible
    expect(screen.getByTestId("app-content")).toBeInTheDocument();

    // queryByRole returns null instead of throwing an error, which is perfect for "not in doc" checks
    const spinner = screen.queryByRole("status");
    expect(spinner).not.toBeInTheDocument();
  });
});
