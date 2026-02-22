import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocationFilterModal } from "@/app/browse/components/LocationFilterModal";

describe("LocationFilterModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe("Rendering", () => {
    it("renders the modal with all elements", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      expect(screen.getByText("Change location")).toBeInTheDocument();
      expect(screen.getByText("Use my current location")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("H3Z")).toBeInTheDocument();
      expect(screen.getByText("Apply")).toBeInTheDocument();
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("renders the close button", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const closeButton = screen
        .getByRole("button", { name: "" })
        .parentElement?.querySelector("button");
      expect(closeButton).toBeInTheDocument();
    });

    it("displays radius value that updates with slider", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      expect(screen.getByText("20 km")).toBeInTheDocument();

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "50" } });

      expect(screen.getByText("50 km")).toBeInTheDocument();
    });
  });

  describe("FSA Input Validation", () => {
    it("normalizes FSA input to uppercase", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "h3z" } });

      expect(input).toHaveValue("H3Z");
    });

    it("removes spaces from FSA input", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "H 3 Z" } });

      expect(input).toHaveValue("H3Z");
    });

    it("limits FSA input to 3 characters", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "H3Z99" } });

      expect(input.value.length).toBeLessThanOrEqual(3);
    });

    it("shows validation error for invalid FSA format", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "ABC" } });

      expect(
        screen.getByText("Invalid postal code format"),
      ).toBeInTheDocument();
    });

    it("hides validation error when FSA becomes valid", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "ABC" } });
      expect(
        screen.getByText("Invalid postal code format"),
      ).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "H3Z" } });
      expect(
        screen.queryByText("Invalid postal code format"),
      ).not.toBeInTheDocument();
    });

    it("disables Apply button when FSA is invalid", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const applyButton = screen.getByText("Apply");
      expect(applyButton).toBeDisabled();

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "H3Z" } });

      expect(applyButton).not.toBeDisabled();
    });
  });

  describe("FSA Lookup", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it("calls API with correct FSA and applies location on success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            lat: 45.5017,
            lng: -73.5673,
            name: "Montreal",
          }),
      });

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "H3Z" } });

      const applyButton = screen.getByText("Apply");
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/location/lookup/H3Z"),
        );
      });

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalledWith({
          lat: 45.5017,
          lng: -73.5673,
          radiusKm: 20,
          name: "Montreal",
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("shows error message on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "H3Z" } });

      const applyButton = screen.getByText("Apply");
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(
          screen.getByText("Postal code not supported."),
        ).toBeInTheDocument();
      });
    });

    it("disables Apply button while loading", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      lat: 45.5017,
                      lng: -73.5673,
                      name: "Montreal",
                    }),
                }),
              100,
            ),
          ),
      );

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "H3Z" } });

      const applyButton = screen.getByText("Apply");
      fireEvent.click(applyButton);

      expect(screen.getByText("Searching...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Apply")).toBeInTheDocument();
      });
    });
  });

  describe("Geolocation", () => {
    beforeEach(() => {
      (global.navigator as any).geolocation = {
        getCurrentPosition: jest.fn(),
      } as any;
    });

    it("calls geolocation API when button is clicked", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const geoButton = screen.getByText("Use my current location");
      fireEvent.click(geoButton);

      expect(
        global.navigator.geolocation.getCurrentPosition,
      ).toHaveBeenCalled();
    });

    it("applies location from geolocation on success", async () => {
      const mockPosition = {
        coords: {
          latitude: 45.5017,
          longitude: -73.5673,
        },
      };

      (
        global.navigator.geolocation.getCurrentPosition as jest.Mock
      ).mockImplementationOnce((success) => success(mockPosition));

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const geoButton = screen.getByText("Use my current location");
      fireEvent.click(geoButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        lat: 45.502,
        lng: -73.567,
        radiusKm: 20,
        name: "Current location",
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("shows error when geolocation is not supported", () => {
      (global.navigator as any).geolocation = undefined as any;

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const geoButton = screen.getByText("Use my current location");
      fireEvent.click(geoButton);

      expect(
        screen.getByText("Geolocation not supported."),
      ).toBeInTheDocument();
    });

    it("handles geolocation errors", async () => {
      const mockGeoError = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: "Permission denied",
      };

      (
        global.navigator.geolocation.getCurrentPosition as jest.Mock
      ).mockImplementationOnce((success, error) => error(mockGeoError));

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const geoButton = screen.getByText("Use my current location");
      fireEvent.click(geoButton);

      expect(
        screen.getByText(
          "Permission denied. Please allow location access to use this.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Close Button", () => {
    it("calls onClose when X button is clicked", () => {
      const { container } = render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const closeButton = container.querySelector("button");
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Radius Slider", () => {
    it("updates radius value when slider changes", () => {
      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "75" } });

      expect(screen.getByText("75 km")).toBeInTheDocument();
    });

    it("applies location with updated radius", async () => {
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            lat: 45.5017,
            lng: -73.5673,
            name: "Montreal",
          }),
      });

      render(
        <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />,
      );

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "50" } });

      const input = screen.getByPlaceholderText("H3Z");
      fireEvent.change(input, { target: { value: "H3Z" } });

      const applyButton = screen.getByText("Apply");
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalledWith(
          expect.objectContaining({
            radiusKm: 50,
          }),
        );
      });
    });
  });
});
