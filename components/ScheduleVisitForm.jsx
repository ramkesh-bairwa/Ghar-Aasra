"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Clock, Home, User, Mail, Phone, MessageSquare,
  ArrowRight, MessageCircle, Facebook, ShieldCheck,
  Zap, RefreshCw, MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import BookingCelebration from "@/components/BookingCelebration";
import { usePropertiesFeed } from "@/lib/usePropertiesFeed";
import { slotConfig, buildDays, buildSlots, dateKey, formatSlotLabel } from "@/lib/visitSlots";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Free, no obligation" },
  { icon: Zap, label: "Confirmed within 24h" },
  { icon: RefreshCw, label: "Reschedule anytime" },
];

function StepCard({ step, icon: Icon, title, subtitle, children }) {
  return (
    <div className="card-surface p-6 md:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm text-teal-400">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy-900">
            <Icon size={17} className="text-teal-600" /> {title}
          </h2>
          {subtitle && <p className="mt-1 text-xs text-navy-800/50">{subtitle}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleVisitForm({ initialPropertySlug }) {
  const { user } = useAuth();
  const settings = useSiteSettings();
  const { contact_whatsapp, facebook_url } = settings;
  const { properties } = usePropertiesFeed();
  const config = slotConfig(settings);
  const days = useMemo(() => buildDays(config.daysAhead), [config.daysAhead]);
  const slots = useMemo(() => buildSlots(config), [config.start, config.end, config.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const [propertyId, setPropertyId] = useState("");
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (user) {
      setName((v) => v || user.name || "");
      setEmail((v) => v || user.email || "");
      setPhone((v) => v || user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (!initialPropertySlug || !properties.length) return;
    const match = properties.find((p) => p.slug === initialPropertySlug);
    if (match) setPropertyId(String(match.id));
  }, [initialPropertySlug, properties]);

  const dayKey = dateKey(selectedDay);
  const isToday = dateKey(new Date()) === dayKey;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const selectedProperty = propertyId ? properties.find((p) => String(p.id) === propertyId) : null;

  const availableSlots = useMemo(
    () =>
      slots.map((s) => {
        const [h, m] = s.split(":").map(Number);
        return { time: s, disabled: isToday && h * 60 + m <= nowMinutes };
      }),
    [isToday, nowMinutes, slots]
  );

  const whatsappHref = contact_whatsapp
    ? `https://wa.me/${contact_whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Hi! I'd like to schedule a property visit.")}`
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlot) return setError("Pick a preferred time slot.");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone,
          propertyId: propertyId || null,
          preferredDate: dayKey,
          preferredTime: selectedSlot,
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not submit your request.");
      setDone({ day: selectedDay, slot: selectedSlot, property: selectedProperty, bookingCode: data.bookingCode, name });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const doneWhatsapp = contact_whatsapp
      ? `https://wa.me/${contact_whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
          `Hi! I just requested a property visit${done.bookingCode ? ` (booking ID ${done.bookingCode})` : ""}.`
        )}`
      : null;
    return (
      <BookingCelebration
        name={done.name}
        ribbon="Awaiting confirmation"
        title="Your visit is booked"
        subtitle="Please wait for our team to confirm your slot. We usually confirm within 24 hours."
        bookingCode={done.bookingCode}
        pending={{
          when: `${done.day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${formatSlotLabel(done.slot)}`,
          eta: "within 24 hours",
          signedIn: !!user,
        }}
      >
        {done.property && (
          <div className="flex items-center gap-3 rounded-xl bg-white ring-1 ring-navy-900/5 p-3">
            <img src={done.property.image} alt={done.property.title} className="h-12 w-14 rounded-lg object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-navy-900">{done.property.title}</div>
              <div className="flex items-center gap-1 text-xs text-navy-800/50"><MapPin size={11} /> {done.property.city}</div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl bg-white ring-1 ring-navy-900/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-navy-800/60"><CalendarDays size={15} className="text-teal-600" /> Date</span>
          <span className="font-semibold text-navy-900">
            {done.day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white ring-1 ring-navy-900/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-navy-800/60"><Clock size={15} className="text-teal-600" /> Time</span>
          <span className="font-semibold text-navy-900">{formatSlotLabel(done.slot)}</span>
        </div>

        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
          <Link href="/properties" className="btn-primary flex-1 justify-center">
            Browse more properties
            <ArrowRight size={15} />
          </Link>
          {doneWhatsapp && (
            <a
              href={doneWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle size={16} /> Confirm on WhatsApp
            </a>
          )}
        </div>
      </BookingCelebration>
    );
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

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="relative z-0 min-w-0">
          <div className="pointer-events-none absolute left-[42px] top-0 bottom-0 hidden w-px -z-10 bg-navy-900/15 md:left-[46px] sm:block" />
          <div className="space-y-6">
            <StepCard step={1} icon={Home} title="Which property?" subtitle="Optional — leave blank for a general enquiry.">
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="">General enquiry — no specific property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
                ))}
              </select>
              {selectedProperty && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-sand-100 p-2.5">
                  <img src={selectedProperty.image} alt={selectedProperty.title} className="h-11 w-14 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-navy-900">{selectedProperty.title}</div>
                    <div className="truncate text-xs text-navy-800/50">{selectedProperty.price}</div>
                  </div>
                </div>
              )}
            </StepCard>

            <StepCard step={2} icon={CalendarDays} title="Choose a day">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {days.map((d) => {
                  const active = dateKey(d) === dayKey;
                  const isFirstOfMonth = d.getDate() === 1;
                  return (
                    <button
                      key={dateKey(d)}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-4 py-3 text-center transition-all hover:-translate-y-0.5 ${
                        active ? "border-teal-500 bg-teal-500 text-white shadow-card scale-105" : "border-navy-900/8 bg-white text-navy-800 hover:border-teal-500/40 hover:shadow-soft"
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
            </StepCard>

            <StepCard
              step={3}
              icon={Clock}
              title="Choose a time"
              subtitle={`${selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · local time`}
            >
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {availableSlots.map(({ time, disabled }) => (
                  <button
                    key={time}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedSlot(time)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      disabled
                        ? "cursor-not-allowed border-navy-900/5 bg-sand-100 text-navy-800/30 line-through"
                        : selectedSlot === time
                        ? "border-teal-500 bg-teal-500 text-white shadow-card scale-105"
                        : "border-navy-900/10 text-navy-800 hover:-translate-y-0.5 hover:border-teal-500/50 hover:shadow-soft"
                    }`}
                  >
                    {formatSlotLabel(time)}
                  </button>
                ))}
              </div>
            </StepCard>

            <StepCard step={4} icon={User} title="Your details">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-navy-800/70">
                  <span className="flex items-center gap-1.5"><User size={13} /> Full name</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </label>
                <label className="block text-sm font-medium text-navy-800/70">
                  <span className="flex items-center gap-1.5"><Mail size={13} /> Email</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </label>
                <label className="block text-sm font-medium text-navy-800/70 sm:col-span-2">
                  <span className="flex items-center gap-1.5"><Phone size={13} /> Phone (optional)</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                </label>
              </div>
              <label className="mt-4 block text-sm font-medium text-navy-800/70">
                <span className="flex items-center gap-1.5"><MessageSquare size={13} /> Anything else we should know?</span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional"
                  className="mt-1.5 w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </label>
            </StepCard>
          </div>
        </div>

        {/* Sticky summary + alternative contact */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="relative overflow-hidden rounded-xl2 bg-navy-900 p-6 text-white shadow-soft ring-1 ring-navy-900/5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(20,184,172,0.22),transparent_45%)]" />
            <div className="relative">
              <div className="text-sm text-white/55">Requesting a visit for</div>
              {selectedProperty ? (
                <div className="mt-2 flex items-center gap-3">
                  <img src={selectedProperty.image} alt={selectedProperty.title} className="h-11 w-14 rounded-lg object-cover ring-1 ring-white/10" />
                  <div className="min-w-0 font-display text-base leading-tight">{selectedProperty.title}</div>
                </div>
              ) : (
                <div className="mt-1 font-display text-lg">General enquiry</div>
              )}

              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-white/55"><CalendarDays size={14} /> Date</span>
                  <span className="font-medium">{selectedDay.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-white/55"><Clock size={14} /> Time</span>
                  <span className="font-medium">{selectedSlot ? formatSlotLabel(selectedSlot) : "Not selected"}</span>
                </div>
              </div>

              {error && <p className="mt-4 rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-200">{error}</p>}

              <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? "Sending…" : "Request this visit"}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </div>
          </div>

          {(whatsappHref || facebook_url) && (
            <div className="card-surface p-5">
              <p className="text-sm font-semibold text-navy-900">Prefer to just message us?</p>
              <p className="mt-1 text-xs text-navy-800/50">Skip the form — reach our team directly.</p>
              <div className="mt-4 space-y-2.5">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle size={17} /> Chat on WhatsApp
                  </a>
                )}
                {facebook_url && (
                  <a
                    href={facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <Facebook size={17} /> Message on Facebook
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
