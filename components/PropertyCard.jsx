"use client";

import { startNavProgress } from "@/components/NavigationProgress";
import { BedDouble, Bath, Ruler, MapPin, Heart, GitCompare, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUserLists } from "@/lib/userLists";
import { useAuth } from "@/lib/useAuth";

export default function PropertyCard({ property }) {
  const { isFavorite, toggleFavorite, isComparing, toggleCompare, compare, compareLimit } = useUserLists();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const favorited = isFavorite(property.slug);
  const comparing = isComparing(property.slug);
  const compareDisabled = !comparing && compare.length >= compareLimit;

  function requireLogin() {
    if (loading || user) return false;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return true;
  }

  const tagColor =
    property.tag === "Selling" ? "bg-teal-500 text-white" : "bg-navy-900 text-white";
  const priceColor =
    property.tag === "Selling" ? "bg-coral-600" : "bg-navy-900";

  return (
    <Link href={`/properties/${property.slug}`} className="card-surface group block overflow-hidden">
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className={`badge-pill ${tagColor}`}>{property.tag}</span>
          {property.sponsored && <span className="badge-pill bg-amber-400 text-navy-950 shadow-soft">★ Sponsored</span>}
        </div>
        <div className="absolute left-3 top-3 flex gap-2">
          <button
            type="button"
            aria-label={comparing ? "Remove from compare" : "Add to compare"}
            title={compareDisabled ? `You can compare up to ${compareLimit} properties` : undefined}
            disabled={compareDisabled}
            onClick={(e) => {
              e.preventDefault();
              if (requireLogin()) return;
              toggleCompare(property.slug);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              comparing ? "bg-teal-500 text-white" : "bg-white/90 text-navy-800 hover:bg-white"
            }`}
          >
            <GitCompare size={15} />
          </button>
          <button
            type="button"
            aria-label={favorited ? "Remove from favorites" : "Save property"}
            onClick={(e) => {
              e.preventDefault();
              if (requireLogin()) return;
              toggleFavorite(property.slug);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              favorited ? "bg-coral-600 text-white" : "bg-white/90 text-navy-800 hover:bg-white"
            }`}
          >
            <Heart size={15} fill={favorited ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-3">
          <span className="badge-pill bg-white/90 text-navy-800 capitalize">{property.propertyType}</span>
          <span className={`badge-pill ${priceColor} text-white`}>{property.price}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg text-navy-900">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
          <MapPin size={13} /> {property.address || property.city || "Location available on request"}
        </p>
        <div className="mt-3 flex items-center gap-4 border-t border-navy-900/8 pt-3 text-sm text-navy-800/70">
          <span className="flex items-center gap-1.5">
            <BedDouble size={15} /> {property.bedrooms ?? 0} beds
          </span>
          <span className="flex items-center gap-1.5">
            <Bath size={15} /> {property.bathrooms ?? 0} baths
          </span>
          <span className="flex items-center gap-1.5">
            <Ruler size={15} /> {property.area}
          </span>
        </div>
        {property.features?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.features.slice(0, 3).map((feature) => (
              <span key={feature} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-navy-800/65">{feature}</span>
            ))}
          </div>
        )}
        {/* A button, not a nested link — the whole card is already an <a>. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startNavProgress();
            router.push(`/properties/${property.slug}/visit`);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-teal-500/40 px-4 py-2.5 text-sm font-semibold text-teal-600 transition-colors hover:bg-teal-500 hover:text-white"
        >
          <CalendarCheck size={15} /> Book a free visit
        </button>
      </div>
    </Link>
  );
}
