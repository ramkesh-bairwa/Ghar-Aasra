"use client";

import { useState } from "react";

// Average sale price per m² by month (single series → one hue, no legend;
// the heading names it). Thin rounded bars on a zero baseline, a recessive
// grid, and a hover tooltip per bar. A table view sits under it for
// screen readers and for anyone who prefers numbers.
export default function TrendChart({ points, symbol, unit }) {
  const [hover, setHover] = useState(null);
  if (!points.length) return null;
  const max = Math.max(...points.map((p) => p.rate)) * 1.1;
  const W = 640, H = 220, padL = 8, padB = 28, padT = 12;
  const plotH = H - padB - padT;
  const slot = (W - padL * 2) / points.length;
  const barW = Math.min(28, slot * 0.55);
  const money = (n) => `${symbol}${Math.round(n).toLocaleString("en-IN")}`;
  const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Average sale price per ${unit} by month`}>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padL} x2={W - padL} y1={padT + plotH * (1 - t)} y2={padT + plotH * (1 - t)} className="stroke-navy-900/[0.07]" strokeWidth="1" />
        ))}
        <line x1={padL} x2={W - padL} y1={padT + plotH} y2={padT + plotH} className="stroke-navy-900/20" strokeWidth="1" />
        {points.map((p, i) => {
          const h = Math.max(6, (p.rate / max) * plotH);
          const x = padL + slot * i + (slot - barW) / 2;
          const y = padT + plotH - h;
          return (
            <g key={p.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* Hit target wider than the bar. */}
              <rect x={padL + slot * i} y={padT} width={slot} height={plotH} fill="transparent" />
              <path
                d={`M${x},${y + plotH + padT - y} V${y + 4} a4,4 0 0 1 4,-4 h${barW - 8} a4,4 0 0 1 4,4 V${padT + plotH} Z`}
                className={hover === i ? "fill-teal-600" : "fill-teal-500"}
              />
              <text x={x + barW / 2} y={H - 9} textAnchor="middle" className="fill-navy-800/55" fontSize="11">{monthLabel(p.month)}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-navy-950 px-3 py-2 text-xs text-white shadow-card"
          style={{ left: `${((padL + slot * hover + slot / 2) / W) * 100}%`, top: `${((padT + plotH - (points[hover].rate / max) * plotH) / H) * 100}%` }}
        >
          <div className="font-semibold">{money(points[hover].rate)}/{unit}</div>
          <div className="text-white/60">{monthLabel(points[hover].month)} · {points[hover].n} listing{points[hover].n === 1 ? "" : "s"}</div>
        </div>
      )}
      <details className="mt-2 text-xs text-navy-800/55">
        <summary className="cursor-pointer select-none font-semibold text-teal-600">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="text-navy-800/45"><th className="py-1 font-medium">Month</th><th className="py-1 font-medium">Avg price / {unit}</th><th className="py-1 font-medium">Listings</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month} className="border-t border-navy-900/5 text-navy-900"><td className="py-1">{monthLabel(p.month)}</td><td className="py-1">{money(p.rate)}</td><td className="py-1">{p.n}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
