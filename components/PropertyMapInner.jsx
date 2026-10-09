"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BedDouble, Bath, Ruler, MapPin as MapPinIcon } from "lucide-react";
import { usePropertiesFeed } from "@/lib/usePropertiesFeed";
import { propertyCoords } from "@/lib/geo";

function pinIcon(active) {
  const size = active ? 34 : 26;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${
      active ? "#0d9488" : "#0b1b33"
    };border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 12);
    else if (points.length > 1) map.fitBounds(points, { padding: [48, 48] });
  }, [points, map]);
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 0.6 });
  }, [position, map]);
  return null;
}

export default function PropertyMapInner() {
  const { properties, loading } = usePropertiesFeed();
  const [activeSlug, setActiveSlug] = useState(null);

  const pinned = useMemo(
    () => properties.map((p) => ({ property: p, coords: propertyCoords(p) })).filter((x) => x.coords),
    [properties]
  );
  const unpinnedCount = properties.length - pinned.length;
  const points = useMemo(() => pinned.map((x) => x.coords), [pinned]);
  const active = pinned.find((x) => x.property.slug === activeSlug);

  return (
    <section className="bg-sand-50 py-10">
      <div className="container-page">
        <div className="flex items-center justify-between py-4 text-sm text-navy-800/55">
          <span>
            {loading
              ? "Loading properties…"
              : `${pinned.length} ${pinned.length === 1 ? "property" : "properties"} on the map`}
            {!loading && unpinnedCount > 0 ? ` · ${unpinnedCount} without a mapped location` : ""}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
          <div className="card-surface order-2 max-h-[420px] overflow-y-auto lg:order-1 lg:max-h-[560px]">
            {pinned.map(({ property }) => (
              <button
                key={property.slug}
                type="button"
                onMouseEnter={() => setActiveSlug(property.slug)}
                onClick={() => setActiveSlug(property.slug)}
                className={`flex w-full gap-3 border-b border-navy-900/8 p-3 text-left transition-colors last:border-0 ${
                  activeSlug === property.slug ? "bg-teal-500/10" : "hover:bg-sand-100"
                }`}
              >
                <img src={property.image} alt={property.title} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="truncate font-display text-[15px] text-navy-900">{property.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-navy-800/55">
                    <MapPinIcon size={12} /> {property.city}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-teal-600">{property.price}</div>
                </div>
              </button>
            ))}
            {!loading && pinned.length === 0 && (
              <div className="p-6 text-center text-sm text-navy-800/55">No mapped properties yet.</div>
            )}
          </div>

          <div className="order-1 h-[420px] overflow-hidden rounded-xl2 shadow-soft ring-1 ring-navy-900/5 lg:order-2 lg:h-[560px]">
            <MapContainer center={[30, 10]} zoom={2} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={points} />
              {active && <FlyTo position={active.coords} />}
              {pinned.map(({ property, coords }) => (
                <Marker
                  key={property.slug}
                  position={coords}
                  icon={pinIcon(property.slug === activeSlug)}
                  eventHandlers={{ click: () => setActiveSlug(property.slug) }}
                >
                  <Popup>
                    <div className="w-44">
                      <img src={property.image} alt={property.title} className="mb-2 h-24 w-full rounded-md object-cover" />
                      <div className="font-semibold text-navy-900">{property.title}</div>
                      <div className="text-sm text-teal-600">{property.price}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-navy-800/60">
                        <span className="flex items-center gap-1"><BedDouble size={12} /> {property.bedrooms ?? 0}</span>
                        <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms ?? 0}</span>
                        <span className="flex items-center gap-1"><Ruler size={12} /> {property.area}</span>
                      </div>
                      <Link href={`/properties/${property.slug}`} className="mt-2 block text-center text-xs font-semibold text-teal-600 hover:underline">
                        View details →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
