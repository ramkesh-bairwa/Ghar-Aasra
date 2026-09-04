"use client";

import Link from "next/link";
import { HeartCrack, ArrowRight } from "lucide-react";
import { useUserLists } from "@/lib/userLists";
import { usePropertiesFeed } from "@/lib/usePropertiesFeed";
import PropertyCard from "@/components/PropertyCard";

export default function FavoritesGrid() {
  const { favorites, hydrated } = useUserLists();
  const { properties, loading } = usePropertiesFeed();

  const saved = properties.filter((p) => favorites.includes(p.slug));
  const ready = hydrated && !loading;

  return (
    <section className="bg-sand-50 py-10">
      <div className="container-page">
        <div className="flex items-center justify-between py-4 text-sm text-navy-800/55">
          <span>
            {ready ? `${saved.length} saved ${saved.length === 1 ? "property" : "properties"}` : "Loading your shortlist…"}
          </span>
        </div>

        {ready && saved.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 py-16 text-center">
            <HeartCrack className="text-navy-800/30" size={32} />
            <p className="text-sm text-navy-800/60">Nothing saved yet. Tap the heart on any listing to keep it here.</p>
            <Link href="/properties" className="btn-primary mt-2">
              Browse properties
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PropertyCard key={p.slug} property={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
