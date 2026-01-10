import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocationFilterModal } from "@/app/browse/LocationFilterModal";

describe("LocationFilterModal", () => {
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes FSA input", () => {
    render(
      <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />
    );

    const input = screen.getByPlaceholderText("H3Z");
    fireEvent.change(input, { target: { value: "h3 z" } });

    expect(input).toHaveValue("H3Z");
  });

  it("disables Apply button for invalid FSA", () => {
    render(
      <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />
    );

    const input = screen.getByPlaceholderText("H3Z");
    fireEvent.change(input, { target: { value: "123" } });

    const applyBtn = screen.getByRole("button", { name: /Apply/i });
    expect(applyBtn).toBeDisabled();
  });

  it("calls API and applies location for valid FSA", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lat: 45.5,
        lng: -73.6,
      }),
    });

    render(
      <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />
    );

    fireEvent.change(screen.getByPlaceholderText("H3Z"), {
      target: { value: "H3Z" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Apply/i }));

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith({
        lat: 45.5,
        lng: -73.6,
        radiusKm: 20,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error when postal code not supported", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(
      <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />
    );

    fireEvent.change(screen.getByPlaceholderText("H3Z"), {
      target: { value: "H3Z" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Apply/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Postal code not supported/i)
      ).toBeInTheDocument();
    });
  });

  it("uses browser geolocation when clicking Use my current location", async () => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: 40,
            longitude: -70,
          },
        })
      ),
    };

    // @ts-ignore
    global.navigator.geolocation = mockGeolocation;

    render(
      <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />
    );

    fireEvent.click(
      screen.getByText(/Use my current location/i)
    );

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith({
        lat: 40,
        lng: -70,
        radiusKm: 20,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("updates radius from slider", () => {
    render(
      <LocationFilterModal onClose={mockOnClose} onApply={mockOnApply} />
    );

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(screen.getByText("50 km")).toBeInTheDocument();
  });
});
