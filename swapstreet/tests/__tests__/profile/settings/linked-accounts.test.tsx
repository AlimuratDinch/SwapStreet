import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsPage from "@/app/profile/settings/page";
import * as oauthApi from "@/lib/api/oauth";

jest.mock("@/components/common/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockLogout = jest.fn();
const mockAccessToken = "test-access-token";

let mockAuthContext = {
  accessToken: mockAccessToken,
  logout: mockLogout,
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

jest.mock("@/lib/api/oauth");

describe("SettingsPage - Linked Accounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext = {
      accessToken: mockAccessToken,
      logout: mockLogout,
    };
  });

  describe("Linked Accounts Section", () => {
    it("renders Linked Accounts section", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /linked accounts/i }),
        ).toBeInTheDocument();
      });
    });

    it("shows loading state while fetching accounts", () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockReturnValue(
        new Promise(() => {}),
      );

      render(<SettingsPage />);

      expect(screen.getByText(/loading linked accounts/i)).toBeInTheDocument();
    });

    it("fetches linked accounts on mount", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(oauthApi.getLinkedAccounts).toHaveBeenCalledWith(
          mockAccessToken,
        );
      });
    });
  });

  describe("No Linked Accounts", () => {
    it("shows 'Link Account' button when Google not linked", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /link account/i }),
        ).toBeInTheDocument();
      });
    });

    it("calls initiateOAuthLink when Link Account button is clicked", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [],
      });
      const initiateOAuthLinkSpy = jest.spyOn(oauthApi, "initiateOAuthLink");

      render(<SettingsPage />);

      await waitFor(() => {
        const linkButton = screen.getByRole("button", {
          name: /link account/i,
        });
        fireEvent.click(linkButton);
      });

      expect(initiateOAuthLinkSpy).toHaveBeenCalledWith("google");
    });
  });

  describe("Google Account Linked", () => {
    const linkedAccount = {
      provider: "google" as const,
      email: "test@gmail.com",
      linkedAt: "2026-01-15T10:30:00Z",
    };

    it("shows unlink button when Google is linked", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /unlink/i }),
        ).toBeInTheDocument();
      });
    });

    it("displays linked account email", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("test@gmail.com")).toBeInTheDocument();
      });
    });

    it("does not show Link Account button when already linked", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /link account/i }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Unlink Account Modal", () => {
    const linkedAccount = {
      provider: "google" as const,
      email: "test@gmail.com",
      linkedAt: "2026-01-15T10:30:00Z",
    };

    it("opens unlink modal when Unlink button is clicked", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const unlinkButton = screen.getByRole("button", { name: /^unlink$/i });
        fireEvent.click(unlinkButton);
      });

      expect(
        screen.getByRole("heading", { name: /unlink google account/i }),
      ).toBeInTheDocument();
    });

    it("shows account email in unlink modal", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      const emails = screen.getAllByText(/test@gmail.com/i);
      expect(emails.length).toBeGreaterThan(0);
    });

    it("closes modal when Cancel button is clicked", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: /unlink google account/i }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Unlink Account Process", () => {
    const linkedAccount = {
      provider: "google" as const,
      email: "test@gmail.com",
      linkedAt: "2026-01-15T10:30:00Z",
    };

    it("calls unlinkAccount API when confirmed", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });
      (oauthApi.unlinkAccount as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      const unlinkConfirmButton = screen.getByRole("button", {
        name: /unlink account/i,
      });
      fireEvent.click(unlinkConfirmButton);

      await waitFor(() => {
        expect(oauthApi.unlinkAccount).toHaveBeenCalledWith(
          "google",
          mockAccessToken,
        );
      });
    });

    it("removes account from list after successful unlink", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });
      (oauthApi.unlinkAccount as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      fireEvent.click(screen.getByRole("button", { name: /unlink account/i }));

      await waitFor(() => {
        expect(screen.queryByText("test@gmail.com")).not.toBeInTheDocument();
      });
    });

    it("shows success message after unlinking", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });
      (oauthApi.unlinkAccount as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      fireEvent.click(screen.getByRole("button", { name: /unlink account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/successfully unlinked google account/i),
        ).toBeInTheDocument();
      });
    });

    it("shows loading state while unlinking", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });
      (oauthApi.unlinkAccount as jest.Mock).mockReturnValue(
        new Promise(() => {}),
      );

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      const unlinkButton = screen.getByRole("button", {
        name: /unlink account/i,
      });
      fireEvent.click(unlinkButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /unlinking/i }),
        ).toBeDisabled();
      });
    });

    it("shows error message if unlink fails", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });
      (oauthApi.unlinkAccount as jest.Mock).mockRejectedValueOnce(
        new Error("Cannot unlink only authentication method"),
      );

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      fireEvent.click(screen.getByRole("button", { name: /unlink account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/cannot unlink only authentication method/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error message when fetching accounts fails", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load linked accounts/i),
        ).toBeInTheDocument();
      });
    });

    it("handles generic unlink errors", async () => {
      const linkedAccount = {
        provider: "google" as const,
        email: "test@gmail.com",
        linkedAt: "2026-01-15T10:30:00Z",
      };

      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [linkedAccount],
      });
      (oauthApi.unlinkAccount as jest.Mock).mockRejectedValueOnce(
        "Generic error",
      );

      render(<SettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
      });

      fireEvent.click(screen.getByRole("button", { name: /unlink account/i }));

      await waitFor(
        () => {
          expect(
            screen.getByText(/failed to unlink account/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("UI Integration", () => {
    it("renders Linked Accounts section before Behavior section", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const linkedAccountsHeading = screen.getByRole("heading", {
          name: /linked accounts/i,
        });
        const behaviorHeading = screen.getByRole("heading", {
          name: /behavior/i,
        });

        const position =
          linkedAccountsHeading.compareDocumentPosition(behaviorHeading);
        expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });
    });

    it("maintains existing settings functionality", async () => {
      (oauthApi.getLinkedAccounts as jest.Mock).mockResolvedValueOnce({
        linkedAccounts: [],
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/sustainability tracking/i),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /delete account/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
