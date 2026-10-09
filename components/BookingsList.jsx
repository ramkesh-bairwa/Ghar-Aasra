"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarX2, MapPin, Video, CalendarPlus, Navigation, X, Loader2, RefreshCw, Hourglass, CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { VisitCover, StatusPill, CodeChip, DateTile, SectionHeading } from "@/components/VisitCardParts";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import {
  slotConfig, buildDays, buildSlots, dateKey, formatSlotLabel, isPastSlot, fetchTakenSlots,
  googleCalendarUrl, directionsUrl,
} from "@/lib/visitSlots";

const STATUS_TONES = {
  pending: { pill: "bg-amber-50/95 text-amber-800", dot: "bg-amber-500" },
  confirmed: { pill: "bg-white/95 text-teal-600", dot: "bg-teal-500" },
  completed: { pill: "bg-white/90 text-navy-800/70", dot: "bg-navy-800/50" },
  cancelled: { pill: "bg-white/90 text-coral-600", dot: "bg-coral-500" },
  no_show: { pill: "bg-white/90 text-coral-600", dot: "bg-coral-500" },
};

const STATUS_LABELS = { pending: "Awaiting confirmation", no_show: "Missed" };

function isUpcoming(b) {
  return ["pending", "confirmed"].includes(b.status) && new Date(b.scheduled_at.replace(" ", "T")) > new Date();
}

// Upcoming visits first (soonest at the top), then past/closed ones newest first.
function sortBookings(list) {
  const ts = (b) => new Date(b.scheduled_at.replace(" ", "T")).getTime();
  return [...list].sort((a, b) => {
    const ua = isUpcoming(a), ub = isUpcoming(b);
    if (ua !== ub) return ua ? -1 : 1;
    return ua ? ts(a) - ts(b) : ts(b) - ts(a);
  });
}

