"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

function pinIcon() {
  const size = 34;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#0d9488;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function PropertyMiniMapInner({ coords, title, image, price, slug }) {
  return (
    <MapContainer center={coords} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={coords} icon={pinIcon()}>
        <Popup>
          <div className="w-44">
            {image && <img src={image} alt={title} className="mb-2 h-24 w-full rounded-md object-cover" />}
            <div className="font-semibold text-navy-900">{title}</div>
            {price && <div className="text-sm text-teal-600">{price}</div>}
            {slug && (
              <Link href={`/properties/${slug}`} className="mt-2 block text-center text-xs font-semibold text-teal-600 hover:underline">
                View details →
              </Link>
            )}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
