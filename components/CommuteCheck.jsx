"use client";

import { useState } from "react";
import { Navigation, Car, TrainFront, Footprints } from "lucide-react";

const MODES = [
  { key: "driving", label: "Drive", Icon: Car },
  { key: "transit", label: "Transit", Icon: TrainFront },
  { key: "walking", label: "Walk", Icon: Footprints },
];

// "How far is it from my office?" — opens Google Maps directions from this
// property to whatever place the visitor types, in the travel mode they pick.
export default function CommuteCheck({ origin }) {
  const [place, setPlace] = useState("");
  const [mode, setMode] = useState("driving");

  function check(e) {
    e.preventDefault();
    if (!place.trim()) return;
    const params = new URLSearchParams({ api: "1", origin, destination: place.trim(), travelmode: mode });
    window.open(`https://www.google.com/maps/dir/?${params}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={check} className="rounded-xl2 bg-sand-100 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
        <Navigation size={15} className="text-teal-600" /> Check your commute
      </div>
      <p className="mt-0.5 text-xs text-navy-800/55">See travel time from here to your office, school or anywhere else.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MODES.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              mode === key ? "bg-navy-900 text-white" : "bg-white text-navy-800/70 ring-1 ring-navy-900/10"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="e.g. your office address"
          className="min-w-0 flex-1 rounded-xl border border-navy-900/10 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
        <button type="submit" className="btn-primary px-5 py-2.5">Check</button>
      </div>
    </form>
  );
}
