"use client";

import { useState } from "react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const COLORS = ["bg-navy-900", "bg-teal-500", "bg-coral-500", "bg-amber-500", "bg-purple-500"];

// "What you'll actually pay": the listing price plus every one-off charge
// the admin entered for it, as a stacked bar. Hovering/tapping a legend row
// highlights its slice.
export default function PropertyCostBreakdown({ items }) {
  const { currency_symbol: symbol = "$" } = useSiteSettings();
  const [hover, setHover] = useState(null);
  const parts = items.filter((i) => i.value > 0);
  const total = parts.reduce((sum, i) => sum + i.value, 0);
  if (parts.length < 2 || !total) return null;

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-sand-100">
        {parts.map((p, i) => (
          <div
            key={p.label}
            className={`${COLORS[i % COLORS.length]} transition-opacity ${hover !== null && hover !== i ? "opacity-30" : ""}`}
            style={{ width: `${Math.max((p.value / total) * 100, 1.5)}%` }}
            title={p.label}
          />
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        {parts.map((p, i) => (
          <div
            key={p.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setHover(hover === i ? null : i)}
            className={`flex cursor-default items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${hover === i ? "bg-sand-100" : ""}`}
          >
            <span className="flex items-center gap-2 text-navy-800/70">
              <span className={`h-2.5 w-2.5 rounded-full ${COLORS[i % COLORS.length]}`} /> {p.label}
            </span>
            <span className="font-medium text-navy-900">
              {symbol}{Math.round(p.value).toLocaleString("en-US")}
              <span className="ml-2 text-xs text-navy-800/40">{((p.value / total) * 100).toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-navy-900/8 px-2 pt-3">
        <span className="text-sm font-semibold text-navy-900">Estimated total cost</span>
        <span className="font-display text-xl text-navy-900">{symbol}{Math.round(total).toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
