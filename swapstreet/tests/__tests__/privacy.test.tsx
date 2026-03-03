import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "@/app/privacy/page";
import "@testing-library/jest-dom";

describe("Privacy Policy Page", () => {
  it("renders page successfully", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("renders SWAPSTREET logo", () => {
    render(<PrivacyPolicy />);
    const logos = screen.getAllByText(
      (_, el) => el?.textContent === "SWAPSTREET",
    );
    expect(logos.length).toBeGreaterThan(0);
  });

  it("logo links back to landing page", () => {
    render(<PrivacyPolicy />);
    const logoLinks = screen.getAllByRole("link", { name: /SWAP STREET/i });
    expect(logoLinks[0]).toHaveAttribute("href", "/");
  });

  it("renders privacy image", () => {
    render(<PrivacyPolicy />);
    const img = screen.getByAltText("Privacy Policy");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/privacy.svg");
  });
});
