"use client";

import { useState } from "react";
import { Ruler, Layers, BedDouble } from "lucide-react";

export default function PropertyConfigSelector({ presets, image, title }) {
  const [selectedId, setSelectedId] = useState(presets[0]?.id ?? "");
  if (!presets?.length) return null;

  const selected = presets.find((p) => String(p.id) === String(selectedId)) || presets[0];

  return (
    <div className="card-surface mt-6 p-6">
      <h2 className="font-display text-xl text-navy-900">Explore configurations</h2>
      <p className="mt-1 text-sm text-navy-800/50">
        Select a unit type to see its carpet area and size.
      </p>

      {/* BHK pill selector */}
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(String(p.id))}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              String(selectedId) === String(p.id)
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-navy-900/15 bg-white text-navy-800 hover:border-teal-400 hover:text-teal-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Selected config details */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {image && (
          <div className="col-span-2 overflow-hidden rounded-xl sm:col-span-1">
            <img src={image} alt={title} className="h-full min-h-24 w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-sand-50 py-4 text-center">
          <BedDouble size={18} className="text-teal-600" />
          <div className="font-display text-base text-navy-900">{selected.bedrooms ?? 0}</div>
          <div className="text-[11px] text-navy-800/50">Bedrooms</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-sand-50 py-4 text-center">
          <Ruler size={18} className="text-teal-600" />
          <div className="font-display text-base text-navy-900">{selected.carpet_area_sqm} m²</div>
          <div className="text-[11px] text-navy-800/50">Carpet area</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-sand-50 py-4 text-center">
          <Layers size={18} className="text-teal-600" />
          <div className="font-display text-base text-navy-900">{selected.built_up_area_sqm ?? "—"} m²</div>
          <div className="text-[11px] text-navy-800/50">Built-up area</div>
        </div>
      </div>
    </div>
  );
}
