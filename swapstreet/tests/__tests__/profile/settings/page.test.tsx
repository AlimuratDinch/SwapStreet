import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/profile/settings/page";
import "@testing-library/jest-dom";
import React from "react";

const mockLogout = jest.fn();

jest.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  useAuth: () => ({ accessToken: jest.fn(), logout: mockLogout }),
}));

describe("Settings Page", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders all menu options", () => {
    render(<SettingsPage />);

    const labels = ["Settings", "Sustainability Tracking", "Delete Account"];

    for (const label of labels) {
      const elementData = screen.getAllByText(label);
      /*There is a `Delete Account` button and label.*/

      expect(elementData.filter(() => true).length).toBeGreaterThan(0);

      for (const element of elementData) expect(element).toBeInTheDocument();
    }
  });

  it("can delete the user's account", async () => {
    global.fetch = jest.fn((url) => {
      return Promise.resolve({
        ok: true,
      });
    });

    render(<SettingsPage />);

    const deleteAccount = screen.getByRole("button", {
      name: "Delete Account",
    });
    expect(deleteAccount).toBeInTheDocument();
    await fireEvent.click(deleteAccount);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("displays an error when account deletion fails", async () => {
    global.fetch = jest.fn((url) => {
      return Promise.resolve({
        ok: false,
        text: () => Promise.resolve("Server Error"),
      });
    });
    global.alert = jest.fn();

    render(<SettingsPage />);

    const deleteAccount = screen.getByRole("button", {
      name: "Delete Account",
    });
    fireEvent.click(deleteAccount);
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledTimes(1);
    });
  });

  it("toggles the sustainability tracking feature", async () => {
    const setter = jest.fn();

    React.useState = jest.fn((value) => {
      return [true, setter];
    });
    let result = render(<SettingsPage />);
    let buttonData = result.getAllByRole("button");
    let candidateData = buttonData.filter(
      (b) => b.id === "toggleSustainabilityTracking",
    );
    expect(candidateData.filter(() => true)).toHaveLength(1);
    let toggle = candidateData[0];
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(setter).toHaveBeenCalledTimes(1);
    });

    React.useState = jest.fn((value) => {
      return [false, setter];
    });
    result = render(<SettingsPage />);
    buttonData = result.getAllByRole("button");
    candidateData = buttonData.filter(
      (b) => b.id === "toggleSustainabilityTracking",
    );
    toggle = candidateData[0];
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(setter).toHaveBeenCalledTimes(2);
    });
  });
});
