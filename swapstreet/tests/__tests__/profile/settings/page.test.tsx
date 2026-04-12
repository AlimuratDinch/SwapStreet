import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import SettingsPage from "@/app/profile/settings/page";
import "@testing-library/jest-dom";

const mockLogout = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: () => ({ accessToken: jest.fn(), logout: mockLogout }),
}));

describe("Settings Page", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders all menu options", () => {
    act(() => {
      render(<SettingsPage />);
    });

    const labels = ["Settings", "Delete Account"];

    for (const label of labels) {
      const elementData = screen.getAllByText(label);
      /*There is a `Delete Account` button and label.*/

      expect(elementData.filter(() => true).length).toBeGreaterThan(0);

      for (const element of elementData) expect(element).toBeInTheDocument();
    }
  });

  it("can delete the user's account", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true } as unknown as Response);

    act(() => {
      render(<SettingsPage />);
    });

    const deleteAccount = screen.getByRole("button", {
      name: "Delete Account",
    });
    expect(deleteAccount).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(deleteAccount);
    });

    const deleteConfirmationInput = screen.getByLabelText(
      "Type DELETE to confirm",
    );

    await act(async () => {
      fireEvent.change(deleteConfirmationInput, {
        target: { value: "DELETE" },
      });
    });

    const confirmDeleteButton = screen.getByRole("button", {
      name: "Delete permanently",
    });

    await act(async () => {
      fireEvent.click(confirmDeleteButton);
    });

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it("displays an error when account deletion fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("Server Error"),
    } as unknown as Response);
    global.alert = jest.fn();

    act(() => {
      render(<SettingsPage />);
    });

    const deleteAccount = screen.getByRole("button", {
      name: "Delete Account",
    });

    await act(async () => {
      fireEvent.click(deleteAccount);
    });

    const deleteConfirmationInput = screen.getByLabelText(
      "Type DELETE to confirm",
    );

    await act(async () => {
      fireEvent.change(deleteConfirmationInput, {
        target: { value: "DELETE" },
      });
    });

    const confirmDeleteButton = screen.getByRole("button", {
      name: "Delete permanently",
    });

    await act(async () => {
      fireEvent.click(confirmDeleteButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledTimes(1);
    });
  });
});
