"use client";

import { MessageSquare, PhoneCall, CalendarCheck, CalendarClock } from "lucide-react";

export const LISTING_STATUS = {
  published: { label: "Live", dot: "bg-teal-500", ribbon: "bg-teal-500 text-white", pill: "bg-teal-500/15 text-teal-700 ring-teal-500/30" },
  under_offer: { label: "Under offer", dot: "bg-amber-500", ribbon: "bg-amber-500 text-white", pill: "bg-amber-500/15 text-amber-700 ring-amber-500/30" },
  draft: { label: "Paused", dot: "bg-slate-400", ribbon: "bg-navy-900/85 text-white", pill: "bg-navy-900/10 text-navy-800/70 ring-navy-900/15" },
  sold: { label: "Sold", dot: "bg-coral-500", ribbon: "bg-coral-500 text-white", pill: "bg-coral-500/15 text-coral-600 ring-coral-500/30" },
  rented: { label: "Rented", dot: "bg-coral-500", ribbon: "bg-coral-500 text-white", pill: "bg-coral-500/15 text-coral-600 ring-coral-500/30" },
};

export const LEAD_TYPES = {
  enquiry: { label: "Enquiry", Icon: MessageSquare, className: "bg-teal-500/10 text-teal-700 ring-teal-500/20" },
  callback: { label: "Callback", Icon: PhoneCall, className: "bg-amber-500/10 text-amber-700 ring-amber-500/20" },
  visit: { label: "Visit booked", Icon: CalendarCheck, className: "bg-navy-900 text-white ring-navy-900" },
  visit_request: { label: "Visit request", Icon: CalendarClock, className: "bg-coral-500/10 text-coral-600 ring-coral-500/20" },
};

// Statuses a seller may set per lead source (mirrors the PATCH API). Visits
// reach sellers already approved, so the awaiting-review states aren't offered.
export const LEAD_STATUS_OPTIONS = {
  i: ["new", "contacted", "closed"],
  b: ["confirmed", "completed", "cancelled", "no_show"],
  v: ["contacted", "scheduled", "closed"],
};

// Collapses the three different enums into one pipeline for filtering/KPIs.
export const LEAD_STAGE = {
  new: "new", pending: "new",
  contacted: "progress", confirmed: "progress", scheduled: "progress",
  closed: "closed", completed: "closed", cancelled: "closed", no_show: "closed",
};

export const STAGE_STYLE = {
  new: "bg-coral-500/15 text-coral-600 ring-coral-500/25",
  progress: "bg-amber-500/15 text-amber-700 ring-amber-500/25",
  closed: "bg-teal-500/15 text-teal-700 ring-teal-500/25",
};

export const statusLabel = (s) => String(s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(String(value).trim().replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, withTime = false) {
  const d = parseDate(value);
  if (!d) return value ? String(value) : "";
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return "";
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(value);
}

export function formatPrice(p, symbol) {
  const suffix = p.pricePeriod === "monthly" ? "/mo" : p.pricePeriod === "yearly" ? "/yr" : "";
  return `${symbol}${Number(p.price || 0).toLocaleString("en-US")}${suffix}`;
}

export const leadsFor = (p) => (p.enquiries || 0) + (p.visits || 0);

export function conversion(leads, views) {
  if (!views) return 0; // no views yet — not a meaningful rate
  return Math.min(100, (leads / views) * 100);
}

export const pct = (n) => `${n >= 10 || n === 0 ? Math.round(n) : n.toFixed(1)}%`;

export function strengthTone(score) {
  if (score >= 80) return { stroke: "stroke-teal-500", text: "text-teal-600", bar: "bg-teal-500", label: "Excellent" };
  if (score >= 55) return { stroke: "stroke-amber-500", text: "text-amber-600", bar: "bg-amber-500", label: "Good" };
  return { stroke: "stroke-coral-500", text: "text-coral-600", bar: "bg-coral-500", label: "Needs work" };
}

export function StrengthRing({ score, size = 56, stroke = 6, dark = false, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = strengthTone(score);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={dark ? "stroke-white/15" : "stroke-navy-900/10"} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className={`${tone.stroke} transition-[stroke-dashoffset] duration-700`}
          strokeDasharray={c} strokeDashoffset={c - (c * Math.max(0, Math.min(100, score))) / 100}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${dark ? "text-white" : "text-navy-900"}`}>
        {children ?? score}
      </div>
    </div>
  );
}

export function Initial({ name, className = "" }) {
  const letter = (String(name || "?").trim()[0] || "?").toUpperCase();
  const palette = ["bg-teal-500/15 text-teal-700", "bg-coral-500/15 text-coral-600", "bg-amber-500/15 text-amber-700", "bg-navy-900 text-teal-400", "bg-sky-500/15 text-sky-700"];
  const tone = palette[letter.charCodeAt(0) % palette.length];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${tone} ${className}`}>
      {letter}
    </span>
  );
}

export function EmptyState({ Icon, title, text, children }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-10 text-center shadow-soft ring-1 ring-navy-900/5 md:p-14">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 text-teal-600 ring-1 ring-teal-500/20">
        <Icon size={28} />
      </span>
      <h3 className="mt-4 font-display text-2xl text-navy-900">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-navy-800/60">{text}</p>}
      {children}
    </div>
  );
}
