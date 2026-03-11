import { render, screen } from "@testing-library/react";
import { Header } from "../../../components/common/Header";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, authLoaded: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/contexts/ChatContext", () => ({
  useChatContext: () => ({ unread: {}, totalUnread: 0, markAsRead: jest.fn() }),
}));

// Mocking Next/Link because it requires a Router context
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
    expect(screen.getByText(/swap/i)).toBeInTheDocument();
    expect(screen.getByText(/street/i)).toBeInTheDocument();
  });

  it("renders action buttons (Wardrobe and Profile)", () => {
    render(<Header />);
    expect(screen.getByTitle("Wardrobe")).toBeInTheDocument();
    expect(screen.getByTitle("Profile")).toBeInTheDocument();
  });
});
