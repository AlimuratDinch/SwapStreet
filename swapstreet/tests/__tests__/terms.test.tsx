import { render, screen } from "@testing-library/react";
import TermsOfService from "@/app/terms/page";
import "@testing-library/jest-dom";

describe("Terms of Service Page", () => {
  it("renders page successfully", () => {
    render(<TermsOfService />);
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("renders SWAPSTREET logo", () => {
    render(<TermsOfService />);
    const logos = screen.getAllByText(
      (_, el) => el?.textContent === "SWAPSTREET",
    );
    expect(logos.length).toBeGreaterThan(0);
  });

  it("logo links back to landing page", () => {
    render(<TermsOfService />);
    const logoLinks = screen.getAllByRole("link", { name: /SWAP STREET/i });
    expect(logoLinks[0]).toHaveAttribute("href", "/");
  });

  it("renders terms image", () => {
    render(<TermsOfService />);
    const img = screen.getByAltText("Terms of Service");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/terms.svg");
  });
});
