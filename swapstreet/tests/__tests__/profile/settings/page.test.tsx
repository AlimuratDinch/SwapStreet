import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/profile/settings/page";
import "@testing-library/jest-dom";

// Mocks
const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "mock-token",
  }),
}));

jest.mock("@/components/common/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page correctly", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Manage your preferences")).toBeInTheDocument();
    expect(screen.getByText("Behavior")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Delete Account" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Delete Account" }),
    ).toBeInTheDocument();
  });

  it("toggles sustainability tracking", () => {
    render(<SettingsPage />);

    const toggleButton = screen.getAllByRole("button")[0];

    // Initially ON (teal)
    expect(toggleButton.className).toContain("bg-teal-500");

    fireEvent.click(toggleButton);

    // After click -> OFF (gray)
    expect(toggleButton.className).toContain("bg-gray-300");
  });

  it("calls delete API and redirects on success", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      } as Response),
    );

    render(<SettingsPage />);

    const deleteButton = screen.getByRole("button", { name: "Delete Account" });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/deleteUser"),
        expect.objectContaining({
          method: "DELETE",
          headers: {
            Authorization: "Bearer mock-token",
          },
        }),
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("handles delete failure gracefully", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve("Delete failed"),
      } as Response),
    );

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("renders header component", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });
});
