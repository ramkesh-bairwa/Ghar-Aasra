"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarHeart, MapPin, MessageSquare } from "lucide-react";

const STATUS_STYLES = {
  new: "bg-coral-500/10 text-coral-600",
  contacted: "bg-sand-100 text-navy-800/70",
  scheduled: "bg-teal-500/15 text-teal-700",
  closed: "bg-navy-900/10 text-navy-800/70",
};

export default function VisitRequestsList() {
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    fetch("/api/schedule-visit/mine")
      .then((res) => (res.ok ? res.json() : { visitRequests: [] }))
      .then((data) => setRequests(data.visitRequests || []))
      .catch(() => setRequests([]));
  }, []);

  if (requests !== null && requests.length === 0) return null;

  return (
    <section className="border-t border-navy-900/8 bg-sand-50 py-10">
      <div className="container-page">
        <h2 className="font-display text-xl text-navy-900">Visit requests</h2>
        <p className="mt-1 text-sm text-navy-800/55">
          {requests === null
            ? "Loading your visit requests…"
            : `Submitted via "Schedule a Visit" — our team will follow up on these directly.`}
        </p>

        {requests && requests.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((r) => (
              <div key={r.id} className="card-surface overflow-hidden">
                {r.cover_image_url && (
                  <img src={r.cover_image_url} alt={r.property_title} className="h-40 w-full object-cover" />
                )}
                <div className="p-4">
                  <span className={`badge-pill capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.new}`}>
                    {r.status}
                  </span>
                  {r.property_slug ? (
                    <Link href={`/properties/${r.property_slug}`} className="mt-2 block font-display text-lg text-navy-900 hover:text-teal-600">
                      {r.property_title}
                    </Link>
                  ) : (
                    <p className="mt-2 font-display text-lg text-navy-900">General enquiry</p>
                  )}
                  {r.address && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                      <MapPin size={13} /> {r.address}
                    </p>
                  )}
                  <p className="mt-3 flex items-center gap-1.5 border-t border-navy-900/8 pt-3 text-sm text-navy-800/70">
                    <CalendarHeart size={15} />
                    {new Date(`${r.preferred_date}T${r.preferred_time}`).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {r.message && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-navy-800/55">
                      <MessageSquare size={13} className="mt-0.5 shrink-0" /> {r.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
