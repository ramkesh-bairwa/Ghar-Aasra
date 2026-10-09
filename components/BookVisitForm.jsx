"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Clock, MessageSquare, ArrowRight, Loader2, User, Phone, Mail,
  Home, Video, Car, CalendarPlus, Navigation, MessageCircle, ShieldCheck, Zap, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import BookingCelebration from "@/components/BookingCelebration";
import {
  slotConfig, buildDays, buildSlots, dateKey, formatSlotLabel, isPastSlot, fetchTakenSlots,
  googleCalendarUrl, downloadIcs, whatsappUrl, directionsUrl,
} from "@/lib/visitSlots";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-teal-500/30";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Free, no obligation" },
  { icon: Zap, label: "No sign-up needed" },
  { icon: RefreshCw, label: "Reschedule anytime" },
];

export default function BookVisitForm({ property, initialDate, initialTime }) {
  const { user, loading: authLoading } = useAuth();
  const settings = useSiteSettings();
  const config = slotConfig(settings);
  const days = useMemo(() => buildDays(config.daysAhead), [config.daysAhead]);
  const slots = useMemo(() => buildSlots(config), [config.start, config.end, config.step]); // eslint-disable-line react-hooks/exhaustive-deps
  const videoEnabled = settings.visit_video_enabled === "true";
  const pickupEnabled = settings.visit_pickup_enabled === "true";

  const [selectedDay, setSelectedDay] = useState(() => days.find((d) => dateKey(d) === initialDate) || days[0]);
  const [selectedSlot, setSelectedSlot] = useState(initialTime || null);
  const [taken, setTaken] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [visitType, setVisitType] = useState("in_person");
  const [pickup, setPickup] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const dayKey = dateKey(selectedDay);

  useEffect(() => {
    if (user) setPhone((v) => v || user.phone || "");
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    fetchTakenSlots(property.id, dayKey).then((list) => {
      if (cancelled) return;
      setTaken(list);
      // Keep a preselected slot (e.g. from the property page's quick-pick
      // chips) only while it's still bookable on the chosen day.
      setSelectedSlot((s) => (s && !list.includes(s) && !isPastSlot(selectedDay, s) && slots.includes(s) ? s : null));
      setLoadingSlots(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dayKey, property.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableSlots = slots.map((time) => ({
    time,
    disabled: taken.includes(time) || isPastSlot(selectedDay, time),
  }));
  const allTaken = !loadingSlots && availableSlots.every((s) => s.disabled);

  async function confirmVisit() {
    if (!selectedSlot) return setError("Pick a time slot.");
    if (!user && (!name.trim() || !phone.trim())) return setError("Add your name and phone number so we can confirm.");
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
          name: user ? undefined : name.trim(),
          phone: phone.trim() || null,
          email: user ? undefined : email.trim() || null,
          visitType,
          pickupRequired: pickup,
          pickupAddress: pickup ? pickupAddress : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not book that visit.");
        if (res.status === 409) setTaken((t) => [...t, selectedSlot]);
        return;
      }
      try {
        sessionStorage.setItem("fh_visit_booked", "1");
      } catch {
        /* storage unavailable — popup may show again, harmless */
      }
      setConfirmed({ day: selectedDay, date: dayKey, slot: selectedSlot, visitType, bookingCode: data.bookingCode, name: user?.name || name });
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return <Confirmation property={property} confirmed={confirmed} settings={settings} signedIn={!!user} step={config.step} />;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 rounded-full border border-navy-900/8 bg-white px-4 py-2 text-xs font-semibold text-navy-800/70 shadow-soft"
          >
            <Icon size={14} className="text-teal-600" /> {label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="min-w-0 space-y-6">
          {videoEnabled && (
            <div className="card-surface p-6 md:p-7">
              <h2 className="font-display text-lg text-navy-900">How would you like to see it?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { value: "in_person", Icon: Home, title: "Site visit", text: "Walk through the property in person" },
                  { value: "video", Icon: Video, title: "Video call tour", text: "Live walkthrough from wherever you are" },
                ].map(({ value, Icon, title, text }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVisitType(value)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      visitType === value ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500" : "border-navy-900/10 hover:border-teal-500/40"
                    }`}
                  >
                    <Icon size={20} className="mt-0.5 shrink-0 text-teal-600" />
                    <span>
                      <span className="block text-sm font-semibold text-navy-900">{title}</span>
                      <span className="block text-xs text-navy-800/55">{text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card-surface p-6 md:p-7">
            <h2 className="flex items-center gap-2 font-display text-lg text-navy-900">
              <CalendarDays size={18} className="text-teal-600" /> Choose a day
            </h2>
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
              {days.map((d) => {
                const active = dateKey(d) === dayKey;
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
                    <span className={`text-[10px] ${active ? "text-white/80" : "text-navy-800/45"}`}>
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
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
            ) : allTaken ? (
              <p className="mt-4 rounded-xl bg-sand-100 px-4 py-6 text-center text-sm text-navy-800/60">
                No times left on this day — pick another day above.
              </p>
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

          {!authLoading && !user && (
            <div className="card-surface p-6 md:p-7">
              <h2 className="flex items-center gap-2 font-display text-lg text-navy-900">
                <User size={18} className="text-teal-600" /> Your details
              </h2>
              <p className="mt-1 text-xs text-navy-800/50">
                No account needed. We only use these to confirm your visit.{" "}
                <Link href={`/login?next=${encodeURIComponent(`/properties/${property.slug}/visit`)}`} className="font-semibold text-teal-600">
                  Have an account? Sign in
                </Link>
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-navy-800/70">
                  <span className="flex items-center gap-1.5"><User size={13} /> Full name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
                </label>
                <label className="block text-sm font-medium text-navy-800/70">
                  <span className="flex items-center gap-1.5"><Phone size={13} /> Phone / WhatsApp</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className={inputClass} />
                </label>
                <label className="block text-sm font-medium text-navy-800/70 sm:col-span-2">
                  <span className="flex items-center gap-1.5"><Mail size={13} /> Email (optional)</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
                </label>
              </div>
            </div>
          )}

          {user && (
            <div className="card-surface p-6 md:p-7">
              <label className="block text-sm font-medium text-navy-800/70">
                <span className="flex items-center gap-1.5"><Phone size={13} /> Phone number for confirmation</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </label>
            </div>
          )}

          {pickupEnabled && visitType === "in_person" && (
            <div className="card-surface p-6 md:p-7">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="mt-1 h-4 w-4 accent-teal-500" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Car size={15} className="text-teal-600" /> I&apos;d like a pickup</span>
                  <span className="block text-xs text-navy-800/55">Our team will call to arrange it before your visit.</span>
                </span>
              </label>
              {pickup && (
                <input
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Pickup address or landmark"
                  className={inputClass}
                />
              )}
            </div>
          )}

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
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface overflow-hidden">
            <img src={property.image} alt={property.title} className="h-36 w-full object-cover" />
            <div className="p-5">
              <div className="text-xs text-navy-800/50">Booking a visit for</div>
              <div className="mt-1 font-display text-lg text-navy-900">{property.title}</div>
              <div className="mt-0.5 text-sm text-navy-800/55">{property.address || property.city}</div>

              <div className="mt-5 space-y-2.5 border-t border-navy-900/8 pt-4 text-sm">
                <SummaryRow label="Date" value={selectedDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} />
                <SummaryRow label="Time" value={selectedSlot ? formatSlotLabel(selectedSlot) : "Not selected"} />
                {videoEnabled && <SummaryRow label="Type" value={visitType === "video" ? "Video call" : "Site visit"} />}
                {user && <SummaryRow label="Booking as" value={user.name} />}
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
              <p className="mt-2 text-center text-[11px] text-navy-800/45">Free · takes 30 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-navy-800/50">{label}</span>
      <span className="truncate pl-3 font-medium text-navy-900">{value}</span>
    </div>
  );
}

function Confirmation({ property, confirmed, settings, signedIn, step }) {
  const when = `${confirmed.day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${formatSlotLabel(confirmed.slot)}`;
  const isVideo = confirmed.visitType === "video";
  const event = {
    title: `${isVideo ? "Video tour" : "Property visit"}: ${property.title}`,
    date: confirmed.date,
    time: confirmed.slot,
    minutes: Math.max(step, 30),
    location: isVideo ? "Video call" : property.address || property.city || "",
    details: `Visit booked via ${settings.site_title}. Contact: ${settings.contact_phone || ""}`,
  };
  const wa = whatsappUrl(
    settings.contact_whatsapp,
    `Hi! I just booked a ${isVideo ? "video tour" : "visit"} for "${property.title}" on ${when}${confirmed.bookingCode ? ` (booking ID ${confirmed.bookingCode})` : ""}. Please confirm.`
  );
  const directions = !isVideo ? directionsUrl(property) : null;

  return (
    <BookingCelebration
      name={confirmed.name}
      ribbon="Awaiting confirmation"
      title={`Your ${isVideo ? "video tour" : "visit"} is booked`}
      subtitle={`Requested for ${when}. Please wait for our team to confirm your slot.`}
      bookingCode={confirmed.bookingCode}
      pending={{ when, eta: "shortly, usually within a few hours", signedIn }}
    >
      <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-navy-900/5">
        <img src={property.image} alt={property.title} className="h-12 w-14 rounded-lg object-cover" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-navy-900">{property.title}</div>
          <div className="truncate text-xs text-navy-800/50">{isVideo ? "Video call tour" : property.address || property.city}</div>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center">
          <CalendarPlus size={15} /> Google Calendar
        </a>
        <button type="button" onClick={() => downloadIcs(event)} className="btn-outline justify-center">
          <CalendarDays size={15} /> Apple / Outlook
        </button>
        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center">
            <Navigation size={15} /> Get directions
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle size={15} /> Confirm on WhatsApp
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm">
        {signedIn && (
          <Link href="/bookings" className="font-semibold text-teal-600 hover:text-teal-700">
            Manage my visits
          </Link>
        )}
        <Link href="/properties" className="flex items-center gap-1 font-semibold text-navy-800/70 hover:text-teal-600">
          Book another property <ArrowRight size={14} />
        </Link>
      </div>
    </BookingCelebration>
  );
}
