"use client";

import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import {
  BedDouble, Bath, Ruler, MapPin, X, GitCompare, ArrowRight, Plus, Trophy, Tag, Home, Sofa, Compass,
  Car, Building, BadgeCheck, Sparkles, Wallet,
} from "lucide-react";
import { useUserLists } from "@/lib/userLists";
import { usePropertiesFeed } from "@/lib/usePropertiesFeed";

const dash = <span className="text-navy-800/30">—</span>;

// `best` (optional) returns a numeric score per property; the highest score
// gets a "Best" marker when the values actually differ.
const ROWS = [
  {
    label: "Price",
    icon: Wallet,
    // Only meaningful when every listing is the same kind (all sale or all rent).
    best: (p, all) => (all.every((x) => x.tag === all[0].tag) && p.priceValue ? -p.priceValue : null),
    bestLabel: "Lowest",
    render: (p) => <span className="font-display text-lg text-navy-900">{p.price}</span>,
  },
  { label: "Type", icon: Home, render: (p) => <span className="capitalize">{p.propertyType || dash}</span> },
  { label: "Bedrooms", icon: BedDouble, best: (p) => p.bedrooms ?? null, bestLabel: "Most", render: (p) => p.bedrooms ?? 0 },
  { label: "Bathrooms", icon: Bath, best: (p) => p.bathrooms ?? null, bestLabel: "Most", render: (p) => p.bathrooms ?? 0 },
  { label: "Area", icon: Ruler, best: (p) => p.areaSqm, bestLabel: "Largest", render: (p) => p.area },
  { label: "Furnishing", icon: Sofa, render: (p) => <span className="capitalize">{p.furnishing?.replace(/[_-]/g, " ") || dash}</span> },
  { label: "Facing", icon: Compass, render: (p) => <span className="capitalize">{p.facing?.replace(/[_-]/g, " ") || dash}</span> },
  {
    label: "Floor",
    icon: Building,
    render: (p) => (p.floorNumber != null ? `${p.floorNumber}${p.totalFloors ? ` of ${p.totalFloors}` : ""}` : dash),
  },
  {
    label: "Parking",
    icon: Car,
    render: (p) => (p.parking ? `Yes${p.parkingSpaces ? ` · ${p.parkingSpaces}` : ""}` : "No"),
  },
  {
    label: "Location",
    icon: MapPin,
    render: (p) => <span className="line-clamp-2">{p.address || p.city}</span>,
  },
  {
    label: "Verified",
    icon: BadgeCheck,
    render: (p) =>
      p.verified ? (
        <span className="inline-flex items-center gap-1 font-medium text-teal-600"><BadgeCheck size={15} /> Verified</span>
      ) : (
        <span className="text-navy-800/45">Not yet</span>
      ),
  },
  {
    label: "Features",
    icon: Sparkles,
    render: (p) =>
      p.features?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {p.features.slice(0, 5).map((f) => (
            <span key={f} className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-600">{f}</span>
          ))}
          {p.features.length > 5 && (
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs text-navy-800/60">+{p.features.length - 5}</span>
          )}
        </div>
      ) : (
        dash
      ),
  },
];

function winners(row, selected) {
  if (!row.best || selected.length < 2) return new Set();
  const scores = selected.map((p) => row.best(p, selected));
  const valid = scores.filter((s) => s != null && !Number.isNaN(s));
  if (valid.length < 2 || new Set(valid).size === 1) return new Set();
  const top = Math.max(...valid);
  return new Set(selected.filter((_, i) => scores[i] === top).map((p) => p.slug));
}

