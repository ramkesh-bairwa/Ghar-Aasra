"use client";

import { useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { Heart, GitCompare, CalendarCheck, ArrowRight } from "lucide-react";
import { useUserLists } from "@/lib/userLists";
import { usePropertiesFeed } from "@/lib/usePropertiesFeed";
import PropertyCard from "@/components/PropertyCard";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Selling", label: "For sale" },
  { key: "Renting", label: "For rent" },
];

export default function FavoritesGrid() {
  const { favorites, hydrated, compare } = useUserLists();
  const { properties, loading } = usePropertiesFeed();
  const [filter, setFilter] = useState("all");

  const saved = properties.filter((p) => favorites.includes(p.slug));
  const shown = filter === "all" ? saved : saved.filter((p) => p.tag === filter);
  const ready = hydrated && !loading;
  const countFor = (key) => (key === "all" ? saved.length : saved.filter((p) => p.tag === key).length);

  return (
    <section className="bg-sand-50 py-12">
      <div className="container-page">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-card">
              <Heart size={20} strokeWidth={1.8} fill="currentColor" />
            </span>
            <div>
              <h2 className="font-display text-2xl text-navy-900">Your shortlist</h2>
              <p className="mt-0.5 text-sm text-navy-800/55">
                {ready ? `${saved.length} saved ${saved.length === 1 ? "property" : "properties"}` : "Loading your shortlist…"}
              </p>
            </div>
          </div>

          {ready && saved.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full bg-white p-1 shadow-soft ring-1 ring-navy-900/5">
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        active ? "bg-navy-900 text-white" : "text-navy-800/60 hover:text-navy-900"
                      }`}
                    >
                      {f.label}
                      <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-navy-900/8"}`}>{countFor(f.key)}</span>
                    </button>
                  );
                })}
              </div>
              {compare.length > 0 && (
                <Link
                  href="/compare"
                  className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-500/20"
                >
                  <GitCompare size={14} /> Compare ({compare.length})
                </Link>
              )}
            </div>
          )}
        </div>

        {!ready ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-surface h-80 animate-pulse bg-white/60" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favourites yet"
            text="Tap the heart on any listing to save it here, so you can come back to it and book a visit."
            primary={{ label: "Browse properties", href: "/properties" }}
            secondary={{ label: "Open map view", href: "/map" }}
          />
        ) : (
          <>
            {shown.length === 0 ? (
              <div className="card-surface px-6 py-12 text-center text-sm text-navy-800/55">
                No saved properties in this category.{" "}
                <button type="button" onClick={() => setFilter("all")} className="font-semibold text-teal-600 hover:underline">
                  Show all
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((p) => (
                  <PropertyCard key={p.slug} property={p} />
                ))}
              </div>
            )}

            <div className="relative mt-10 overflow-hidden rounded-xl2 bg-gradient-to-br from-navy-900 via-navy-900 to-teal-600 p-6 text-white shadow-card sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-teal-400/10" />
              <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <CalendarCheck size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl">Ready to see them in person?</h3>
                    <p className="mt-1 text-sm text-white/65">Book a free site visit or video tour for any property on your shortlist.</p>
                  </div>
                </div>
                <Link href="/schedule-visit" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-sand-100">
                  Schedule a visit <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
