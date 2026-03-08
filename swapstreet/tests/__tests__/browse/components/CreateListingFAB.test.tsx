import { render, screen, fireEvent } from "@testing-library/react";
import { CreateListingFAB } from "@/app/browse/components/CreateListingFAB";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockAuthState = { isAuthenticated: true, authLoaded: true };
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

describe("CreateListingFAB Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { isAuthenticated: true, authLoaded: true };
  });

  it("renders the button with the correct accessibility label", () => {
    render(<CreateListingFAB />);
    const button = screen.getByRole("button", { name: /create listing/i });
    expect(button).toBeInTheDocument();
  });

  it("navigates to the correct seller creation page when authenticated", () => {
    render(<CreateListingFAB />);
    fireEvent.click(screen.getByRole("button", { name: /create listing/i }));
    expect(mockPush).toHaveBeenCalledWith("/seller/createListing");
  });

  it("contains the Plus icon", () => {
    const { container } = render(<CreateListingFAB />);
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("lucide-plus");
  });

  it("has the fixed positioning classes for the layout", () => {
    const { container } = render(<CreateListingFAB />);
    const wrapper = container.querySelector(".fixed.bottom-6.right-6");
    expect(wrapper).toBeInTheDocument();
  });

  it("redirects to sign-in when unauthenticated (authLoaded=true, isAuthenticated=false)", () => {
    mockAuthState = { isAuthenticated: false, authLoaded: true };
    render(<CreateListingFAB />);
    fireEvent.click(screen.getByRole("button", { name: /create listing/i }));
    expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("navigates to createListing when authLoaded is false (guard not triggered)", () => {
    mockAuthState = { isAuthenticated: false, authLoaded: false };
    render(<CreateListingFAB />);
    fireEvent.click(screen.getByRole("button", { name: /create listing/i }));
    expect(mockPush).toHaveBeenCalledWith("/seller/createListing");
  });
});
