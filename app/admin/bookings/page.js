"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import Pagination from "@/components/admin/Pagination";
import EmptyState from "@/components/EmptyState";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { useDialog } from "@/components/ConfirmDialog";
import { formatSlotLabel } from "@/lib/visitSlots";
import {
  AlertCircle, Search, Phone, MessageCircle, Video, Car, StickyNote, Trash2, BellRing,
  CheckCircle2, XCircle, Send, Store, CalendarCheck, Clock, Hourglass, Trophy, RefreshCw, Download,
  ExternalLink, MoreHorizontal, UserX, Footprints, AlertTriangle, CalendarX2,
} from "lucide-react";
import { TableSkeletonRows } from "@/components/admin/AdminSkeleton";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];
// "Confirmed" is the admin's approval: it also sends the visit to the listing's seller.
const STATUS_LABELS = { pending: "Awaiting approval", confirmed: "Approved", completed: "Visited", cancelled: "Cancelled", no_show: "No-show" };
const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-700 ring-amber-500/25",
  confirmed: "bg-teal-500/15 text-teal-700 ring-teal-500/25",
  completed: "bg-navy-900/8 text-navy-800/75 ring-navy-900/10",
  cancelled: "bg-coral-500/10 text-coral-600 ring-coral-500/20",
  no_show: "bg-coral-500/10 text-coral-600 ring-coral-500/20",
};
// Left row border per status, so the pipeline reads at a glance.
const ACCENT = {
  pending: { border: "border-l-amber-500" },
  confirmed: { border: "border-l-teal-500" },
  completed: { border: "border-l-navy-900/25" },
  cancelled: { border: "border-l-coral-500/50" },
  no_show: { border: "border-l-coral-500/50" },
};

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Needs approval" },
  { key: "followup", label: "Follow up" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

const REFRESH_MS = 60000;

function pad(n) {
  return String(n).padStart(2, "0");
}
function dayKeyOf(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function ts(row) {
  return new Date(row.scheduled_at.replace(" ", "T")).getTime();
}

function when(row) {
  const date = new Date(`${row.scheduled_at.slice(0, 10)}T00:00:00`);
  return `${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${formatSlotLabel(row.scheduled_at.slice(11, 16))}`;
}

function dayHeading(key, today) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === today) return "Today";
  if (key === dayKeyOf(tomorrow)) return "Tomorrow";
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// "in 2 h" / "3 d ago" relative to the browser clock (bookings store the
// visitor's local wall-clock time, same as this admin's browser).
function relative(row, now) {
  const diffMin = Math.round((ts(row) - now) / 60000);
  const abs = Math.abs(diffMin);
  const unit = abs < 60 ? `${abs} min` : abs < 1440 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} d`;
  return diffMin >= 0 ? `in ${unit}` : `${unit} ago`;
}

function initials(name) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// Customers often type a local 10-digit number; wa.me needs the country code.
// Borrow it from the business's own WhatsApp number when lengths suggest so.
function waNumber(customerPhone, sitePhone) {
  const digits = String(customerPhone || "").replace(/[^\d]/g, "");
  const site = String(sitePhone || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.length === 10 && site.length > 10) return site.slice(0, site.length - 10) + digits;
  return digits;
}

function toCsv(rows) {
  const cols = [
    ["Booking ID", (r) => r.booking_code || r.id],
    ["Visit date", (r) => r.scheduled_at],
    ["Status", (r) => STATUS_LABELS[r.status]],
    ["Type", (r) => (r.visit_type === "video" ? "Video tour" : "Site visit")],
    ["Customer", (r) => r.customer_name],
    ["Phone", (r) => r.customer_phone],
    ["Email", (r) => r.customer_email],
    ["Property", (r) => r.property_title],
    ["Seller", (r) => r.seller_name],
    ["Pickup", (r) => (r.pickup_required ? r.pickup_address || "Yes" : "")],
    ["Customer note", (r) => r.notes],
    ["Team note", (r) => r.admin_notes],
    ["Booked at", (r) => r.created_at],
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.map(([h]) => esc(h)).join(","), ...rows.map((r) => cols.map(([, f]) => esc(f(r))).join(","))].join("\n");
}

export default function AdminBookingsPage() {
  return (
    <AdminGate>
      <BookingsManager />
    </AdminGate>
  );
}

function BookingsManager() {
  const settings = useSiteSettings();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("upcoming");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [noteEditing, setNoteEditing] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const { confirm: ask, alert: notify, dialog } = useDialog();

  async function load({ quiet = false } = {}) {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    const res = await fetch("/api/admin/bookings", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setRows(data.rows);
    else setError(data.error || "Could not load bookings.");
    setNow(Date.now());
    setLoading(false);
    setRefreshing(false);
  }

  // New leads appear without a manual reload; "in 2 h" labels stay current.
  useEffect(() => {
    load();
    const t = setInterval(() => load({ quiet: true }), REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  async function update(id, patch) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return notify({ title: "Update failed", message: (await res.json().catch(() => ({}))).error || "Please try again.", tone: "danger" });
    // Mirror the server: approving stamps approved_at, back to pending clears it.
    const approval = ["confirmed", "completed", "no_show"].includes(patch.status)
      ? { approved_at: new Date().toISOString() }
      : patch.status === "pending" ? { approved_at: null } : {};
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch, ...(r.approved_at && approval.approved_at ? {} : approval) } : r)));
  }

  async function remove(row) {
    const ok = await ask({
      title: "Delete this booking?",
      message: `The booking${row.booking_code ? ` ${row.booking_code}` : ""} for ${row.customer_name || "this customer"} will be removed permanently. This cannot be undone.`,
      confirmLabel: "Delete booking",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/bookings/${row.id}`, { method: "DELETE" });
    if (res.ok) setRows((list) => list.filter((r) => r.id !== row.id));
    else notify({ title: "Delete failed", message: "The booking could not be deleted. Please try again.", tone: "danger" });
  }

  async function reject(row) {
    const ok = await ask({
      title: "Reject this visit?",
      message: `${row.customer_name || "The customer"}'s visit request will be marked cancelled and won't be sent to the seller.`,
      confirmLabel: "Reject visit",
    });
    if (ok) update(row.id, { status: "cancelled" });
  }

  const today = dayKeyOf(new Date(now));
  const monthKey = today.slice(0, 7);

  const inView = (r, v) => {
    const t = ts(r);
    if (v === "today") return r.scheduled_at.slice(0, 10) === today;
    if (v === "upcoming") return ["pending", "confirmed"].includes(r.status) && t >= now;
    if (v === "pending") return r.status === "pending" && t >= now;
    // Visit time has passed but nobody recorded the outcome yet.
    if (v === "followup") return ["pending", "confirmed"].includes(r.status) && t < now;
    if (v === "past") return t < now;
    return true;
  };

  const counts = useMemo(() => {
    const c = Object.fromEntries(VIEWS.map((v) => [v.key, 0]));
    let visitedMonth = 0;
    let decidedMonth = 0;
    for (const r of rows) {
      for (const v of VIEWS) if (inView(r, v.key)) c[v.key]++;
      if (r.scheduled_at.slice(0, 7) === monthKey && ["completed", "no_show"].includes(r.status)) {
        decidedMonth++;
        if (r.status === "completed") visitedMonth++;
      }
    }
    c.today = rows.filter((r) => r.scheduled_at.slice(0, 10) === today && r.status !== "cancelled").length;
    return { ...c, visitedMonth, showRate: decidedMonth ? Math.round((visitedMonth / decidedMonth) * 100) : null };
  }, [rows, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = rows
    .filter((r) => inView(r, view))
    .filter((r) => !type || r.visit_type === type)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [r.booking_code, r.customer_name, r.customer_phone, r.customer_email, r.property_title].some((v) =>
        String(v || "").toLowerCase().includes(q)
      );
    });
  // Upcoming-type views read best soonest-first; past/all newest-first.
  if (["today", "upcoming", "pending"].includes(view)) filtered.reverse();

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Group the visible page by visit day for scannable "Today / Tomorrow" sections.
  const groups = [];
  for (const row of paged) {
    const key = row.scheduled_at.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.rows.push(row);
    else groups.push({ key, rows: [row] });
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visit-leads-${view}-${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function waLink(row, kind) {
    const number = waNumber(row.customer_phone, settings.contact_whatsapp);
    if (!number) return null;
    const visit = row.visit_type === "video" ? "video tour" : "visit";
    const text =
      kind === "confirm"
        ? `Hi ${row.customer_name}, your ${visit} for "${row.property_title}" is confirmed for ${when(row)}.${
            row.visit_type === "video" ? " We'll send the video call link shortly." : row.property_address ? ` Address: ${row.property_address}.` : ""
          } Reply here if you need to change the time. — ${settings.site_title}`
        : `Hi ${row.customer_name}, a friendly reminder of your ${visit} for "${row.property_title}" on ${when(row)}. See you soon! — ${settings.site_title}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }

  const kpis = [
    { label: "Visits today", value: counts.today, view: "today", Icon: CalendarCheck, tone: "bg-teal-500/10 text-teal-600" },
    { label: "Needs approval", value: counts.pending, view: "pending", Icon: Hourglass, tone: "bg-amber-500/15 text-amber-700", alert: counts.pending > 0 },
    { label: "Upcoming", value: counts.upcoming, view: "upcoming", Icon: Clock, tone: "bg-navy-900/8 text-navy-800" },
    { label: "Follow up", value: counts.followup, view: "followup", Icon: AlertTriangle, tone: "bg-coral-500/10 text-coral-600", alert: counts.followup > 0 },
    {
      label: "Visited this month",
      value: counts.visitedMonth,
      view: "past",
      Icon: Trophy,
      tone: "bg-purple-500/15 text-purple-700",
      sub: counts.showRate !== null ? `${counts.showRate}% show-up` : null,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Visit Bookings</h1>
          <p className="mt-0.5 text-sm text-navy-800/55">
            Visits booked from property pages. Approve each one to send it to the listing&rsquo;s seller as a lead.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load({ quiet: true })}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-navy-800 ring-1 ring-navy-900/10 hover:ring-teal-500/50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filtered.length}
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-950 disabled:opacity-40"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map(({ label, value, view: v, Icon, tone, alert, sub }) => (
          <button
            key={label}
            type="button"
            onClick={() => { setView(v); setPage(1); }}
            className={`flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-left ring-1 transition-shadow hover:shadow-soft ${
              view === v ? "ring-2 ring-teal-500" : alert ? "ring-amber-500/50" : "ring-navy-900/8"
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-2xl leading-tight text-navy-900">
                {loading ? <span className="skeleton inline-block h-6 w-8 align-middle" /> : value}
              </span>
              <span className="block truncate text-xs text-navy-800/55">
                {label}
                {sub && <span className="text-navy-800/40"> · {sub}</span>}
              </span>
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-coral-500/30 bg-coral-500/5 p-3 text-sm text-coral-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Table card */}
      <div className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-navy-900/8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-900/8 p-3">
          <div className="flex flex-wrap gap-1">
            {VIEWS.map((v) => {
              const active = view === v.key;
              const n = counts[v.key];
              const warn = (v.key === "pending" || v.key === "followup") && n > 0;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => { setView(v.key); setPage(1); }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-navy-900 text-white" : "text-navy-800/65 hover:bg-sand-100 hover:text-navy-900"
                  }`}
                >
                  {v.label}
                  {!loading && n > 0 && (
                    <span
                      className={`rounded px-1.5 text-[11px] font-semibold ${
                        active ? "bg-white/20 text-white" : warn ? "bg-amber-500/20 text-amber-800" : "bg-navy-900/8 text-navy-800/60"
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="rounded-lg border border-navy-900/10 bg-white px-3 py-2 text-sm text-navy-800 focus:outline-none"
            >
              <option value="">All visit types</option>
              <option value="in_person">Site visits</option>
              <option value="video">Video tours</option>
            </select>
            <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search ID, name, phone, property"
                className="w-full rounded-lg border border-navy-900/10 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>
        </div>

        {view === "followup" && counts.followup > 0 && (
          <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800">
            <AlertTriangle size={15} className="shrink-0" />
            These visit times have passed but the outcome isn&apos;t recorded. Mark each one Visited or No-show.
          </div>
        )}

        <div className="overflow-x-auto">
          {/* Fixed layout: customer and property share the flexible width and
              truncate, so actions never get pushed out of view. */}
          <table className="w-full min-w-[960px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[132px]" />
              <col />
              <col />
              <col className="w-[292px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-navy-900/8 bg-sand-50 text-xs uppercase tracking-wide text-navy-800/45">
                <th className="px-3 py-3 pl-4 font-medium">Booking</th>
                <th className="px-3 py-3 font-medium">Visit</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Property</th>
                <th className="px-3 py-3 pr-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows cols={5} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      compact
                      icon={CalendarX2}
                      title={search || type ? "No leads match these filters" : "No bookings in this view"}
                      text={search || type ? "Try a different search or visit type." : "New visits booked on property pages show up here automatically."}
                    />
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <GroupRows
                    key={g.key}
                    heading={dayHeading(g.key, today)}
                    rows={g.rows}
                    now={now}
                    waLink={waLink}
                    onUpdate={update}
                    onRemove={remove}
                    onReject={reject}
                    noteEditing={noteEditing}
                    setNoteEditing={setNoteEditing}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
      />
      {dialog}
    </div>
  );
}

function GroupRows({ heading, rows, ...rest }) {
  return (
    <>
      <tr className="border-b border-navy-900/5 bg-sand-50/60">
        <td colSpan={5} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-navy-800/50">
          {heading} <span className="font-normal normal-case tracking-normal text-navy-800/40">· {rows.length} visit{rows.length > 1 ? "s" : ""}</span>
        </td>
      </tr>
      {rows.map((row) => (
        <BookingRow key={row.id} row={row} {...rest} />
      ))}
    </>
  );
}

const iconBtn = "flex h-8 w-8 items-center justify-center rounded-lg transition-opacity hover:opacity-85";

function BookingRow({ row, now, waLink, onUpdate, onRemove, onReject, noteEditing, setNoteEditing }) {
  const [menu, setMenu] = useState(null); // {top, right} when open
  const past = ts(row) < now;
  const open = ["pending", "confirmed"].includes(row.status);
  const overdue = open && past;
  const soon = open && !past && ts(row) - now < 3 * 3600000;
  const phoneHref = row.customer_phone ? `tel:${row.customer_phone.replace(/[^\d+]/g, "")}` : null;
  const confirmHref = waLink(row, "confirm");
  const reminderHref = waLink(row, "reminder");
  const date = new Date(`${row.scheduled_at.slice(0, 10)}T00:00:00`);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", close);
    };
  }, [menu]);

  // The table scrolls horizontally, which would clip an absolutely
  // positioned dropdown — so the menu is fixed to the viewport instead.
  function toggleMenu(e) {
    if (menu) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    const openUp = window.innerHeight - r.bottom < 300;
    setMenu({ right: window.innerWidth - r.right, ...(openUp ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) });
  }

  const act = (fn) => (e) => {
    e.preventDefault();
    setMenu(null);
    fn();
  };

  return (
    <>
      <tr className="border-b border-navy-900/5 align-top transition-colors hover:bg-sand-50/70">
        {/* Booking */}
        <td className={`border-l-[3px] py-3 pl-4 pr-2 ${ACCENT[row.status]?.border || "border-l-transparent"}`}>
          {row.booking_code ? (
            <span className="inline-block whitespace-nowrap rounded-md bg-navy-900 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-white">{row.booking_code}</span>
          ) : (
            <span className="text-xs text-navy-800/40">#{row.id}</span>
          )}
          <div className="mt-1.5">
            <span className={`badge-pill whitespace-nowrap px-2 py-0.5 text-[11px] ring-1 ${STATUS_STYLES[row.status]}`}>{STATUS_LABELS[row.status]}</span>
          </div>
          {row.created_at && (
            <div className="mt-1 whitespace-nowrap text-[11px] text-navy-800/40">
              Booked {new Date(row.created_at.replace(" ", "T")).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          )}
        </td>

        {/* Visit time */}
        <td className="whitespace-nowrap px-3 py-3">
          <div className="font-semibold text-navy-900">{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
          <div className="text-navy-800/70">{formatSlotLabel(row.scheduled_at.slice(11, 16))}</div>
          {overdue ? (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-coral-600"><AlertTriangle size={11} /> Follow up</div>
          ) : soon ? (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-teal-600"><Clock size={11} /> {relative(row, now)}</div>
          ) : null}
          <div className="mt-1 flex items-center gap-1 text-xs text-navy-800/60">
            {row.visit_type === "video" ? <Video size={12} /> : <Footprints size={12} />}
            {row.visit_type === "video" ? "Video tour" : "Site visit"}
          </div>
          {!!row.pickup_required && (
            <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-purple-700" title={row.pickup_address || ""}>
              <Car size={12} /> Pickup
            </div>
          )}
        </td>

        {/* Customer */}
        <td className="px-3 py-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-semibold text-teal-400">
              {initials(row.customer_name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-medium text-navy-900">
                <span className="truncate">{row.customer_name || "Unknown"}</span>
                {!!row.is_guest && <span className="shrink-0 rounded bg-sand-100 px-1 text-[10px] font-semibold uppercase text-navy-800/50">Guest</span>}
              </div>
              {row.customer_phone && (
                <a href={phoneHref} className="block text-xs text-navy-800/65 hover:text-teal-600">{row.customer_phone}</a>
              )}
              {row.customer_email && (
                <a href={`mailto:${row.customer_email}`} className="block truncate text-xs text-navy-800/45 hover:text-teal-600">{row.customer_email}</a>
              )}
              {row.notes && (
                <div className="mt-1 truncate text-xs text-navy-800/55" title={row.notes}>
                  <MessageCircle size={11} className="mr-1 inline text-navy-800/35" />{row.notes}
                </div>
              )}
              {row.admin_notes && (
                <div className="mt-1 inline-block max-w-full truncate rounded bg-amber-500/10 px-1.5 py-0.5 align-top text-xs text-amber-800" title={row.admin_notes}>
                  <StickyNote size={11} className="mr-1 inline" />{row.admin_notes}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Property */}
        <td className="px-3 py-3">
          <a href={`/properties/${row.property_slug}`} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2.5">
            {row.property_image ? (
              <img src={row.property_image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-navy-900/10" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-navy-800/30"><Store size={15} /></span>
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-medium text-navy-900 group-hover:text-teal-600">
                <span className="truncate">{row.property_title}</span>
                <ExternalLink size={11} className="shrink-0 text-navy-800/30" />
              </span>
              {row.has_seller ? (
                <span className={`flex items-center gap-1 text-xs ${row.approved_at ? "text-teal-600" : "text-navy-800/45"}`}>
                  {row.approved_at ? <Send size={11} /> : <Store size={11} />}
                  <span className="truncate">{row.approved_at ? `Sent to ${row.seller_name || "seller"}` : `Seller: ${row.seller_name || "—"} (after approval)`}</span>
                </span>
              ) : (
                row.property_address && <span className="block truncate text-xs text-navy-800/45">{row.property_address}</span>
              )}
            </span>
          </a>
        </td>

        {/* Actions */}
        <td className="py-3 pl-2 pr-4">
          <div className="flex items-center justify-end gap-1.5">
            {row.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => onUpdate(row.id, { status: "confirmed" })}
                  title={row.has_seller ? "Approve & send to seller" : "Approve visit"}
                  className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-500 px-3 text-xs font-semibold text-white hover:bg-teal-600"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReject(row)}
                  title="Reject"
                  className={`${iconBtn} bg-coral-500/10 text-coral-600`}
                >
                  <XCircle size={15} />
                </button>
              </>
            )}
            {row.status === "confirmed" && past && (
              <>
                <button
                  type="button"
                  onClick={() => onUpdate(row.id, { status: "completed" })}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 text-xs font-semibold text-white hover:bg-navy-950"
                >
                  <CheckCircle2 size={13} /> Visited
                </button>
                <button type="button" onClick={() => onUpdate(row.id, { status: "no_show" })} title="No-show" className={`${iconBtn} bg-coral-500/10 text-coral-600`}>
                  <UserX size={15} />
                </button>
              </>
            )}
            <span className="mx-0.5 h-5 w-px bg-navy-900/10" />
            {phoneHref && (
              <a href={phoneHref} title="Call" className={`${iconBtn} bg-[#4db6c8] text-white`}>
                <Phone size={14} />
              </a>
            )}
            {confirmHref && (
              <a
                href={confirmHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => row.status === "pending" && onUpdate(row.id, { status: "confirmed" })}
                title={row.status === "pending" ? "Confirm on WhatsApp (also approves)" : "WhatsApp confirmation"}
                className={`${iconBtn} bg-[#25D366] text-white`}
              >
                <MessageCircle size={15} />
              </a>
            )}
            {reminderHref && open && (
              <a href={reminderHref} target="_blank" rel="noopener noreferrer" title="Send reminder on WhatsApp" className={`${iconBtn} bg-[#f0ad4e] text-white`}>
                <BellRing size={14} />
              </a>
            )}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={toggleMenu}
              title="More actions"
              aria-label="More actions"
              className={`${iconBtn} bg-sand-100 text-navy-800/70 hover:opacity-100 hover:bg-navy-900/10`}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          {menu && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              style={{ position: "fixed", right: menu.right, top: menu.top, bottom: menu.bottom }}
              className="z-50 w-52 rounded-xl bg-white p-1.5 text-left shadow-card ring-1 ring-navy-900/10"
            >
              <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-800/40">Set status</div>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={act(() => onUpdate(row.id, { status: s }))}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm hover:bg-sand-100 ${row.status === s ? "font-semibold text-navy-900" : "text-navy-800/75"}`}
                >
                  {STATUS_LABELS[s]} {row.status === s && <CheckCircle2 size={14} className="text-teal-600" />}
                </button>
              ))}
              <div className="my-1 h-px bg-navy-900/8" />
              <button
                type="button"
                onClick={act(() => setNoteEditing({ id: row.id, value: row.admin_notes || "" }))}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-navy-800/75 hover:bg-sand-100"
              >
                <StickyNote size={14} /> {row.admin_notes ? "Edit team note" : "Add team note"}
              </button>
              <button
                type="button"
                onClick={act(() => onRemove(row))}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-coral-600 hover:bg-coral-500/10"
              >
                <Trash2 size={14} /> Delete booking
              </button>
            </div>
          )}
        </td>
      </tr>

      {noteEditing?.id === row.id && (
        <tr className="border-b border-navy-900/5 bg-amber-500/5">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <StickyNote size={15} className="text-amber-700" />
              <input
                autoFocus
                value={noteEditing.value}
                onChange={(e) => setNoteEditing({ ...noteEditing, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onUpdate(row.id, { admin_notes: noteEditing.value }); setNoteEditing(null); }
                  if (e.key === "Escape") setNoteEditing(null);
                }}
                placeholder={`Team note for ${row.customer_name || "this lead"}, e.g. called, coming with spouse`}
                className="min-w-0 flex-1 rounded-lg border border-navy-900/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                type="button"
                onClick={() => { onUpdate(row.id, { admin_notes: noteEditing.value }); setNoteEditing(null); }}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
              >
                Save
              </button>
              <button type="button" onClick={() => setNoteEditing(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-800/60 hover:bg-sand-100">
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
