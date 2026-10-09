"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Search, BellRing, Users, Bell, AlertCircle, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import { useMoney, formatDay } from "@/components/admin/sellerAdminUI";

export default function AdminDemandPage() {
  return (
    <AdminGate>
      <DemandReport />
    </AdminGate>
  );
}

// Horizontal bars, one series → one hue, no legend (the card title names
// it). Values in text ink beside each bar; hover shows the exact share.
function BarList({ title, rows, empty = "No data yet" }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card-surface p-5">
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-navy-800/45">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.label} className="group" title={`${r.label}: ${r.count} of ${total} (${Math.round((r.count / total) * 100)}%)`}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate capitalize text-navy-800/75">{r.label}</span>
                <span className="font-semibold text-navy-900">{r.count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-navy-900/[0.06]">
                <div className="h-2 rounded-full bg-teal-500 transition-colors group-hover:bg-teal-600" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function searchHref(f) {
  const base = { sale: "/buy", rent: "/rent", commercial: "/commercial" }[f.listingType] || "/properties";
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => k !== "listingType" && v != null && v !== "")).toString();
  return qs ? `${base}?${qs}` : base;
}

function DemandReport() {
  const money = useMoney();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/demand", { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setData(j); })
      .catch((e) => setError(e.message || "Could not load demand data."));
  }, []);

  if (error) return <div className="flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700"><AlertCircle size={16} /> {error}</div>;
  if (!data) return <div className="flex items-center justify-center gap-2 py-24 text-sm text-navy-800/50"><Loader2 size={16} className="animate-spin" /> Crunching buyer demand…</div>;

  const t = data.totals;
  const shortages = data.gaps.filter((g) => g.listings < g.buyers);

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Buyer Demand</h1>
      <p className="mt-1 text-sm text-navy-800/55">What buyers are searching for and watching, from saved searches and price alerts. Use it to decide which areas and budgets to bring more listings for.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { l: "Saved searches", v: t.searches, I: Search },
          { l: "Alerts switched on", v: t.active_alerts, I: BellRing },
          { l: "Buyers saving searches", v: t.users, I: Users },
          { l: "Price watches", v: t.watches, I: TrendingUp },
          { l: "Alerts sent (30 days)", v: t.alerts_30d, I: Bell },
        ].map(({ l, v, I }) => (
          <div key={l} className="card-surface p-4">
            <I size={17} className="text-teal-600" />
            <div className="mt-2 font-display text-2xl text-navy-900">{v.toLocaleString("en-IN")}</div>
            <div className="text-xs text-navy-800/55">{l}</div>
          </div>
        ))}
      </div>

      {t.searches === 0 ? (
        <div className="card-surface mt-5 px-6 py-14 text-center">
          <Search size={26} className="mx-auto text-navy-800/25" />
          <p className="mt-2 text-sm text-navy-800/55">No saved searches yet. As buyers use "Save search & get alerts" on the Buy and Rent pages, their demand shows up here.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 card-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-900/8 px-5 py-4">
              <div>
                <h2 className="font-display text-lg text-navy-900">Demand vs. supply</h2>
                <p className="text-xs text-navy-800/50">Most common searches and how many live listings match them today.</p>
              </div>
              {shortages.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700"><AlertTriangle size={13} /> {shortages.length} with more buyers than listings</span>}
            </div>
            <table className="w-full text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wide text-navy-800/40"><th className="px-5 py-2 font-medium">Search</th><th className="px-5 py-2 font-medium">Buyers</th><th className="px-5 py-2 font-medium">Live listings</th><th className="px-5 py-2" /></tr></thead>
              <tbody>
                {data.gaps.map((g) => {
                  const short = g.listings < g.buyers;
                  return (
                    <tr key={g.summary} className="border-t border-navy-900/5">
                      <td className="px-5 py-2.5 text-navy-900">{g.summary}</td>
                      <td className="px-5 py-2.5 font-semibold text-navy-900">{g.buyers}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${g.listings === 0 ? "bg-coral-500/10 text-coral-600" : short ? "bg-amber-500/15 text-amber-700" : "bg-teal-500/10 text-teal-600"}`}>
                          {g.listings === 0 ? <AlertTriangle size={11} /> : null} {g.listings}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right"><Link href={searchHref(g.filters)} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline">See results <ExternalLink size={11} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <BarList title="Top cities & localities" rows={data.byCity} />
            <BarList title="Budget (buy searches)" rows={data.byBudget} empty="No buy searches with a budget yet" />
            <BarList title="Bedrooms" rows={data.byBedrooms} />
            <BarList title="Buy vs rent" rows={[...data.byType, ...data.byPropertyType.map((r) => ({ ...r, label: `Type: ${r.label}` }))]} />
          </div>
        </>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card-surface overflow-hidden">
          <div className="border-b border-navy-900/8 px-5 py-3 font-display text-lg text-navy-900">Most-watched listings</div>
          {data.watched.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-navy-800/50">Nobody is watching a price yet.</p>
          ) : (
            <ul className="divide-y divide-navy-900/5">
              {data.watched.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <Link href={`/properties/${w.slug}`} target="_blank" className="min-w-0 truncate font-medium text-navy-900 hover:text-teal-600">{w.title}</Link>
                  <span className="shrink-0 text-xs text-navy-800/55">{money(w.price)} · <b className="text-navy-900">{w.watchers}</b> watching</span>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-navy-900/5 px-5 py-2.5 text-[11px] text-navy-800/45">Tip: a small price drop on a well-watched listing alerts every watcher at once.</p>
        </div>

        <div className="card-surface overflow-hidden">
          <div className="border-b border-navy-900/8 px-5 py-3 font-display text-lg text-navy-900">Latest saved searches</div>
          {data.recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-navy-800/50">None yet.</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-navy-900/5 overflow-y-auto">
              {data.recent.map((s) => (
                <li key={s.id} className="px-5 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-navy-900">{s.summary}</span>
                    <span className="shrink-0 text-[11px] text-navy-800/45">{formatDay(s.created_at)}</span>
                  </div>
                  <div className="text-xs text-navy-800/50">{s.user}{s.contact ? ` · ${s.contact}` : ""}{s.alert ? " · alerts on" : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
