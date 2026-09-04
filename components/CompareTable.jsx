"use client";

import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin, X, GitCompare, ArrowRight } from "lucide-react";
import { useUserLists } from "@/lib/userLists";
import { usePropertiesFeed } from "@/lib/usePropertiesFeed";

const ROWS = [
  { label: "Price", render: (p) => <span className="font-display text-lg text-navy-900">{p.price}</span> },
  { label: "Type", render: (p) => <span className="capitalize">{p.propertyType}</span> },
  {
    label: "Beds / Baths",
    render: (p) => (
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1"><BedDouble size={14} /> {p.bedrooms ?? 0}</span>
        <span className="flex items-center gap-1"><Bath size={14} /> {p.bathrooms ?? 0}</span>
      </span>
    ),
  },
  { label: "Area", render: (p) => <span className="flex items-center gap-1"><Ruler size={14} /> {p.area}</span> },
  { label: "Location", render: (p) => <span className="flex items-center gap-1"><MapPin size={14} /> {p.address || p.city}</span> },
  { label: "Listing", render: (p) => <span className="capitalize">{p.tag}</span> },
  {
    label: "Features",
    render: (p) =>
      p.features?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {p.features.slice(0, 4).map((f) => (
            <span key={f} className="rounded-full bg-sand-100 px-2 py-0.5 text-xs text-navy-800/65">{f}</span>
          ))}
        </div>
      ) : (
        <span className="text-navy-800/40">—</span>
      ),
  },
];

export default function CompareTable() {
  const { compare, hydrated, removeFromCompare, clearCompare, compareLimit } = useUserLists();
  const { properties, loading } = usePropertiesFeed();

  const selected = compare
    .map((slug) => properties.find((p) => p.slug === slug))
    .filter(Boolean);

  const ready = hydrated && !loading;

  if (ready && selected.length === 0) {
    return (
      <section className="bg-sand-50 py-10">
        <div className="container-page">
          <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
            <GitCompare className="text-navy-800/30" size={32} />
            <p className="text-sm text-navy-800/60">
              Nothing to compare yet. Use the compare icon on any listing to add up to {compareLimit} properties.
            </p>
            <Link href="/properties" className="btn-primary mt-2">
              Browse properties
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-sand-50 py-10">
      <div className="container-page">
        <div className="flex items-center justify-between py-4 text-sm text-navy-800/55">
          <span>{ready ? `Comparing ${selected.length} of ${compareLimit}` : "Loading…"}</span>
          {selected.length > 0 && (
            <button onClick={clearCompare} className="font-medium text-coral-600 hover:underline">
              Clear all
            </button>
          )}
        </div>

        {selected.length > 0 && (
          <div className="card-surface overflow-x-auto p-3 md:p-4">
            <div
              className="grid min-w-[640px] gap-3"
              style={{ gridTemplateColumns: `140px repeat(${selected.length}, minmax(220px, 1fr))` }}
            >
              <div />
              {selected.map((p) => (
                <div key={p.slug} className="relative overflow-hidden rounded-xl2">
                  <button
                    aria-label="Remove from compare"
                    onClick={() => removeFromCompare(p.slug)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-navy-800 hover:bg-white"
                  >
                    <X size={14} />
                  </button>
                  <Link href={`/properties/${p.slug}`}>
                    <img src={p.image} alt={p.title} className="h-36 w-full object-cover" />
                  </Link>
                  <div className="pt-2">
                    <Link href={`/properties/${p.slug}`} className="font-display text-[15px] text-navy-900 hover:text-teal-600">
                      {p.title}
                    </Link>
                  </div>
                </div>
              ))}

              {ROWS.map((row) => (
                <div key={row.label} className="contents">
                  <div className="flex items-center border-t border-navy-900/8 py-3 text-sm font-medium text-navy-800/60">
                    {row.label}
                  </div>
                  {selected.map((p) => (
                    <div key={p.slug + row.label} className="flex items-center border-t border-navy-900/8 py-3 text-sm text-navy-800/80">
                      {row.render(p)}
                    </div>
                  ))}
                </div>
              ))}

              <div />
              {selected.map((p) => (
                <div key={p.slug + "-cta"} className="pb-1 pt-3">
                  <Link href={`/properties/${p.slug}`} className="btn-primary w-full justify-center">
                    View details
                    <ArrowRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
