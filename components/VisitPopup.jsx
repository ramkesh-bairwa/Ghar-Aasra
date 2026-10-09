"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, CalendarCheck, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { findNextSlots, formatSlotLabel, dayLabel } from "@/lib/visitSlots";

const SEEN_KEY = "fh_visit_popup_seen";
const BOOKED_KEY = "fh_visit_booked";

function readFlag(key) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function setFlag(key) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage blocked — worst case the popup can show again next page */
  }
}

// A one-per-session nudge on property pages: opens after the admin-set delay
// or when a desktop visitor moves to leave the tab, offering the next open
// slots for this exact property. Never shows again in the session once seen,
// dismissed, or after a visit has been booked.
export default function VisitPopup({ property }) {
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [nextSlots, setNextSlots] = useState([]);
  const enabled = settings.visit_popup_enabled === "true";

  useEffect(() => {
    if (!enabled || readFlag(SEEN_KEY) || readFlag(BOOKED_KEY)) return;

    let fired = false;
    function show() {
      if (fired || readFlag(SEEN_KEY) || readFlag(BOOKED_KEY)) return;
      fired = true;
      setFlag(SEEN_KEY);
      setOpen(true);
      findNextSlots(property.id, settings, 3).then(setNextSlots);
    }

    const delay = (Number(settings.visit_popup_delay_seconds) || 30) * 1000;
    const timer = setTimeout(show, delay);
    // Exit intent: pointer leaves through the top of the viewport (towards
    // the tab bar / address bar). Desktop only by nature.
    function onMouseOut(e) {
      if (!e.relatedTarget && e.clientY <= 0) show();
    }
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [enabled, property.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const base = `/properties/${property.slug}/visit`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/50 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-popup-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl2 bg-white shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-36">
          <img src={property.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-900"
          >
            <X size={16} />
          </button>
          <div className="absolute inset-x-5 bottom-3 text-white">
            <div className="truncate text-xs text-white/70">{property.title}</div>
            <div className="font-display text-lg">{property.price}</div>
          </div>
        </div>
        <div className="p-6">
          <h2 id="visit-popup-title" className="flex items-center gap-2 font-display text-xl text-navy-900">
            <CalendarCheck size={20} className="text-teal-600" /> Photos only show so much
          </h2>
          <p className="mt-1.5 text-sm text-navy-800/60">
            See it in person, free and with no obligation. Pick a time and you&apos;re booked, no sign-up needed.
          </p>

          {nextSlots.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {nextSlots.map((s) => (
                <Link
                  key={`${s.date}-${s.time}`}
                  href={`${base}?date=${s.date}&time=${s.time}`}
                  className="rounded-xl border border-navy-900/10 px-2 py-2 text-center transition-colors hover:border-teal-500 hover:bg-teal-500/5"
                >
                  <div className="text-[10px] text-navy-800/50">{dayLabel(s.day)}</div>
                  <div className="text-sm font-semibold text-navy-900">{formatSlotLabel(s.time)}</div>
                </Link>
              ))}
            </div>
          )}

          <Link href={base} className="btn-primary mt-4 w-full justify-center">
            Book my visit <ArrowRight size={16} />
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full py-2 text-xs text-navy-800/45 hover:text-navy-800/70">
            Not now, keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
