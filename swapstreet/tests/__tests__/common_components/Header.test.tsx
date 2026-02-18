import { render, screen } from "@testing-library/react";
import { Header } from "../../../components/common/Header";

// Mocking Next/Link because it requires a Router context
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("Header Component", () => {
  it("renders the logo and brand name", () => {
    render(<Header />);
    // Use regex to find the substrings
    expect(screen.getByText(/swap/i)).toBeInTheDocument();
    expect(screen.getByText(/street/i)).toBeInTheDocument();
  });

  it("shows the center navigation by default", () => {
    render(<Header showCenterNav={true} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("Collections")).toBeInTheDocument();
  });

  it("hides the center navigation when showCenterNav is false", () => {
    render(<Header showCenterNav={false} />);
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("renders action buttons (Wardrobe and Profile)", () => {
    render(<Header />);
    const wardrobeLink = screen.getByTitle("Shopping Bag").closest("a");
    const profileLink = screen.getByTitle("Profile").closest("a");

    expect(wardrobeLink).toHaveAttribute("href", "/wardrobe");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });
});
