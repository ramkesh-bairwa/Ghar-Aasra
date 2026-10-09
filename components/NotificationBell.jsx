"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CalendarCheck, CalendarClock, Inbox, PhoneCall, Video, CheckCheck, Sparkles, TrendingDown } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { formatSlotLabel } from "@/lib/visitSlots";

const POLL_MS = 60000;

const ICONS = { booking: CalendarCheck, visit_request: CalendarClock, enquiry: Inbox, callback: PhoneCall, new_match: Sparkles, price_drop: TrendingDown };
const ICON_STYLES = {
  booking: "bg-teal-500/15 text-teal-700",
  visit_request: "bg-purple-500/15 text-purple-700",
  enquiry: "bg-amber-500/15 text-amber-700",
  callback: "bg-coral-500/15 text-coral-600",
  new_match: "bg-teal-500/15 text-teal-600",
  price_drop: "bg-teal-500/15 text-teal-600",
};

function readStore(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — unread state just won't persist */
  }
}

function whenLabel(detail) {
  if (!detail || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(detail)) return "";
  const d = new Date(`${detail.slice(0, 10)}T00:00:00`);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${formatSlotLabel(detail.slice(11, 16))}`;
}

// "5 min ago" using the DB clock on both sides, so timezones can't skew it.
function ago(createdAt, serverNow) {
  if (!createdAt || !serverNow) return "";
  const diff = (new Date(serverNow.replace(" ", "T")) - new Date(createdAt.replace(" ", "T"))) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

const USER_TEXT = {
  booking: {
    pending: "Visit booked, awaiting confirmation",
    confirmed: "Your visit is confirmed",
    completed: "Visit completed. Hope you liked it!",
    cancelled: "Visit cancelled",
    no_show: "You missed this visit. Book another time?",
  },
  visit_request: {
    new: "Visit request received",
    contacted: "Our team has contacted you",
    scheduled: "Your visit is scheduled",
    closed: "Visit request closed",
  },
  enquiry: { new: "Enquiry sent", contacted: "Our team replied to your enquiry", closed: "Enquiry closed" },
  callback: { new: "Callback requested", contacted: "We called you back", closed: "Callback closed" },
  new_match: { new: "New listing for your saved search" },
  price_drop: { new: "Price dropped on a home you're watching" },
};

function describe(item, variant) {
  const when = whenLabel(item.detail);
  if (variant === "admin") {
    const titles = {
      booking: `New ${item.extra === "video" ? "video tour" : "visit"} booking`,
      visit_request: "New schedule request",
      enquiry: "New enquiry",
      callback: "Callback requested",
    };
    const hrefs = { booking: "/admin/bookings", visit_request: "/admin/schedule", enquiry: "/admin/inquiries", callback: "/admin/inquiries" };
    const sub = [item.name, item.property_title, item.kind === "callback" ? item.detail : when].filter(Boolean).join(" · ");
    return { title: titles[item.kind] || "New activity", sub, href: hrefs[item.kind] || "/admin" };
  }
  const title = USER_TEXT[item.kind]?.[item.status] || "Update on your request";
  const sub = [item.property_title, when].filter(Boolean).join(" · ");
  const href = item.kind === "booking" || item.kind === "visit_request" ? "/bookings" : item.property_slug ? `/properties/${item.property_slug}` : "/contact";
  if (item.kind === "new_match" || item.kind === "price_drop") return { title, sub: item.property_title, href };
  return { title, sub, href };
}

// Bell + dropdown, shared by the admin top bar (variant "admin") and the
// public header (variant "user"). Polls every minute and on tab focus.
// Unread tracking lives in this browser:
//  - admin: everything created after the last time the list was opened
//  - user:  every (item, status) pair not yet seen — so a booking flagged
//           as seen becomes unread again when staff confirm or cancel it.
export default function NotificationBell({ variant = "user", storageKey, dark = false }) {
  const endpoint = variant === "admin" ? "/api/admin/notifications" : "/api/notifications";
  const [data, setData] = useState({ items: [], serverNow: null });
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(null); // admin: timestamp string; user: array of keys
  const ref = useRef(null);

  const itemKey = (i) => `${i.kind}:${i.id}:${i.status}`;

  useEffect(() => {
    setSeen(readStore(storageKey, variant === "admin" ? "" : []));
  }, [storageKey, variant]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setData({ items: json.items || [], serverNow: json.serverNow || null });
    } catch {
      /* offline — keep the last list */
    } finally {
      setLoaded(true);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isUnread = (item) => {
    if (seen === null) return false;
    return variant === "admin" ? item.created_at > seen : !seen.includes(itemKey(item));
  };
  const unread = data.items.filter(isUnread).length;

  function markAllRead() {
    const next = variant === "admin" ? data.serverNow || "" : data.items.map(itemKey);
    setSeen(next);
    writeStore(storageKey, next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          dark ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-navy-800/75 hover:bg-navy-900/5 hover:text-navy-900"
        }`}
      >
        <Bell size={19} className={unread ? "origin-top animate-[bell-ring_1.2s_ease-in-out_2]" : ""} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[80px] z-50 overflow-hidden rounded-xl2 bg-white shadow-card ring-1 ring-navy-900/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-navy-900/8 px-4 py-3">
            <div className="font-display text-base text-navy-900">
              Notifications {unread > 0 && <span className="ml-1 text-xs font-sans font-semibold text-coral-600">{unread} new</span>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {!loaded ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState
              compact
              icon={BellOff}
              title="You're all caught up"
              text={
                variant === "admin"
                  ? "New visit bookings, schedule requests and enquiries will show up here."
                  : "Updates on your visits and enquiries will show up here."
              }
              primary={variant === "admin" ? undefined : { label: "Book a visit", href: "/properties" }}
            />
          ) : (
            <ul className="max-h-[60vh] divide-y divide-navy-900/6 overflow-y-auto">
              {data.items.map((item) => {
                const Icon = ICONS[item.kind] || Bell;
                const { title, sub, href } = describe(item, variant);
                const fresh = isUnread(item);
                return (
                  <li key={itemKey(item)}>
                    <Link
                      href={href}
                      onClick={() => {
                        setOpen(false);
                        if (variant === "user" && fresh) {
                          const next = [...(seen || []), itemKey(item)];
                          setSeen(next);
                          writeStore(storageKey, next);
                        }
                      }}
                      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-sand-50 ${fresh ? "bg-teal-500/[0.04]" : ""}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_STYLES[item.kind] || "bg-sand-100 text-navy-800"}`}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                          {title}
                          {item.extra === "video" && <Video size={13} className="text-navy-800/45" />}
                        </span>
                        {sub && <span className="mt-0.5 block truncate text-xs text-navy-800/55">{sub}</span>}
                        <span className="mt-1 block text-[11px] text-navy-800/40">{ago(item.created_at, data.serverNow)}</span>
                      </span>
                      {fresh && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral-600" aria-label="Unread" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
