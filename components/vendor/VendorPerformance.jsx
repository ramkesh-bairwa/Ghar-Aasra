"use client";

import Link from "next/link";
import { Trophy, Eye, Inbox, Percent, Lightbulb, BarChart3, Pencil, Building2 } from "lucide-react";
import { LISTING_STATUS, leadsFor, conversion, pct, StrengthRing, EmptyState } from "./vendorShared";

function Bar({ value, max, className }) {
  const w = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-900/5">
      <div className={`h-full rounded-full ${className} transition-[width] duration-700`} style={{ width: `${w}%` }} />
    </div>
  );
}

export default function VendorPerformance({ properties }) {
  if (properties.length === 0) {
    return <EmptyState Icon={BarChart3} title="Nothing to compare yet" text="Once your listings start getting views and leads, you'll see how they stack up here." />;
  }

  const rows = properties
    .map((p) => {
      const leads = leadsFor(p);
      return { ...p, leads, conv: conversion(leads, p.views) };
    })
    .sort((a, b) => b.leads - a.leads || b.views - a.views);

  const maxViews = Math.max(1, ...rows.map((r) => r.views));
  const maxLeads = Math.max(1, ...rows.map((r) => r.leads));
  const maxConv = Math.max(1, ...rows.map((r) => r.conv));
  const best = rows[0].leads > 0 || rows[0].views > 0 ? rows[0] : null;

  // Aggregate improvement tips across all listings, most common first.
  const tipCounts = {};
  for (const p of properties) for (const t of p.tips || []) tipCounts[t] = (tipCounts[t] || 0) + 1;
  const topTips = Object.entries(tipCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-1">
        {best ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-5 text-white shadow-card">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/25 blur-2xl" />
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30">
              <Trophy size={12} /> Best performer
            </span>
            <div className="relative mt-4 flex gap-3">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-white/10">
                {best.image ? <img src={best.image} alt="" className="h-full w-full object-cover" /> : <Building2 className="m-auto mt-4 text-white/40" />}
              </div>
              <div className="min-w-0">
                <div className="line-clamp-2 font-display text-lg leading-snug">{best.title}</div>
                <div className="text-xs text-white/55">{best.city}</div>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Views", best.views.toLocaleString()],
                ["Leads", best.leads],
                ["Conv.", pct(best.conv)],
              ].map(([label, v]) => (
                <div key={label} className="rounded-xl bg-white/10 py-2 ring-1 ring-white/10">
                  <div className="font-display text-xl">{v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 text-sm text-navy-800/60 shadow-soft ring-1 ring-navy-900/5">
            No views or leads yet — share your listing links to get the ball rolling.
          </div>
        )}

        {topTips.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5">
            <h3 className="flex items-center gap-2 font-semibold text-navy-900">
              <Lightbulb size={16} className="text-amber-500" /> Quick wins
            </h3>
            <p className="mt-0.5 text-xs text-navy-800/50">The most common gaps across your listings.</p>
            <ul className="mt-3 space-y-2">
              {topTips.map(([tip, n]) => (
                <li key={tip} className="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-3 py-2 text-sm ring-1 ring-navy-900/5">
                  <span className="text-navy-900">{tip}</span>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {n} listing{n === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-navy-900">Listing comparison</h3>
          <div className="flex flex-wrap gap-3 text-[11px] font-medium text-navy-800/60">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Views</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-500" /> Leads</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-coral-500" /> Conversion</span>
          </div>
        </div>
        <div className="mt-4 divide-y divide-navy-900/5">
          {rows.map((r, i) => {
            const status = LISTING_STATUS[r.status] || LISTING_STATUS.draft;
            return (
              <div key={r.id} className={`py-4 first:pt-0 last:pb-0`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 && best ? "bg-amber-400 text-navy-950" : "bg-navy-900/5 text-navy-800/60"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-navy-900">{r.title}</span>
                      <span className={`hidden shrink-0 items-center gap-1 text-[11px] text-navy-800/50 sm:flex`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                      </span>
                    </div>
                  </div>
                  <StrengthRing score={r.strength} size={34} stroke={4}>
                    <span className="text-[10px]">{r.strength}</span>
                  </StrengthRing>
                  <Link href={`/vendor/properties/${r.id}/edit`} className="hidden h-8 w-8 items-center justify-center rounded-lg text-navy-800/50 ring-1 ring-navy-900/10 hover:text-teal-600 sm:flex" title="Edit">
                    <Pencil size={13} />
                  </Link>
                </div>
                <div className="mt-3 space-y-1.5 pl-10">
                  {[
                    { Icon: Eye, label: "Views", value: r.views, max: maxViews, cls: "bg-sky-500", text: r.views.toLocaleString() },
                    { Icon: Inbox, label: "Leads", value: r.leads, max: maxLeads, cls: "bg-teal-500", text: r.leads },
                    { Icon: Percent, label: "Conv.", value: r.conv, max: maxConv, cls: "bg-coral-500", text: pct(r.conv) },
                  ].map(({ Icon, label, value, max, cls, text }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="flex w-14 shrink-0 items-center gap-1 text-navy-800/50"><Icon size={11} /> {label}</span>
                      <Bar value={value} max={max} className={cls} />
                      <span className="w-12 shrink-0 text-right font-semibold text-navy-900">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
