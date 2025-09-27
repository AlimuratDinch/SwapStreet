// tests/__tests__/page.test.tsx
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import "@testing-library/jest-dom";

describe("Home Page", () => {
  it("renders the welcome heading", () => {
    render(<Home />);
    expect(
      screen.getByText(
        (content, element) => element?.textContent === "Welcome to SwapStreet!",
      ),
    ).toBeInTheDocument();
  });

  it("renders a login button with correct link", () => {
    render(<Home />);
    const loginButton = screen.getByRole("button", { name: /login/i });
    expect(loginButton).toBeInTheDocument();

    const link = loginButton.closest("a");
    expect(link).toHaveAttribute("href", "/sign-in");
  });
});
