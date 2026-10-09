"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, MapPin, MessageSquare } from "lucide-react";
import { VisitCover, StatusPill, CodeChip, DateTile, SectionHeading } from "@/components/VisitCardParts";

const STATUS_TONES = {
  new: { pill: "bg-white/95 text-coral-600", dot: "bg-coral-500" },
  contacted: { pill: "bg-amber-50/95 text-amber-800", dot: "bg-amber-500" },
  scheduled: { pill: "bg-white/95 text-teal-600", dot: "bg-teal-500" },
  closed: { pill: "bg-white/90 text-navy-800/70", dot: "bg-navy-800/50" },
};

export default function VisitRequestsList({ onLoaded }) {
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    fetch("/api/schedule-visit/mine")
      .then((res) => (res.ok ? res.json() : { visitRequests: [] }))
      .then((data) => setRequests(data.visitRequests || []))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    if (requests !== null) onLoaded?.(requests.length);
  }, [requests]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!requests || requests.length === 0) return null;

  return (
    <section className="border-t border-navy-900/5 bg-sand-50 py-12">
      <div className="container-page">
        <SectionHeading
          icon={Inbox}
          title="Visit requests"
          subtitle={`Submitted via "Schedule a Visit" — our team will follow up on these directly.`}
          stats={[{ label: "Requests", value: requests.length }]}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <article key={r.id} className="card-surface group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
              <VisitCover src={r.cover_image_url} alt={r.property_title}>
                <StatusPill tone={STATUS_TONES[r.status] || STATUS_TONES.new} label={r.status} />
                <CodeChip code={r.booking_code} />
              </VisitCover>
              <div className="flex flex-1 flex-col p-5">
                {r.property_slug ? (
                  <Link href={`/properties/${r.property_slug}`} className="font-display text-lg leading-snug text-navy-900 transition-colors hover:text-teal-600">
                    {r.property_title}
                  </Link>
                ) : (
                  <p className="font-display text-lg text-navy-900">General enquiry</p>
                )}
                {r.address && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                    <MapPin size={13} className="shrink-0" /> <span className="truncate">{r.address}</span>
                  </p>
                )}
                <div className="mt-4">
                  <DateTile when={new Date(`${r.preferred_date}T${r.preferred_time}`)} muted={r.status === "closed"} />
                </div>
                {r.message && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-sand-100/70 p-3 text-sm text-navy-800/65">
                    <MessageSquare size={14} className="mt-0.5 shrink-0 text-teal-600" /> {r.message}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
