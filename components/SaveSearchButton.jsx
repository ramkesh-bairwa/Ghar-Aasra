"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BellPlus, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const TYPE_WORD = { sale: "for sale", rent: "for rent", commercial: "commercial" };

// "Save this search & get alerts" on listing pages. Captures the current
// filters from the URL (plus the page's fixed listing type).
export default function SaveSearchButton({ fixedListingType }) {
  const { user, loading } = useAuth();
  const { alerts_enabled, currency_symbol: symbol = "₹" } = useSiteSettings();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [alert, setAlert] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  if (alerts_enabled === "false") return null;

  const filters = {
    listingType: fixedListingType || params.get("listingType") || undefined,
    city: params.get("city") || undefined,
    locality: params.get("locality") || undefined,
    propertyType: params.get("propertyType") || undefined,
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    minBedrooms: params.get("minBedrooms") || undefined,
    furnishing: params.get("furnishing") || undefined,
  };
  const hasFilters = Object.values(filters).some(Boolean);

  function suggestName() {
    const bits = [
      filters.minBedrooms && `${filters.minBedrooms}+ BHK`,
      filters.propertyType || "Homes",
      TYPE_WORD[filters.listingType],
      (filters.locality || filters.city) && `in ${filters.locality || filters.city}`,
      filters.maxPrice && `under ${symbol}${Number(filters.maxPrice).toLocaleString("en-IN")}`,
    ].filter(Boolean);
    return bits.join(" ").replace(/^./, (c) => c.toUpperCase());
  }

  function start() {
    if (loading) return;
    if (!user) return router.push(`/login?next=${encodeURIComponent(`${pathname}?${params.toString()}`)}`);
    setName(suggestName());
    setError("");
    setDone(null);
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters, alert_enabled: alert }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.fieldErrors?.name || json.fieldErrors?.filters || json.error || "Could not save.");
    setDone(json);
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-navy-800"
      >
        <BellPlus size={16} className="text-teal-300" /> Save search & get alerts
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy-950/50 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-card sm:rounded-3xl">
            <div className="relative bg-gradient-to-br from-navy-900 to-navy-950 px-6 pb-6 pt-7 text-white">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-white/60 hover:text-white"><X size={18} /></button>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500"><BellPlus size={20} /></span>
              <h2 className="mt-3 font-display text-2xl">{done ? "Search saved!" : "Never miss a new listing"}</h2>
              <p className="mt-1 text-sm text-white/65">
                {done ? "We'll notify you in the bell icon when something new matches." : "Save these filters and we'll alert you about new matches."}
              </p>
            </div>
            {done ? (
              <div className="space-y-4 p-6">
                <p className="flex items-center gap-2 rounded-xl bg-teal-500/10 p-3 text-sm text-teal-700">
                  <CheckCircle2 size={16} /> {done.matches} {done.matches === 1 ? "home matches" : "homes match"} right now.
                </p>
                <div className="flex gap-2">
                  <Link href="/alerts" className="btn-outline flex-1">My alerts</Link>
                  <button type="button" onClick={() => setOpen(false)} className="btn-primary flex-1">Keep browsing</button>
                </div>
              </div>
            ) : (
              <form onSubmit={save} className="space-y-4 p-6" noValidate>
                {!hasFilters && (
                  <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" /> Pick a city, budget or type in the filters first, so we know what to look for.
                  </p>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-navy-900">Name this search</span>
                  <input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className={`w-full rounded-xl bg-sand-50 px-4 py-3 text-[15px] ring-1 focus:outline-none focus:ring-2 focus:ring-teal-500 ${error ? "ring-coral-500" : "ring-navy-900/10"}`} />
                  {error && <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-coral-600"><AlertCircle size={12} /> {error}</span>}
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-sand-50 p-3 ring-1 ring-navy-900/10">
                  <span>
                    <span className="block text-sm font-semibold text-navy-900">Alert me about new matches</span>
                    <span className="block text-xs text-navy-800/50">Shows in your notification bell</span>
                  </span>
                  <input type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} className="h-5 w-5 accent-teal-500" />
                </label>
                <button type="submit" disabled={busy || !hasFilters} className="btn-primary w-full disabled:opacity-40">
                  {busy && <Loader2 size={16} className="animate-spin" />} Save search
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
