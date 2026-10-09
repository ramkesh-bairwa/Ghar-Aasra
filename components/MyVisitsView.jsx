"use client";

import { useState } from "react";
import { CalendarHeart } from "lucide-react";
import BookingsList from "@/components/BookingsList";
import VisitRequestsList from "@/components/VisitRequestsList";
import EmptyState from "@/components/EmptyState";

// My Visits = booked visits + "Schedule a visit" requests. Each list hides
// itself when empty; when both turn out empty, show one friendly empty state.
export default function MyVisitsView() {
  const [counts, setCounts] = useState({ bookings: null, requests: null });
  const bothEmpty = counts.bookings === 0 && counts.requests === 0;

  return (
    <>
      <BookingsList onLoaded={(n) => setCounts((c) => ({ ...c, bookings: n }))} />
      <VisitRequestsList onLoaded={(n) => setCounts((c) => ({ ...c, requests: n }))} />
      {bothEmpty && (
        <section className="bg-sand-50 py-10">
          <div className="container-page">
            <EmptyState
              icon={CalendarHeart}
              title="No visits booked yet"
              text="Found a place you like? Book a free visit or a video tour in under a minute. No obligation."
              primary={{ label: "Find a property", href: "/properties" }}
              secondary={{ label: "Schedule a visit", href: "/schedule-visit" }}
            />
          </div>
        </section>
      )}
    </>
  );
}
