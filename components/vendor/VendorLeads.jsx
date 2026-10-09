"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Phone, Mail, MessageCircle, Inbox, CalendarClock, Loader2, Clock, BadgeCheck, Search } from "lucide-react";
import {
  LEAD_TYPES, LEAD_STATUS_OPTIONS, LEAD_STAGE, STAGE_STYLE, statusLabel, formatDate, timeAgo, Initial, EmptyState,
} from "./vendorShared";

const STAGES = [
  { key: "all", label: "All statuses" },
  { key: "new", label: "New" },
  { key: "progress", label: "In progress" },
  { key: "closed", label: "Closed" },
];

function LeadCard({ lead, saving, onStatus }) {
  const type = LEAD_TYPES[lead.type] || LEAD_TYPES.enquiry;
  const stage = LEAD_STAGE[lead.status] || "new";
  const options = LEAD_STATUS_OPTIONS[String(lead.id)[0]] || [];
  const phoneDigits = (lead.phone || "").replace(/[^\d]/g, "");
  const greeting = encodeURIComponent(`Hi ${lead.name || ""}, thanks for your interest in "${lead.propertyTitle}".`);

  return (
    <article className={`relative overflow-hidden rounded-2xl bg-white p-4 shadow-soft ring-1 transition-shadow hover:shadow-card md:p-5 ${stage === "new" ? "ring-coral-500/30" : "ring-navy-900/5"}`}>
      {stage === "new" && <span className="absolute inset-y-0 left-0 w-1 bg-coral-500" />}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Initial name={lead.name} className="h-11 w-11 text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-navy-900">{lead.name || "Guest"}</span>
              {lead.bookingCode && (
                <span className="rounded-md bg-navy-900 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-white" title="Booking ID">{lead.bookingCode}</span>
              )}
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${type.className}`}>
                <type.Icon size={11} /> {type.label}
              </span>
              {(lead.type === "visit" || lead.type === "visit_request") && (
                <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-600 ring-1 ring-teal-500/20">
                  <BadgeCheck size={11} /> Approved by admin
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-navy-800/45" title={formatDate(lead.createdAt, true)}>
                <Clock size={11} /> {timeAgo(lead.createdAt)}
              </span>
            </div>
            <Link href={`/properties/${lead.propertySlug}`} target="_blank" className="mt-0.5 block truncate text-sm font-medium text-teal-600 hover:text-teal-700">
              {lead.propertyTitle}
            </Link>
            {lead.note && (
              <p className="mt-2 line-clamp-3 rounded-xl bg-sand-50 px-3 py-2 text-sm text-navy-800/75 ring-1 ring-navy-900/5">
                &ldquo;{lead.note}&rdquo;
              </p>
            )}
            {lead.scheduledAt && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy-900/5 px-2.5 py-1 text-xs font-semibold text-navy-900">
                <CalendarClock size={13} className="text-teal-600" />
                {lead.type === "visit"
                  ? `Visit: ${formatDate(lead.scheduledAt, true)}`
                  : `Preferred: ${formatDate(lead.scheduledAt.slice(0, 10))} ${clockTime(lead.scheduledAt.slice(11))}`.trim()}
              </div>
            )}
            {(lead.phone || lead.email) && (
              <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-navy-800/50">
                {lead.phone && <span>{lead.phone}</span>}
                {lead.email && <span className="truncate">{lead.email}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:w-56">
          <label className="relative">
            <span className="sr-only">Lead status</span>
            <select
              value={lead.status}
              onChange={(e) => onStatus(lead, e.target.value)}
              disabled={saving}
              className={`w-full appearance-none rounded-xl px-3 py-2 pr-8 text-sm font-semibold capitalize ring-1 focus:outline-none focus:ring-2 focus:ring-teal-500 ${STAGE_STYLE[stage]}`}
            >
              {options.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin" /> : "▾"}
            </span>
          </label>
          <div className="flex gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/10 hover:ring-teal-500" title="Call">
                <Phone size={14} /> <span className="md:hidden lg:inline">Call</span>
              </a>
            )}
            {phoneDigits && (
              <a href={`https://wa.me/${phoneDigits}?text=${greeting}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:opacity-90" title="WhatsApp">
                <MessageCircle size={14} /> <span className="md:hidden lg:inline">Chat</span>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: ${lead.propertyTitle}`)}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/10 hover:text-teal-600 hover:ring-teal-500" title={lead.email}>
                <Mail size={14} /> <span className="md:hidden lg:inline">Email</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// "11:00" / "14:30:00" -> "11:00 AM" / "2:30 PM" (other text passes through).
function clockTime(value) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(value || "").trim());
  if (!m) return String(value || "");
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

export default function VendorLeads({ leads, savingId, onStatus }) {
  const [type, setType] = useState("all");
  const [stage, setStage] = useState("all");
  const [search, setSearch] = useState("");

  const typeCounts = useMemo(() => {
    const c = { all: leads.length };
    for (const l of leads) c[l.type] = (c[l.type] || 0) + 1;
    return c;
  }, [leads]);

  const q = search.trim().toLowerCase();
  const visible = leads.filter(
    (l) =>
      (type === "all" || l.type === type) &&
      (stage === "all" || (LEAD_STAGE[l.status] || "new") === stage) &&
      (!q || [l.bookingCode, l.name, l.phone, l.email, l.propertyTitle].some((v) => String(v || "").toLowerCase().includes(q)))
  );

  if (leads.length === 0) {
    return (
      <EmptyState
        Icon={Inbox}
        title="No leads yet"
        text="Enquiries, callback requests and visit bookings on your listings will land here. Stronger listings — more photos, a video and a detailed description — attract more buyers."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[["all", "All leads"], ...Object.entries(LEAD_TYPES).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors ${
                type === key ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-navy-800/70 ring-navy-900/10 hover:ring-teal-500"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-[11px] ${type === key ? "bg-white/20" : "bg-navy-900/5"}`}>{typeCounts[key] || 0}</span>
            </button>
          ))}
        </div>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-navy-900/10">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStage(s.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${stage === s.key ? "bg-teal-500 text-white" : "text-navy-800/60 hover:text-navy-900"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4">
        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-800/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking ID (e.g. BK-7KQ3M9), name or phone"
          className="w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-navy-900/10 placeholder:text-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="mt-4 space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-navy-800/55 shadow-soft ring-1 ring-navy-900/5">
            No leads match these filters.
            <button type="button" onClick={() => { setType("all"); setStage("all"); setSearch(""); }} className="ml-1 font-semibold text-teal-600 hover:text-teal-700">Show all</button>
          </div>
        ) : (
          visible.map((l) => <LeadCard key={l.id} lead={l} saving={savingId === l.id} onStatus={onStatus} />)
        )}
      </div>
    </div>
  );
}
