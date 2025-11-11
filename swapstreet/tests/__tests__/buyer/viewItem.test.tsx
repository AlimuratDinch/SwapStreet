/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import View from "@/app/buyer/[id]/view/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe("View Page", () => {
  const mockItem = {
    imageUrl: "test-url",
    title: "White Shirt",
    description: "quality material",
    price: 9.99,
    condition: "Good",
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders item info when fetch succeeds with single image", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockItem),
      }),
    ) as jest.Mock;

    render(<View />);

    await waitFor(() => {
      expect(screen.getByText("White Shirt")).toBeInTheDocument();
    });

    expect(screen.getByText(/quality material/i)).toBeInTheDocument();
    expect(screen.getByText(/CAD \$9.99/)).toBeInTheDocument();
    expect(screen.getByText(/Condition:/)).toBeInTheDocument();

    // Buttons
    const buyButton = screen.getByText("Buy Now");
    const addButton = screen.getByText("Add to Changing Room");
    fireEvent.click(buyButton);
    fireEvent.click(addButton);

    // Profile section
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText(/Rating: 99.6/)).toBeInTheDocument();

    // Click Profile button
    const profileButton = screen
      .getAllByRole("button")
      .find((b) => b.innerHTML.includes("ChevronRight"));
    if (profileButton) fireEvent.click(profileButton);
  });

  it("renders item info when fetch succeeds with multiple images", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            ...mockItem,
            imageUrl: "img1,img2,img3",
          }),
      }),
    ) as jest.Mock;

    render(<View />);

    await waitFor(() => {
      expect(screen.getByText("White Shirt")).toBeInTheDocument();
    });

    // ImageView buttons for multiple images
    const buttons = screen.getAllByRole("button");
    const leftButton = buttons[0];
    const rightButton = buttons[1];

    // Navigate right twice and left once
    fireEvent.click(rightButton);
    fireEvent.click(rightButton);
    fireEvent.click(leftButton);

    // Check that an image is rendered (fallback src in ImageView)
    const images = screen.getAllByRole("img");
    expect(images[1]).toBeInTheDocument();
    expect(images[1]).toHaveAttribute("src", "/images/clothes_login_page.png");
  });

  it("renders error message for 500 response", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ status: 500 })) as jest.Mock;

    render(<View />);
    await waitFor(() => {
      expect(
        screen.getByText("Server error, cannot acquire article information."),
      ).toBeInTheDocument();
    });
  });

  it("renders error message for unknown status", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ status: 404 })) as jest.Mock;

    render(<View />);
    await waitFor(() => {
      expect(screen.getByText("Unknown item")).toBeInTheDocument();
    });
  });

  it("renders empty info if fetch rejects", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("Network error")),
    ) as jest.Mock;

    render(<View />);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders correctly when imageUrl is empty", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ ...mockItem, imageUrl: "" }),
      }),
    ) as jest.Mock;

    render(<View />);
    await waitFor(() => {
      expect(screen.getByText("White Shirt")).toBeInTheDocument();
    });

    // Should still render ImageView without crashing
    const images = screen.getAllByRole("img");
    expect(images[1]).toBeInTheDocument(); // The ImageView img
  });
});
