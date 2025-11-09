/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import View from "@/app/buyer/[id]/view/page"; 

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe("View Page", () => {
  beforeEach(() => {
    const mockData = {
      imageUrl: "test-url",
      title: "White Shirt",
      description: "quality material",
      price: 9.99,
      condition: "Good",
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve(mockData),
      }),
    ) as jest.Mock;
  });

  it("renders item information after fetch", async () => {
    render(<View />);

    // Wait for async fetch to resolve and component to update
    await waitFor(() => {
      expect(screen.getByText("White Shirt")).toBeInTheDocument();
    });

    expect(screen.getByText(/quality material/i)).toBeInTheDocument();
    expect(screen.getByText(/CAD \$9.99/)).toBeInTheDocument();
    expect(screen.getByText(/Condition:/)).toBeInTheDocument();
  });
});
