"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-sand-100 text-navy-800/70",
  confirmed: "bg-teal-500/15 text-teal-700",
  completed: "bg-navy-900/10 text-navy-800/70",
  cancelled: "bg-coral-500/10 text-coral-600",
};

export default function BookingsList() {
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => (res.ok ? res.json() : { bookings: [] }))
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]));
  }, []);

  if (bookings !== null && bookings.length === 0) return null;

  return (
    <section className="bg-sand-50 py-10">
      <div className="container-page">
        <h2 className="font-display text-xl text-navy-900">Confirmed Visits</h2>
        <div className="flex items-center justify-between py-4 text-sm text-navy-800/55">
          <span>
            {bookings === null
              ? "Loading your visits…"
              : `${bookings.length} confirmed ${bookings.length === 1 ? "visit" : "visits"}`}
          </span>
        </div>

        {bookings && bookings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => (
              <div key={b.id} className="card-surface overflow-hidden">
                {b.cover_image_url && (
                  <img src={b.cover_image_url} alt={b.property_title} className="h-40 w-full object-cover" />
                )}
                <div className="p-4">
                  <span className={`badge-pill capitalize ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                    {b.status}
                  </span>
                  <Link href={`/properties/${b.property_slug}`} className="mt-2 block font-display text-lg text-navy-900 hover:text-teal-600">
                    {b.property_title}
                  </Link>
                  {b.address && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                      <MapPin size={13} /> {b.address}
                    </p>
                  )}
                  <p className="mt-3 flex items-center gap-1.5 border-t border-navy-900/8 pt-3 text-sm text-navy-800/70">
                    <CalendarClock size={15} />
                    {new Date(b.scheduled_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {b.notes && <p className="mt-2 text-sm text-navy-800/55">{b.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
