import { render, screen } from "@testing-library/react";
import { CreateListingFAB } from "../../../../app/browse/components/CreateListingFAB";

// Mock Next.js Link to simplify testing navigation logic
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("CreateListingFAB Component", () => {
  it("renders the button with the correct accessibility label", () => {
    render(<CreateListingFAB />);

    // We search by the aria-label you provided in the component
    const button = screen.getByRole("button", { name: /create listing/i });
    expect(button).toBeInTheDocument();
  });

  it("links to the correct seller creation page", () => {
    render(<CreateListingFAB />);

    // Find the link wrapping the button and check its destination
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/seller/createListing");
  });

  it("contains the Plus icon", () => {
    const { container } = render(<CreateListingFAB />);

    // Lucide icons render as SVG tags
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("lucide-plus");
  });

  it("has the fixed positioning classes for the layout", () => {
    render(<CreateListingFAB />);

    // The wrapper div should have the fixed positioning classes
    const wrapper = screen.getByRole("link").parentElement;
    expect(wrapper).toHaveClass("fixed", "bottom-6", "right-6");
  });
});
