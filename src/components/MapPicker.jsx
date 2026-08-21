import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker icon paths are built for a plain <img src="..."> —
// under Vite they resolve to nothing, so the marker silently fails to render
// unless the URLs are re-pointed to the bundled, hashed asset URLs.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [33.5138, 36.2765]; // Damascus — arbitrary fallback, not tied to any real clinic

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ latitude, longitude, onChange }) {
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : null,
  );

  function handlePick(lat, lng) {
    setPosition([lat, lng]);
    onChange(lat, lng);
  }

  return (
    <div className="signup-map-picker">
      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={position ? 15 : 8}
        style={{ height: 260, width: "100%", borderRadius: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={handlePick} />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
}
