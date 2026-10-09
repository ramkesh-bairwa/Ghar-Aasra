"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, CheckCircle2 } from "lucide-react";
import { getAmenityIcon } from "@/lib/amenityIcons";

const COLLAPSED_LIMIT = 12;

function AmenityTile({ name, iconKey }) {
  const Icon = getAmenityIcon(iconKey);
  return (
    <div className="group flex min-w-0 items-center gap-2 rounded-xl bg-sand-50 px-2 py-2 ring-1 ring-navy-900/5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-card hover:ring-teal-500/30">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 ring-1 ring-navy-900/5 transition-colors group-hover:bg-teal-500 group-hover:text-white">
        <Icon size={14} />
      </span>
      <span className="min-w-0 text-[13px] font-medium leading-tight text-navy-900">{name}</span>
    </div>
  );
}

// Property-page amenities: premium features up top, then every other
// amenity as icon tiles, filterable by category. "All" shows the first
// dozen with a "show all" toggle so long lists don't swamp the page.
export default function AmenitiesShowcase({ sections, premium = [] }) {
  const [active, setActive] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const total = sections.reduce((n, s) => n + s.items.length, 0) + premium.length;
  // "All" is one flat grid so rows stay full; a category tab shows just that category.
  const allItems = sections.flatMap((s) => s.items);
  const rendered =
    active === "all"
      ? [{ key: "all", items: expanded ? allItems : allItems.slice(0, COLLAPSED_LIMIT) }]
      : sections.filter((s) => s.key === active);
  const hiddenCount = sections.reduce((n, s) => n + s.items.length, 0) - rendered.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-navy-900">Amenities &amp; features</h2>
          <p className="mt-1 text-sm text-navy-800/55">Everything that comes with this home, grouped so it&apos;s easy to scan.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1.5 text-sm font-semibold text-teal-700">
          <CheckCircle2 size={15} /> {total} amenities
        </span>
      </div>

      {premium.length > 0 && (
        <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 p-5 ring-1 ring-teal-400/20">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/20 blur-2xl" />
          <div className="relative flex items-center gap-2 text-sm font-semibold text-teal-300">
            <Sparkles size={16} /> Premium &amp; advanced features
          </div>
          <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {premium.map(({ name, iconKey }) => {
              const Icon = getAmenityIcon(iconKey);
              return (
                <div key={name} className="flex min-w-0 items-center gap-2 rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/10">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/20 text-teal-300">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 text-[13px] font-medium leading-tight text-white">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sections.length > 1 && (
        <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ key: "all", label: "All", emoji: "✨", items: sections.flatMap((s) => s.items) }, ...sections].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => { setActive(s.key); setExpanded(false); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                active === s.key
                  ? "bg-navy-900 text-white"
                  : "bg-sand-50 text-navy-800/70 ring-1 ring-navy-900/8 hover:bg-white hover:text-navy-900"
              }`}
            >
              <span aria-hidden>{s.emoji}</span> {s.label}
              <span className={`rounded-full px-1.5 text-[11px] ${active === s.key ? "bg-white/20" : "bg-navy-900/8"}`}>{s.items.length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-6">
        {rendered.map((s) => (
          <div key={s.key}>
            {active !== "all" && (
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-800/50">
                <span aria-hidden className="text-sm">{s.emoji}</span> {s.label}
                <span className="h-px flex-1 bg-navy-900/8" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {s.items.map((item) => <AmenityTile key={item.name} {...item} />)}
            </div>
          </div>
        ))}
      </div>

      {(hiddenCount > 0 || expanded) && active === "all" && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mx-auto mt-6 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/15 transition-colors hover:ring-teal-500"
        >
          {expanded ? "Show fewer" : `Show all ${hiddenCount + rendered.reduce((n, s) => n + s.items.length, 0)} amenities`}
          <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
