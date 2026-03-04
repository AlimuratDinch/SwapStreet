import { render, screen } from "@testing-library/react";
import { Header } from "../../../components/common/Header";

// Mocking Next/Link because it requires a Router context
// Mock Next.js Link with a named component to satisfy react/display-name
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;

  MockLink.displayName = "NextLink";
  return MockLink;
});

describe("Header Component", () => {
  it("renders the logo and brand name", () => {
    render(<Header />);
    // Use regex to find the substrings
    expect(screen.getByText(/swap/i)).toBeInTheDocument();
    expect(screen.getByText(/street/i)).toBeInTheDocument();
  });

  it("renders action buttons (Wardrobe and Profile)", () => {
    render(<Header />);
    const wardrobeLink = screen.getByTitle("Shopping Bag").closest("a");
    const profileLink = screen.getByTitle("Profile").closest("a");

    expect(wardrobeLink).toHaveAttribute("href", "/wardrobe");
    expect(profileLink).toHaveAttribute("href", "/profile");
  });
});
