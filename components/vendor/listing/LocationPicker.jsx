"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Search, Navigation, X, Loader2, MapPin, MousePointerClick } from "lucide-react";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand-100" />,
});

const round = (n) => Number(n).toFixed(6);

async function geocode(params) {
  const res = await fetch(`/api/geocode?${new URLSearchParams(params)}`);
  const data = await res.json().catch(() => ({}));
  return res.ok ? data.results || [] : [];
}

// Map pin picker for the seller wizard: search a place or tap the map and
// the coordinates fill themselves — sellers never type latitude/longitude.
// The pin is optional; "Remove pin" leaves both blank. Uses OpenStreetMap
// (free, no API key) through /api/geocode.
//
// onChange({ latitude, longitude }) — strings, or "" when cleared.
// onPlace(parts) — address parts of the picked spot, to pre-fill blank fields.
export default function LocationPicker({ latitude, longitude, city, onChange, onPlace }) {
  const hasPin = latitude !== "" && longitude !== "" && latitude != null && longitude != null;
  const position = hasPin ? [Number(latitude), Number(longitude)] : null;

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(hasPin ? { center: position, zoom: 16 } : null);
  const [placeName, setPlaceName] = useState("");
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const boxRef = useRef(null);

  // With no pin yet, start the map on the listing's city.
  useEffect(() => {
    if (hasPin || !city) return;
    let cancelled = false;
    geocode({ q: city }).then(([hit]) => {
      if (!cancelled && hit) setView({ center: [hit.latitude, hit.longitude], zoom: 12 });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // Search as you type (debounced; Nominatim asks for light traffic).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const found = await geocode({ q: city && !term.toLowerCase().includes(city.toLowerCase()) ? `${term}, ${city}` : term });
      // Fall back to the raw text when adding the city finds nothing.
      setResults(found.length || !city ? found : await geocode({ q: term }));
      setSearching(false);
      setOpen(true);
    }, 450);
    return () => clearTimeout(t);
  }, [q, city]);

  useEffect(() => {
    const close = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function place(lat, lng, name) {
    onChange({ latitude: round(lat), longitude: round(lng) });
    setPlaceName(name || "");
    setMessage("");
  }

  function choose(r) {
    place(r.latitude, r.longitude, r.displayName);
    setView({ center: [r.latitude, r.longitude], zoom: 17 });
    setQ("");
    setResults([]);
    setOpen(false);
    onPlace?.({ ...r.parts, city: r.cityLabel });
  }

  // Tapped or dragged on the map: keep the exact spot, then look up what's there.
  async function pickOnMap(lat, lng) {
    place(lat, lng, "");
    const [hit] = await geocode({ lat: round(lat), lon: round(lng) });
    if (hit) {
      setPlaceName(hit.displayName);
      onPlace?.({ ...hit.parts, city: hit.cityLabel });
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setMessage("Your browser can't share its location.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setView({ center: [pos.coords.latitude, pos.coords.longitude], zoom: 17 });
        pickOnMap(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setMessage("Couldn't get your location. Allow location access, or search instead.");
      }
    );
  }

  function clearPin() {
    onChange({ latitude: "", longitude: "" });
    setPlaceName("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <div className="flex items-center rounded-xl bg-sand-50 ring-1 ring-navy-900/10 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500">
            <Search size={16} className="ml-4 shrink-0 text-navy-800/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); if (results[0]) choose(results[0]); }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search building, street or area…"
              className="bare w-full bg-transparent px-3 py-3 text-[15px] text-navy-900 placeholder:text-navy-800/35 focus:outline-none"
              aria-label="Search for the property's location"
            />
            {searching && <Loader2 size={16} className="mr-4 shrink-0 animate-spin text-navy-800/40" />}
          </div>
          {open && q.trim().length >= 3 && !searching && (
            <ul className="absolute inset-x-0 top-full z-[1000] mt-1.5 overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-navy-900/10">
              {results.length === 0 ? (
                <li className="px-4 py-3 text-sm text-navy-800/55">No matches. Try a nearby landmark, or tap the map instead.</li>
              ) : (
                results.map((r, i) => (
                  <li key={`${r.latitude},${r.longitude},${i}`}>
                    <button
                      type="button"
                      onClick={() => choose(r)}
                      className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-sand-50"
                    >
                      <MapPin size={15} className="mt-0.5 shrink-0 text-teal-600" />
                      <span className="line-clamp-2 text-navy-900">{r.displayName}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/15 hover:ring-teal-500"
        >
          {locating ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} className="text-teal-600" />}
          I&apos;m at the property
        </button>
      </div>

      {/* isolate: keeps Leaflet's internal z-indexes (400–1000) from covering the wizard's sticky bar */}
      <div className="relative isolate h-72 overflow-hidden rounded-2xl ring-1 ring-navy-900/10 md:h-80">
        <LocationPickerMap position={position} view={view} onPick={pickOnMap} />
        {!hasPin && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] flex justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-navy-900/85 px-3.5 py-1.5 text-xs font-semibold text-white shadow-card backdrop-blur">
              <MousePointerClick size={13} /> Tap the map to drop a pin
            </span>
          </div>
        )}
      </div>

      {hasPin ? (
        <div className="flex items-start gap-3 rounded-xl bg-teal-500/10 px-4 py-3 ring-1 ring-teal-500/20">
          <MapPin size={16} className="mt-0.5 shrink-0 text-teal-600" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-navy-900">Pin placed. Drag it to fine-tune.</div>
            <div className="truncate text-navy-800/60" title={placeName}>{placeName || `${latitude}, ${longitude}`}</div>
          </div>
          <button type="button" onClick={clearPin} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-navy-800/60 hover:bg-white hover:text-coral-600">
            <X size={13} /> Remove pin
          </button>
        </div>
      ) : (
        <p className="text-xs text-navy-800/50">Optional. You can skip this; listings with a pin also show up in map search.</p>
      )}
      {message && <p className="text-xs font-medium text-coral-600">{message}</p>}
    </div>
  );
}
