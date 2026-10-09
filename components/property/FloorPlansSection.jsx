"use client";

import { useEffect, useRef, useState } from "react";
import {
  LayoutPanelTop, ChevronDown, Check, Maximize2, Download, ZoomIn, ZoomOut, X, BedDouble, Bath, Ruler,
  Square, Maximize, Sun, CalendarDays, MessageCircle, FileText, ExternalLink, Map as MapIcon, RotateCcw,
} from "lucide-react";

const SQFT_PER_SQM = 10.7639;
const isPdf = (url) => /\.pdf(\?|#|$)/i.test(url || "");
const fmt = (n, digits = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: digits });

function Area({ sqm }) {
  return (
    <span>
      {fmt(sqm, 1)} m² <span className="block text-xs font-normal text-navy-800/45">{fmt(sqm * SQFT_PER_SQM)} sq ft</span>
    </span>
  );
}

// Full-screen plan viewer with zoom; the image scrolls when zoomed in.
function Lightbox({ plan, onClose }) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.5));
      if (e.key === "-") setZoom((z) => Math.max(1, z - 0.5));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const btn = "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 disabled:opacity-30";
  return (
    <div role="dialog" aria-modal="true" aria-label={`${plan.label} plan`} className="fixed inset-0 z-[100] flex flex-col bg-navy-950/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white md:px-6">
        <div className="min-w-0">
          <div className="truncate font-display text-lg">{plan.label}</div>
          <div className="text-xs text-white/50">{Math.round(zoom * 100)}% · scroll to move around</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className={btn} onClick={() => setZoom((z) => Math.max(1, z - 0.5))} disabled={zoom <= 1} aria-label="Zoom out"><ZoomOut size={18} /></button>
          <button type="button" className={btn} onClick={() => setZoom((z) => Math.min(4, z + 0.5))} disabled={zoom >= 4} aria-label="Zoom in"><ZoomIn size={18} /></button>
          <button type="button" className={btn} onClick={() => setZoom(1)} disabled={zoom === 1} aria-label="Reset zoom"><RotateCcw size={17} /></button>
          <a href={plan.imageUrl} download className={btn} aria-label="Download plan"><Download size={18} /></a>
          <button type="button" className={`${btn} bg-white text-navy-900 hover:bg-white/90`} onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-8" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.imageUrl}
          alt={`${plan.label} floor plan`}
          onDoubleClick={() => setZoom((z) => (z >= 2 ? 1 : 2))}
          className="mx-auto rounded-xl bg-white object-contain p-2 transition-[width] duration-200"
          style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? "1100px" : "none" }}
        />
      </div>
    </div>
  );
}

