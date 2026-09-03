"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, MessageSquare, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

const DAYS_AHEAD = 21;
const SLOT_START_MIN = 9 * 60; // 9:00 AM
const SLOT_END_MIN = 18 * 60; // 6:00 PM
const SLOT_STEP_MIN = 30;

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildDays() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function buildSlots() {
  const slots = [];
  for (let m = SLOT_START_MIN; m < SLOT_END_MIN; m += SLOT_STEP_MIN) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
}

function formatSlotLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${pad(m)} ${period}`;
}

const days = buildDays();
const slots = buildSlots();

export default function BookVisitForm({ property }) {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [taken, setTaken] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const dayKey = dateKey(selectedDay);
  const isToday = dateKey(new Date()) === dayKey;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/bookings/availability?propertyId=${property.id}&date=${dayKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTaken(data.taken || []);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dayKey, property.id]);

  const availableSlots = useMemo(
    () =>
      slots.map((s) => {
        const [h, m] = s.split(":").map(Number);
        const past = isToday && h * 60 + m <= nowMinutes;
        return { time: s, disabled: taken.includes(s) || past };
      }),
    [taken, isToday, nowMinutes]
  );

  async function confirmVisit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          scheduledAt: `${dayKey} ${selectedSlot}:00`,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not book that visit.");
        return;
      }
      setConfirmed({ day: selectedDay, slot: selectedSlot });
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
          <CheckCircle2 size={28} />
        </span>
        <h3 className="font-display text-xl text-navy-900">Visit requested</h3>
        <p className="max-w-sm text-sm text-navy-800/60">
          You're set for{" "}
          <span className="font-semibold text-navy-900">
            {confirmed.day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>{" "}
          at <span className="font-semibold text-navy-900">{formatSlotLabel(confirmed.slot)}</span>. The team will confirm shortly.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/bookings" className="btn-primary">
            View my bookings
            <ArrowRight size={15} />
          </Link>
          <Link href={`/properties/${property.slug}`} className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            Back to listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
      <div className="min-w-0 space-y-6">
        <div className="card-surface p-6 md:p-7">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy-900">
            <CalendarDays size={18} className="text-teal-600" /> Choose a day
          </h2>
          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {days.map((d) => {
              const active = dateKey(d) === dayKey;
              const isFirstOfMonth = d.getDate() === 1;
              return (
                <button
                  key={dateKey(d)}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-4 py-3 text-center transition-colors ${
                    active
                      ? "border-teal-500 bg-teal-500 text-white shadow-soft"
                      : "border-navy-900/8 bg-white text-navy-800 hover:border-teal-500/40"
                  }`}
                >
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${active ? "text-white/80" : "text-navy-800/45"}`}>
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="font-display text-lg leading-none">{d.getDate()}</span>
                  {isFirstOfMonth && (
                    <span className={`text-[10px] ${active ? "text-white/80" : "text-navy-800/45"}`}>
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-surface p-6 md:p-7">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy-900">
            <Clock size={18} className="text-teal-600" /> Choose a time
          </h2>
          <p className="mt-1 text-xs text-navy-800/50">
            {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · local time
          </p>

          {loadingSlots ? (
            <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm text-navy-800/40">
              <Loader2 size={16} className="animate-spin" /> Checking availability…
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {availableSlots.map(({ time, disabled }) => (
                <button
                  key={time}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedSlot(time)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    disabled
                      ? "cursor-not-allowed border-navy-900/5 bg-sand-100 text-navy-800/30 line-through"
                      : selectedSlot === time
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-navy-900/10 text-navy-800 hover:border-teal-500/50"
                  }`}
                >
                  {formatSlotLabel(time)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface p-6 md:p-7">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy-900">
            <MessageSquare size={18} className="text-teal-600" /> Anything the agent should know?
          </h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional — e.g. I'll be bringing family, is parking available?"
            className="mt-3 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      </div>

      {/* Sticky summary */}
      <div className="lg:sticky lg:top-24">
        <div className="card-surface overflow-hidden">
          <img src={property.image} alt={property.title} className="h-36 w-full object-cover" />
          <div className="p-5">
            <div className="text-xs text-navy-800/50">Booking a visit for</div>
            <div className="mt-1 font-display text-lg text-navy-900">{property.title}</div>
            <div className="mt-0.5 text-sm text-navy-800/55">{property.address || property.city}</div>

            <div className="mt-5 space-y-2.5 border-t border-navy-900/8 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-navy-800/50">Date</span>
                <span className="font-medium text-navy-900">
                  {selectedDay.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-navy-800/50">Time</span>
                <span className="font-medium text-navy-900">{selectedSlot ? formatSlotLabel(selectedSlot) : "Not selected"}</span>
              </div>
              {user && (
                <div className="flex items-center justify-between">
                  <span className="text-navy-800/50">Booking as</span>
                  <span className="truncate pl-3 font-medium text-navy-900">{user.name}</span>
                </div>
              )}
            </div>

            {error && <p className="mt-4 rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-600">{error}</p>}

            <button
              onClick={confirmVisit}
              disabled={!selectedSlot || submitting}
              className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Booking…" : "Confirm visit"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