export default function BookingsList({ onLoaded }) {
  const settings = useSiteSettings();
  const [bookings, setBookings] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  function load() {
    fetch("/api/bookings")
      .then((res) => (res.ok ? res.json() : { bookings: [] }))
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]));
  }

  useEffect(load, []);
  useEffect(() => {
    if (bookings !== null) onLoaded?.(bookings.length);
  }, [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bookings !== null && bookings.length === 0) return null;

  const upcoming = (bookings || []).filter(isUpcoming).length;
  const awaiting = (bookings || []).filter((b) => isUpcoming(b) && b.status === "pending");
  const waDigits = (settings.contact_whatsapp || "").replace(/[^\d]/g, "");
  const waLink = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
        `Hi! I'm waiting for confirmation of my visit${awaiting[0]?.booking_code ? ` (booking ID ${awaiting[0].booking_code})` : ""}.`
      )}`
    : null;

  return (
    <section className="bg-sand-50 py-12">
      <div className="container-page">
        <SectionHeading
          icon={CalendarCheck}
          title="Booked visits"
          subtitle={bookings === null ? "Loading your visits…" : "Your confirmed and pending property viewings."}
          stats={bookings === null ? [] : [
            { label: "Upcoming", value: upcoming, accent: true },
            { label: "Total", value: bookings.length },
          ]}
        />

        {awaiting.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-500/25 md:flex-row md:items-center">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
              <Hourglass size={20} className="relative" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-navy-900">
                {awaiting.length === 1 ? "Your visit is waiting for confirmation" : `${awaiting.length} visits are waiting for confirmation`}
              </h3>
              <p className="mt-0.5 text-sm text-navy-800/65">
                Please wait — our team will call or WhatsApp you shortly to confirm the slot. Please don&apos;t travel to the property until it shows <strong className="text-teal-700">Confirmed</strong>.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {settings.contact_phone && (
                <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/10 hover:ring-teal-500">
                  <Phone size={14} /> Call us
                </a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {bookings === null && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-surface h-80 animate-pulse bg-white/60" />
            ))}
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortBookings(bookings).map((b) => {
              const date = b.scheduled_at.slice(0, 10);
              const time = b.scheduled_at.slice(11, 16);
              const isVideo = b.visit_type === "video";
              const directions = !isVideo ? directionsUrl(b) : null;
              const canChange = isUpcoming(b);
              return (
                <article
                  key={b.id}
                  className={`card-surface group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card ${
                    canChange ? "" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <VisitCover src={b.cover_image_url} alt={b.property_title}>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill tone={STATUS_TONES[b.status] || STATUS_TONES.pending} label={STATUS_LABELS[b.status] || b.status} />
                      {isVideo && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-navy-950/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                          <Video size={12} /> Video tour
                        </span>
                      )}
                    </div>
                    <CodeChip code={b.booking_code} />
                  </VisitCover>

                  <div className="flex flex-1 flex-col p-5">
                    <Link href={`/properties/${b.property_slug}`} className="font-display text-lg leading-snug text-navy-900 transition-colors hover:text-teal-600">
                      {b.property_title}
                    </Link>
                    {b.address && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                        <MapPin size={13} className="shrink-0" /> <span className="truncate">{b.address}</span>
                      </p>
                    )}

                    <div className="mt-4">
                      <DateTile when={new Date(b.scheduled_at.replace(" ", "T"))} muted={!canChange} />
                    </div>

                    {canChange && b.status === "pending" && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-500/20">
                        <Hourglass size={15} className="mt-0.5 shrink-0 text-amber-600" />
                        <span><strong>Please wait for confirmation.</strong> We&apos;ll call you to confirm this slot.</span>
                      </div>
                    )}
                    {canChange && b.status === "confirmed" && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-teal-500/10 px-3 py-2.5 text-sm text-teal-800 ring-1 ring-teal-500/20">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-600" />
                        <span><strong>Confirmed!</strong> Your visit is all set. See you there.</span>
                      </div>
                    )}

                    {b.notes && (
                      <p className="mt-3 border-l-2 border-teal-500/40 pl-3 text-sm italic text-navy-800/60">{b.notes}</p>
                    )}

                    {canChange && (
                      <div className="mt-auto pt-5">
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={googleCalendarUrl({
                              title: `${isVideo ? "Video tour" : "Property visit"}: ${b.property_title}`,
                              date,
                              time,
                              location: isVideo ? "Video call" : b.address || "",
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-1.5 rounded-full bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-600 ${
                              directions ? "" : "col-span-2"
                            }`}
                          >
                            <CalendarPlus size={14} /> Add to calendar
                          </a>
                          {directions && (
                            <a
                              href={directions}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-500/20"
                            >
                              <Navigation size={14} /> Directions
                            </a>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-navy-900/8 pt-3 text-xs font-semibold">
                          <button type="button" onClick={() => setRescheduling(b)} className="flex items-center gap-1.5 text-navy-800/70 transition-colors hover:text-teal-600">
                            <RefreshCw size={13} /> Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelling(b)}
                            className="flex items-center gap-1.5 text-coral-600 transition-opacity hover:opacity-75"
                          >
                            <X size={13} /> Cancel visit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {cancelling && (
        <CancelModal
          booking={cancelling}
          onClose={() => setCancelling(null)}
          onReschedule={() => {
            setRescheduling(cancelling);
            setCancelling(null);
          }}
          onDone={() => {
            setCancelling(null);
            load();
          }}
        />
      )}

      {rescheduling && (
        <RescheduleModal
          booking={rescheduling}
          settings={settings}
          onClose={() => setRescheduling(null)}
          onDone={() => {
            setRescheduling(null);
            load();
          }}
        />
      )}
    </section>
  );
}

// Confirms a cancellation in-page (instead of the browser's confirm box),
// showing exactly which visit is being cancelled and offering a reschedule
// first, since most people cancelling just need a different time.
function CancelModal({ booking, onClose, onReschedule, onDone }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isVideo = booking.visit_type === "video";
  const when = new Date(booking.scheduled_at.replace(" ", "T")).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  async function confirmCancel() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) return onDone();
      setError((await res.json().catch(() => ({}))).error || "Could not cancel this visit.");
    } catch {
      setError("Network problem, please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/50 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-visit-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl2 bg-white shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center px-6 pb-2 pt-7 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-coral-500/10 text-coral-600 ring-8 ring-coral-500/5">
            <CalendarX2 size={26} />
          </span>
          <h2 id="cancel-visit-title" className="mt-4 font-display text-xl text-navy-900">Cancel this visit?</h2>
          <p className="mt-1 text-sm text-navy-800/60">The time slot will be released and our team will be notified.</p>
        </div>

        <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-sand-50 p-3 ring-1 ring-navy-900/5">
          {booking.cover_image_url ? (
            <img src={booking.cover_image_url} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-navy-900/5 text-navy-800/30">
              <MapPin size={18} />
            </span>
          )}
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-semibold text-navy-900">{booking.property_title}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-navy-800/60">
              <CalendarCheck size={12} /> {when}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-navy-800/45">
              {isVideo ? "Video tour" : "Site visit"}
              {booking.booking_code && <span className="font-mono">· {booking.booking_code}</span>}
            </div>
          </div>
        </div>

        <div className="mx-6 mt-3 flex items-center justify-between gap-3 rounded-xl bg-teal-500/10 px-4 py-3">
          <p className="text-xs text-navy-800/75">Just need a different time?</p>
          <button
            type="button"
            onClick={onReschedule}
            disabled={saving}
            className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-600 disabled:opacity-40"
          >
            <RefreshCw size={13} /> Reschedule instead
          </button>
        </div>

        {error && <p className="mx-6 mt-3 rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-600">{error}</p>}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-navy-900/8 bg-sand-50/60 p-4 sm:flex-row">
          <button type="button" onClick={onClose} disabled={saving} className="btn-outline flex-1 disabled:opacity-40">
            Keep my visit
          </button>
          <button
            type="button"
            onClick={confirmCancel}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
            {saving ? "Cancelling…" : "Yes, cancel visit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({ booking, settings, onClose, onDone }) {
  const config = slotConfig(settings);
  const days = useMemo(() => buildDays(config.daysAhead), [config.daysAhead]);
  const slots = useMemo(() => buildSlots(config), [config.start, config.end, config.step]); // eslint-disable-line react-hooks/exhaustive-deps
  const [day, setDay] = useState(days[0]);
  const [slot, setSlot] = useState(null);
  const [taken, setTaken] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const key = dateKey(day);

  useEffect(() => {
    setTaken(null);
    setSlot(null);
    fetchTakenSlots(booking.property_id, key).then(setTaken);
  }, [booking.property_id, key]);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reschedule", scheduledAt: `${key} ${slot}:00` }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else setError((await res.json().catch(() => ({}))).error || "Could not reschedule.");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl2 bg-white shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <h2 className="font-display text-lg text-navy-900">Reschedule visit</h2>
          <button onClick={onClose} aria-label="Close" className="text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-navy-800/60">{booking.property_title}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {days.map((d) => {
              const active = dateKey(d) === key;
              return (
                <button
                  key={dateKey(d)}
                  type="button"
                  onClick={() => setDay(d)}
                  className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center ${
                    active ? "border-teal-500 bg-teal-500 text-white" : "border-navy-900/10 text-navy-800"
                  }`}
                >
                  <span className="text-[10px] uppercase">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                  <span className="font-display text-base leading-none">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
          {taken === null ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-navy-800/40">
              <Loader2 size={15} className="animate-spin" /> Checking availability…
            </div>
          ) : (
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {slots.map((t) => {
                const disabled = taken.includes(t) || isPastSlot(day, t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSlot(t)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                      disabled
                        ? "cursor-not-allowed border-navy-900/5 bg-sand-100 text-navy-800/30 line-through"
                        : slot === t
                        ? "border-teal-500 bg-teal-500 text-white"
                        : "border-navy-900/10 text-navy-800 hover:border-teal-500/50"
                    }`}
                  >
                    {formatSlotLabel(t)}
                  </button>
                );
              })}
            </div>
          )}
          {error && <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Keep current time</button>
            <button type="button" onClick={save} disabled={!slot || saving} className="btn-primary flex-1 disabled:opacity-40">
              {saving ? "Saving…" : "Confirm new time"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