// Custom dropdown so each option can show its area and price, not just a name.
function PlanPicker({ options, value, onChange, symbol }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);
  const current = options[value];
  const units = options.map((o, i) => ({ ...o, i })).filter((o) => o.kind !== "site");
  const sites = options.map((o, i) => ({ ...o, i })).filter((o) => o.kind === "site");
  const detail = (o) =>
    o.kind === "site" ? "Layout of the whole plot"
    : [o.carpetAreaSqm && `${fmt(o.carpetAreaSqm, 1)} m² carpet`, o.price ? `${symbol}${fmt(o.price)}` : null].filter(Boolean).join(" · ") || "Floor plan";

  const Option = ({ o }) => (
    <li role="option" aria-selected={o.i === value}>
      <button
        type="button"
        onClick={() => { onChange(o.i); setOpen(false); }}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${o.i === value ? "bg-teal-500/10" : "hover:bg-sand-50"}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${o.i === value ? "bg-teal-500 text-white" : "bg-sand-100 text-teal-600"}`}>
          {o.kind === "site" ? <MapIcon size={16} /> : <LayoutPanelTop size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy-900">{o.label}</span>
          <span className="block truncate text-xs text-navy-800/50">{detail(o)}</span>
        </span>
        {o.i === value && <Check size={16} className="shrink-0 text-teal-600" />}
      </button>
    </li>
  );

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-left ring-1 transition-shadow ${open ? "ring-2 ring-teal-500" : "ring-navy-900/15 hover:ring-teal-500/60"}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-navy-800/45">Configuration</span>
          <span className="block truncate text-sm font-semibold text-navy-900">{current.label}</span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-navy-800/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 top-full z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl bg-white py-2 shadow-card ring-1 ring-navy-900/10 sm:w-80">
          {units.length > 0 && <li className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-navy-800/40">Unit types</li>}
          {units.map((o) => <Option key={o.i} o={o} />)}
          {sites.length > 0 && <li className="mt-1 border-t border-navy-900/8 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-navy-800/40">Plot</li>}
          {sites.map((o) => <Option key={o.i} o={o} />)}
        </ul>
      )}
    </div>
  );
}

// Floor plans by unit configuration (1 BHK, 2 BHK…) plus the plot / site plan,
// switched with a dropdown. Falls back to the single general floor plan.
export default function FloorPlansSection({ plans = [], floorPlanUrl, sitePlanUrl, symbol = "$", slug, isRent }) {
  const units = plans.length ? plans : floorPlanUrl ? [{ id: "general", label: "Floor plan", imageUrl: floorPlanUrl }] : [];
  const options = [...units, ...(sitePlanUrl ? [{ id: "site", label: "Plot / site plan", imageUrl: sitePlanUrl, kind: "site" }] : [])];
  const [index, setIndex] = useState(0);
  const [viewing, setViewing] = useState(false);
  if (!options.length) return null;

  const plan = options[Math.min(index, options.length - 1)];
  const isSite = plan.kind === "site";
  const priced = units.filter((u) => u.price > 0);
  const carpets = units.map((u) => u.carpetAreaSqm).filter((n) => n > 0);
  const subtitle = [
    plans.length ? `${plans.length} configuration${plans.length === 1 ? "" : "s"}` : null,
    carpets.length ? `${fmt(Math.min(...carpets), 1)}${carpets.length > 1 ? `–${fmt(Math.max(...carpets), 1)}` : ""} m² carpet` : null,
    priced.length ? `from ${symbol}${fmt(Math.min(...priced.map((u) => u.price)))}${isRent ? "/mo" : ""}` : null,
  ].filter(Boolean).join(" · ");
  const specs = isSite ? [] : [
    plan.carpetAreaSqm > 0 && { Icon: Ruler, label: "Carpet area", value: <Area sqm={plan.carpetAreaSqm} /> },
    plan.builtUpAreaSqm > 0 && { Icon: Square, label: "Built-up area", value: <Area sqm={plan.builtUpAreaSqm} /> },
    plan.superAreaSqm > 0 && { Icon: Maximize, label: "Super built-up", value: <Area sqm={plan.superAreaSqm} /> },
    plan.bedrooms != null && { Icon: BedDouble, label: "Bedrooms", value: plan.bedrooms === 0 ? "Studio" : plan.bedrooms },
    plan.bathrooms > 0 && { Icon: Bath, label: "Bathrooms", value: plan.bathrooms },
    plan.balconies > 0 && { Icon: Sun, label: "Balconies", value: plan.balconies },
  ].filter(Boolean);
  const area = plan.builtUpAreaSqm || plan.carpetAreaSqm;
  const perSqm = !isRent && plan.price > 0 && area ? plan.price / area : null;

  return (
    <div id="floor-plans" className="card-surface mt-6 scroll-mt-40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <LayoutPanelTop size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl text-navy-900">Floor plans</h2>
            <p className="mt-0.5 text-sm text-navy-800/55">{subtitle || "Layouts shared by the seller."}</p>
          </div>
        </div>
        {options.length > 1 && <PlanPicker options={options} value={index} onChange={setIndex} symbol={symbol} />}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-navy-900/8">
        {/* Plan drawing */}
        {plan.imageUrl && !isPdf(plan.imageUrl) ? (
          <button type="button" onClick={() => setViewing(true)} className="group relative block aspect-[16/10] w-full cursor-zoom-in bg-white" aria-label={`Enlarge ${plan.label} plan`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plan.imageUrl} alt={`${plan.label} floor plan`} loading="lazy" className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]" />
            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-navy-900/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Maximize2 size={13} /> View full screen
            </span>
          </button>
        ) : plan.imageUrl ? (
          <a href={plan.imageUrl} target="_blank" rel="noopener noreferrer" className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-sand-50 text-center hover:bg-teal-500/5">
            <FileText size={34} className="text-teal-600" />
            <span className="text-sm font-semibold text-navy-900">Open {plan.label.toLowerCase()} (PDF)</span>
            <span className="flex items-center gap-1 text-xs text-navy-800/50">Opens in a new tab <ExternalLink size={12} /></span>
          </a>
        ) : (
          <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-sand-50 text-navy-800/40">
            <LayoutPanelTop size={32} strokeWidth={1.5} />
            <span className="text-sm">Plan drawing coming soon</span>
          </div>
        )}

        {/* Details for the selected configuration */}
        <div className="border-t border-navy-900/8 bg-sand-50 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="font-display text-2xl text-navy-900">{plan.label}</div>
            {!isSite && (
              <div className="text-right">
                {plan.price > 0 ? (
                  <span className="font-display text-xl text-teal-600">
                    {symbol}{fmt(plan.price)}{isRent ? <span className="text-sm">/mo</span> : null}
                    {perSqm && <span className="ml-2 font-sans text-xs text-navy-800/50">{symbol}{fmt(perSqm)} / m²</span>}
                  </span>
                ) : plans.length ? (
                  <span className="text-sm font-semibold text-navy-800/55">Price on request</span>
                ) : null}
              </div>
            )}
          </div>

          {isSite ? (
            <p className="mt-2 text-sm leading-relaxed text-navy-800/65">
              The layout of the whole plot: boundaries, access roads, open spaces and where each building sits. Open it full screen to read the measurements.
            </p>
          ) : specs.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {specs.map(({ Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-white px-3.5 py-3 ring-1 ring-navy-900/5">
                  <div className="flex items-center gap-1.5 text-xs text-navy-800/55"><Icon size={14} className="text-teal-600" /> {label}</div>
                  <div className="mt-1 text-sm font-semibold text-navy-900">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-navy-800/55">Ask the team for this layout&apos;s exact measurements.</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href={slug ? `/properties/${slug}/visit` : "#enquire"} className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
              <CalendarDays size={15} /> Book a visit
            </a>
            <a href="#enquire" className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/15 hover:ring-teal-500">
              <MessageCircle size={15} /> Enquire{isSite ? "" : ` about ${plan.label}`}
            </a>
            {plan.imageUrl && (
              <a href={plan.imageUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-800/65 hover:bg-white hover:text-teal-600">
                <Download size={15} /> Download {isSite ? "plot plan" : "plan"}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* All configurations at a glance — tap a row to switch */}
      {plans.length > 1 && (
        <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-navy-900/8">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-sand-50 text-xs uppercase tracking-wide text-navy-800/45">
              <tr>
                <th className="px-4 py-3 font-semibold">Configuration</th>
                <th className="px-4 py-3 font-semibold">Carpet area</th>
                <th className="px-4 py-3 font-semibold">Built-up area</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => setIndex(i)}
                  className={`cursor-pointer border-t border-navy-900/5 transition-colors ${i === index ? "bg-teal-500/8" : "hover:bg-sand-50"}`}
                >
                  <td className="px-4 py-3 font-semibold text-navy-900">
                    <span className="flex items-center gap-2">
                      {i === index && <span className="h-2 w-2 rounded-full bg-teal-500" />}
                      {p.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-800/75">{p.carpetAreaSqm ? `${fmt(p.carpetAreaSqm, 1)} m²` : "—"}</td>
                  <td className="px-4 py-3 text-navy-800/75">{p.builtUpAreaSqm ? `${fmt(p.builtUpAreaSqm, 1)} m²` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-navy-900">{p.price ? `${symbol}${fmt(p.price)}${isRent ? "/mo" : ""}` : "On request"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <Lightbox plan={plan} onClose={() => setViewing(false)} />}
    </div>
  );
}
