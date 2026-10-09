"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pin = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:34px;height:44px">
    <div style="position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0d9488;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35)"></div>
    <div style="position:absolute;left:12px;top:11px;width:10px;height:10px;border-radius:9999px;background:#fff"></div>
  </div>`,
  iconSize: [34, 44],
  iconAnchor: [17, 40],
});

// Pans to `view` whenever it changes (a search result, "my location", the city).
function FollowView({ view }) {
  const map = useMap();
  useEffect(() => {
    if (view) map.flyTo(view.center, view.zoom, { duration: 0.8 });
  }, [map, view]);
  return null;
}

function ClickToPin({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// The Leaflet half of LocationPicker — loaded client-only because Leaflet
// touches `window` at import time.
export default function LocationPickerMap({ position, view, onPick }) {
  const start = view || { center: [20, 0], zoom: 2 };
  return (
    <MapContainer center={start.center} zoom={start.zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FollowView view={view} />
      <ClickToPin onPick={onPick} />
      {position && (
        <Marker
          position={position}
          icon={pin}
          draggable
          eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onPick(p.lat, p.lng); } }}
        />
      )}
    </MapContainer>
  );
}