export default function CompareTable() {
  const { compare, hydrated, removeFromCompare, clearCompare, compareLimit } = useUserLists();
  const { properties, loading } = usePropertiesFeed();

  const selected = compare
    .map((slug) => properties.find((p) => p.slug === slug))
    .filter(Boolean);

  const ready = hydrated && !loading;

  if (ready && selected.length === 0) {
    return (
      <section className="bg-sand-50 py-12">
        <div className="container-page">
          <EmptyState
            icon={GitCompare}
            title="Nothing to compare yet"
            text={`Tap the compare icon on up to ${compareLimit} listings to see them side by side.`}
            primary={{ label: "Browse properties", href: "/properties" }}
            secondary={{ label: "My favourites", href: "/favorites" }}
          />
        </div>
      </section>
    );
  }

  const openSlots = Math.max(0, compareLimit - selected.length);
  const columns = selected.length + (openSlots > 0 ? 1 : 0);

  return (
    <section className="bg-sand-50 py-12">
      <div className="container-page">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-navy-900 text-white shadow-card">
              <GitCompare size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="font-display text-2xl text-navy-900">
                {ready ? `Comparing ${selected.length} ${selected.length === 1 ? "property" : "properties"}` : "Loading…"}
              </h2>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-navy-800/55">
                <div className="flex gap-1">
                  {Array.from({ length: compareLimit }).map((_, i) => (
                    <span key={i} className={`h-1.5 w-6 rounded-full ${i < selected.length ? "bg-teal-500" : "bg-navy-900/10"}`} />
                  ))}
                </div>
                {selected.length} of {compareLimit} slots used
              </div>
            </div>
          </div>
          {selected.length > 0 && (
            <button
              onClick={clearCompare}
              className="inline-flex items-center gap-1.5 rounded-full border border-coral-500/30 bg-white px-4 py-2 text-xs font-semibold text-coral-600 transition-colors hover:bg-coral-500/10"
            >
              <X size={13} /> Clear all
            </button>
          )}
        </div>

        {!ready && <div className="card-surface h-96 animate-pulse bg-white/60" />}

        {ready && selected.length > 0 && (
          <div className="card-surface overflow-x-auto">
            <div
              className="grid min-w-[720px]"
              style={{ gridTemplateColumns: `170px repeat(${columns}, minmax(220px, 1fr))` }}
            >
              {/* Header row: property cards */}
              <div className="sticky left-0 z-10 flex items-end bg-white p-4 text-xs font-semibold uppercase tracking-wider text-navy-800/40">
                Overview
              </div>
              {selected.map((p) => (
                <div key={p.slug} className="p-3">
                  <div className="group relative overflow-hidden rounded-xl">
                    <Link href={`/properties/${p.slug}`}>
                      <img src={p.image} alt={p.title} className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/10 to-transparent" />
                    </Link>
                    <span
                      className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-soft ${
                        p.tag === "Selling" ? "bg-coral-600" : "bg-navy-900"
                      }`}
                    >
                      <Tag size={10} className="mr-1 inline" />
                      {p.tag}
                    </span>
                    <button
                      aria-label="Remove from compare"
                      onClick={() => removeFromCompare(p.slug)}
                      className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-navy-800 shadow-soft transition-colors hover:bg-coral-600 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                    <Link href={`/properties/${p.slug}`} className="absolute inset-x-3 bottom-2.5 line-clamp-2 font-display text-[15px] leading-snug text-white">
                      {p.title}
                    </Link>
                  </div>
                </div>
              ))}
              {openSlots > 0 && (
                <div className="p-3">
                  <Link
                    href="/properties"
                    className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-900/10 text-sm font-medium text-navy-800/50 transition-colors hover:border-teal-500/50 hover:bg-teal-500/5 hover:text-teal-600"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                      <Plus size={18} />
                    </span>
                    Add property
                    <span className="text-xs font-normal">{openSlots} slot{openSlots === 1 ? "" : "s"} left</span>
                  </Link>
                </div>
              )}

              {/* Attribute rows */}
              {ROWS.map((row, idx) => {
                const best = winners(row, selected);
                const zebra = idx % 2 === 0 ? "bg-sand-50" : "bg-white";
                const Icon = row.icon;
                return (
                  <div key={row.label} className="contents">
                    <div className={`sticky left-0 z-10 flex items-center gap-2 border-t border-navy-900/5 px-4 py-3.5 text-sm font-medium text-navy-800/65 ${zebra}`}>
                      <Icon size={15} className="shrink-0 text-teal-600" />
                      {row.label}
                    </div>
                    {selected.map((p) => {
                      const isBest = best.has(p.slug);
                      return (
                        <div
                          key={p.slug + row.label}
                          className={`flex items-center gap-2 border-t border-navy-900/5 px-4 py-3.5 text-sm text-navy-800/85 ${zebra} ${
                            isBest ? "!bg-teal-500/[0.08]" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">{row.render(p)}</div>
                          {isBest && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              <Trophy size={10} /> {row.bestLabel}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {openSlots > 0 && <div className={`border-t border-navy-900/5 ${zebra}`} />}
                  </div>
                );
              })}

              {/* CTA row */}
              <div className="sticky left-0 z-10 border-t border-navy-900/5 bg-white" />
              {selected.map((p) => (
                <div key={p.slug + "-cta"} className="border-t border-navy-900/5 p-3">
                  <Link href={`/properties/${p.slug}`} className="btn-primary w-full justify-center py-2.5">
                    View details
                    <ArrowRight size={15} />
                  </Link>
                </div>
              ))}
              {openSlots > 0 && <div className="border-t border-navy-900/5" />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
