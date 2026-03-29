/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { ListingLocationMiniMap } from "@/components/listing/ListingLocationMiniMap";

jest.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children?: React.ReactNode;
    center: [number, number];
    zoom?: number;
  }) => (
    <div
      data-testid="mock-map-container"
      data-center-lat={center[0]}
      data-center-lng={center[1]}
      data-zoom={zoom}
    >
      {children}
    </div>
  ),
  TileLayer: ({ attribution, url }: { attribution?: string; url?: string }) => (
    <div
      data-testid="mock-tile-layer"
      data-url={url}
      data-attribution={attribution}
    />
  ),
  Marker: ({ position }: { position: [number, number] }) => (
    <div
      data-testid="mock-marker"
      data-lat={position[0]}
      data-lng={position[1]}
    />
  ),
}));

jest.mock("leaflet", () => ({
  __esModule: true,
  default: {
    icon: jest.fn(() => ({})),
  },
}));

jest.mock("leaflet/dist/leaflet.css", () => ({}));

jest.mock("leaflet/dist/images/marker-icon-2x.png", () => "icon-2x.png");
jest.mock("leaflet/dist/images/marker-icon.png", () => "icon.png");
jest.mock("leaflet/dist/images/marker-shadow.png", () => "shadow.png");

describe("ListingLocationMiniMap", () => {
  it("renders map shell with OpenStreetMap tile URL and attribution", () => {
    render(<ListingLocationMiniMap lat={43.6532} lng={-79.3832} />);

    expect(screen.getByTestId("listing-mini-map")).toBeInTheDocument();

    const map = screen.getByTestId("mock-map-container");
    expect(map).toHaveAttribute("data-center-lat", "43.6532");
    expect(map).toHaveAttribute("data-center-lng", "-79.3832");
    expect(map).toHaveAttribute("data-zoom", "12");

    const tiles = screen.getByTestId("mock-tile-layer");
    expect(tiles.getAttribute("data-url")).toContain("openstreetmap.org");
    expect(tiles.getAttribute("data-attribution")).toContain("OpenStreetMap");
  });

  it("places marker at the given coordinates", () => {
    render(<ListingLocationMiniMap lat={45.5017} lng={-73.5673} />);

    const marker = screen.getByTestId("mock-marker");
    expect(marker).toHaveAttribute("data-lat", "45.5017");
    expect(marker).toHaveAttribute("data-lng", "-73.5673");
  });
});
