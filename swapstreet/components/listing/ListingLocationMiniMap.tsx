"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const sellerMarkerIcon = L.icon({
  iconRetinaUrl:
    typeof markerIcon2x === "string" ? markerIcon2x : markerIcon2x.src,
  iconUrl: typeof markerIcon === "string" ? markerIcon : markerIcon.src,
  shadowUrl: typeof markerShadow === "string" ? markerShadow : markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type ListingLocationMiniMapProps = {
  lat: number;
  lng: number;
  className?: string;
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function ListingLocationMiniMap({
  lat,
  lng,
  className = "",
}: ListingLocationMiniMapProps) {
  const position: L.LatLngExpression = [lat, lng];

  return (
    <div
      className={`relative w-full h-[200px] rounded-lg overflow-hidden border border-gray-300 ${className}`}
      data-testid="listing-mini-map"
    >
      <MapContainer
        center={position}
        zoom={12}
        className="size-full z-0"
        scrollWheelZoom={false}
        dragging
        doubleClickZoom={false}
        attributionControl
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={sellerMarkerIcon} />
      </MapContainer>
    </div>
  );
}
