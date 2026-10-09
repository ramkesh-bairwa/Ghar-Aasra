"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, ArrowRight, Flame, Loader2 } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { findNextSlots, formatSlotLabel, dayLabel } from "@/lib/visitSlots";

// Property-page sidebar card: the next few genuinely open slots as one-tap
// chips (each deep-links into the booking form with that slot preselected),
// plus a real recent-demand line when there's any demand to show.
export default function VisitQuickBook({ property, recentVisits = 0 }) {
  const settings = useSiteSettings();
  const [nextSlots, setNextSlots] = useState(null);
  const base = `/properties/${property.slug}/visit`;

  useEffect(() => {
    let cancelled = false;
    findNextSlots(property.id, settings, 3).then((s) => !cancelled && setNextSlots(s));
    return () => {
      cancelled = true;
    };
  }, [property.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id="book-visit" className="overflow-hidden rounded-xl2 bg-navy-900 text-white shadow-soft ring-1 ring-navy-900/5">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
            <CalendarCheck size={20} />
          </span>
          <div>
            <div className="font-display text-[17px]">Book a free visit</div>
            <div className="text-xs text-white/55">No sign-up needed · takes 30 seconds</div>
          </div>
        </div>

        {recentVisits > 0 && (
          <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-coral-500/15 px-3 py-2 text-xs font-medium text-coral-200">
            <Flame size={14} className="shrink-0 text-coral-500" />
            {recentVisits === 1 ? "1 person has" : `${recentVisits} people have`} booked a visit here in the last 30 days
          </p>
        )}

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-white/45">Next available</div>
        {nextSlots === null ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
            <Loader2 size={13} className="animate-spin" /> Checking slots…
          </div>
        ) : nextSlots.length === 0 ? (
          <p className="mt-2 text-xs text-white/55">Pick any day that suits you on the next screen.</p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {nextSlots.map((s) => (
              <Link
                key={`${s.date}-${s.time}`}
                href={`${base}?date=${s.date}&time=${s.time}`}
                className="rounded-xl bg-white/8 px-2 py-2 text-center ring-1 ring-white/10 transition-colors hover:bg-teal-500 hover:ring-teal-500"
              >
                <div className="text-[10px] text-white/60">{dayLabel(s.day)}</div>
                <div className="text-sm font-semibold">{formatSlotLabel(s.time)}</div>
              </Link>
            ))}
          </div>
        )}

        <Link href={base} className="btn-primary mt-4 w-full justify-center">
          See all times <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
