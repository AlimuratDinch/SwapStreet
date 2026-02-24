import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Sidebar } from "@/app/browse/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

// Mocking Next.js hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Portal so portal children render inline in the test DOM
jest.mock("@/app/browse/components/Portal", () => ({
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("Sidebar Component", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((key) => null), // Simulate no initial params
    });
  });

  it("toggles the Price Range visibility", () => {
    render(<Sidebar />);
    expect(screen.queryByText("Min")).not.toBeInTheDocument();

    const toggleButton = screen.getByText("Price Range");
    fireEvent.click(toggleButton);

    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("updates the URL when inputs change", () => {
    render(<Sidebar />);

    // Open price range
    fireEvent.click(screen.getByText("Price Range"));

    const minInput = screen.getByDisplayValue("0");
    fireEvent.change(minInput, { target: { value: "50" } });

    // Expecting router.replace to be called with updated params
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=50"),
      expect.any(Object),
    );
  });

  it("clears all filters when the Clear button is clicked", () => {
    render(<Sidebar />);
    const clearButton = screen.getByText("Clear");

    fireEvent.click(clearButton);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("minPrice=0&maxPrice=999999"),
      expect.any(Object),
    );
  });

  describe("Location button and modal", () => {
    it("renders the location filter button", () => {
      render(<Sidebar />);

      expect(screen.getByText("Location")).toBeInTheDocument();
    });

    it("opens and closes the modal when using geolocation", async () => {
      // Mock geolocation
      (global.navigator as any).geolocation = {
        getCurrentPosition: jest.fn((success: any) =>
          success({ coords: { latitude: 45.5017, longitude: -73.5673 } }),
        ),
      };

      render(<Sidebar />);

      const locationButton = screen.getByText("Location");
      fireEvent.click(locationButton);

      // Modal should open (Portal renders inline in tests)
      expect(screen.getByText("Change location")).toBeInTheDocument();

      const useLocationButton = screen.getByText("Use my current location");
      fireEvent.click(useLocationButton);

      await waitFor(() => {
        expect(screen.queryByText("Change location")).not.toBeInTheDocument();
      });
    });
  });
});
