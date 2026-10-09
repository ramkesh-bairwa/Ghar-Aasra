"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, BellRing, Sparkles, TrendingDown, Trash2, Search, ArrowRight, CheckCheck, Loader2, MapPin } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const TABS = [
  { key: "alerts", label: "Alerts", Icon: Bell },
  { key: "searches", label: "Saved searches", Icon: Search },
  { key: "watches", label: "Price watches", Icon: BellRing },
];

function timeAgo(value) {
  const d = new Date(String(value).replace(" ", "T"));
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function searchHref(f) {
  const base = { sale: "/buy", rent: "/rent", commercial: "/commercial" }[f.listingType] || "/properties";
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => k !== "listingType" && v != null && v !== "")).toString();
  return qs ? `${base}?${qs}` : base;
}

export default function AlertsCenter() {
  const { currency_symbol: symbol = "₹" } = useSiteSettings();
  const money = (n) => `${symbol}${Number(n || 0).toLocaleString("en-IN")}`;
  const [tab, setTab] = useState("alerts");
  const [alerts, setAlerts] = useState(null);
  const [searches, setSearches] = useState(null);
  const [watches, setWatches] = useState(null);

  const load = useCallback(() => {
    fetch("/api/alerts", { cache: "no-store" }).then((r) => r.json()).then((d) => setAlerts(d.alerts || [])).catch(() => setAlerts([]));
    fetch("/api/saved-searches", { cache: "no-store" }).then((r) => r.json()).then((d) => setSearches(d.searches || [])).catch(() => setSearches([]));
    fetch("/api/price-watch", { cache: "no-store" }).then((r) => r.json()).then((d) => setWatches(d.watches || [])).catch(() => setWatches([]));
  }, []);
  useEffect(load, [load]);

  const unread = (alerts || []).filter((a) => !a.read_at).length;

  async function readAll() {
    await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read_all" }) });
    setAlerts((list) => list.map((a) => ({ ...a, read_at: a.read_at || new Date().toISOString() })));
  }
  async function toggleSearch(s) {
    setSearches((list) => list.map((x) => (x.id === s.id ? { ...x, alert_enabled: s.alert_enabled ? 0 : 1 } : x)));
    await fetch(`/api/saved-searches/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alert_enabled: !s.alert_enabled }) });
  }
  async function deleteSearch(s) {
    setSearches((list) => list.filter((x) => x.id !== s.id));
    await fetch(`/api/saved-searches/${s.id}`, { method: "DELETE" });
  }
  async function unwatch(w) {
    setWatches((list) => list.filter((x) => x.property_id !== w.property_id));
    await fetch("/api/price-watch", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: w.property_id }) });
  }

  const counts = { alerts: unread, searches: searches?.length || 0, watches: watches?.length || 0 };
  const loading = <div className="flex items-center justify-center gap-2 py-16 text-sm text-navy-800/50"><Loader2 size={16} className="animate-spin" /> Loading…</div>;

  return (
    <section className="bg-sand-50 py-10">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full bg-white p-1 shadow-soft ring-1 ring-navy-900/5">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === key ? "bg-navy-900 text-white" : "text-navy-800/60 hover:text-navy-900"}`}
              >
                <Icon size={15} /> {label}
                {counts[key] > 0 && <span className={`rounded-full px-1.5 text-[11px] ${tab === key ? "bg-white/20" : key === "alerts" ? "bg-coral-500 text-white" : "bg-navy-900/8"}`}>{counts[key]}</span>}
              </button>
            ))}
          </div>
          {tab === "alerts" && unread > 0 && (
            <button onClick={readAll} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline"><CheckCheck size={15} /> Mark all as read</button>
          )}
          {tab === "searches" && (
            <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline">New search <ArrowRight size={14} /></Link>
          )}
        </div>

        <div className="mt-6">
          {tab === "alerts" && (alerts === null ? loading : alerts.length === 0 ? (
            <EmptyState icon={Bell} title="No alerts yet" text="Save a search from the Buy or Rent page, or tap 'Alert me if the price drops' on a property. New matches show up here." primary={{ label: "Start a search", href: "/properties" }} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.map((a) => (
                <Link key={a.id} href={`/properties/${a.slug}`} className={`card-surface group flex gap-4 overflow-hidden p-3 transition-shadow hover:shadow-card ${!a.read_at ? "ring-2 ring-teal-500/40" : ""}`}>
                  <img src={a.cover_image_url || "/brand/gharaashra-app-icon.png"} alt="" className="h-24 w-28 shrink-0 rounded-xl object-cover sm:h-28 sm:w-36" />
                  <div className="min-w-0 flex-1 py-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.kind === "price_drop" ? "bg-teal-500 text-white" : "bg-teal-500/10 text-teal-700"}`}>
                      {a.kind === "price_drop" ? <><TrendingDown size={11} /> Price dropped</> : <><Sparkles size={11} /> New match{a.search_name ? ` · ${a.search_name}` : ""}</>}
                    </span>
                    <div className="mt-1.5 truncate font-display text-[17px] text-navy-900 group-hover:text-teal-600">{a.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-navy-800/55"><MapPin size={12} /> {[a.locality, a.city].filter(Boolean).join(", ") || "—"}</div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-2 text-sm">
                      {a.kind === "price_drop" && a.old_price && <span className="text-navy-800/40 line-through">{money(a.old_price)}</span>}
                      <span className="font-semibold text-navy-900">{money(a.price)}</span>
                      {a.kind === "price_drop" && a.old_price && <span className="text-xs font-semibold text-teal-600">Save {money(a.old_price - a.price)}</span>}
                      <span className="ml-auto text-[11px] text-navy-800/40">{timeAgo(a.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}

          {tab === "searches" && (searches === null ? loading : searches.length === 0 ? (
            <EmptyState icon={Search} title="No saved searches" text="Set your filters on the Buy or Rent page and tap 'Save search & get alerts'." primary={{ label: "Find homes", href: "/properties" }} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {searches.map((s) => (
                <div key={s.id} className="card-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg text-navy-900">{s.name}</div>
                      <div className="mt-0.5 text-sm text-navy-800/60">{s.summary}</div>
                    </div>
                    <button onClick={() => deleteSearch(s)} aria-label="Delete search" className="rounded-lg p-2 text-navy-800/40 hover:bg-coral-500/10 hover:text-coral-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy-900/8 pt-4">
                    <button onClick={() => toggleSearch(s)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${s.alert_enabled ? "bg-teal-500/10 text-teal-700" : "bg-navy-900/8 text-navy-800/60"}`}>
                      {s.alert_enabled ? <><BellRing size={13} /> Alerts on</> : <><BellOff size={13} /> Alerts off</>}
                    </button>
                    <Link href={searchHref(s.filters)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline">
                      See {s.matches} {s.matches === 1 ? "home" : "homes"} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {tab === "watches" && (watches === null ? loading : watches.length === 0 ? (
            <EmptyState icon={BellRing} title="Not watching any prices" text="Open a property and tap 'Alert me if the price drops'. We'll tell you the moment it gets cheaper." primary={{ label: "Browse properties", href: "/properties" }} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {watches.map((w) => {
                const diff = Number(w.price) - Number(w.price_at_watch);
                return (
                  <div key={w.property_id} className="card-surface flex gap-4 p-3">
                    <img src={w.cover_image_url || "/brand/gharaashra-app-icon.png"} alt="" className="h-24 w-28 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1 py-1">
                      <Link href={`/properties/${w.slug}`} className="block truncate font-display text-[17px] text-navy-900 hover:text-teal-600">{w.title}</Link>
                      <div className="mt-1 text-sm">
                        <span className="font-semibold text-navy-900">{money(w.price)}</span>
                        <span className={`ml-2 text-xs font-semibold ${diff < 0 ? "text-teal-600" : diff > 0 ? "text-coral-600" : "text-navy-800/45"}`}>
                          {diff < 0 ? `↓ ${money(-diff)} since you started watching` : diff > 0 ? `↑ ${money(diff)}` : "No change yet"}
                        </span>
                      </div>
                      <button onClick={() => unwatch(w)} className="mt-2 text-xs font-semibold text-navy-800/50 hover:text-coral-600">Stop watching</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
