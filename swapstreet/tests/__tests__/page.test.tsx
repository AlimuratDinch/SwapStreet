// tests/__tests__/page.test.tsx
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import "@testing-library/jest-dom";

describe("Home Page", () => {
  it("renders the welcome heading", () => {
    render(<Home />);
    expect(
      screen.getByText(
        (content, element) =>
          element?.textContent === "The Marketplace forEndless Outfits",
      ),
    ).toBeInTheDocument();
  });

  it("renders a login link with correct href", () => {
    render(<Home />);
    const loginLink = screen.getByRole("link", { name: /login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/auth/sign-in");
  });
});
