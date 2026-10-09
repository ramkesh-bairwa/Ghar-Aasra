"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2, CalendarCheck } from "lucide-react";

export default function EnquiryForm({ propertyId, projectId, agentId, propertySlug, heading = "Interested? Send an enquiry" }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const formRef = useRef(null);

  // PropertyQuestions' one-tap chips land here when WhatsApp isn't set up:
  // drop the question into the message box and bring the form into view.
  useEffect(() => {
    function onPrefill(e) {
      setStatus("idle");
      setForm((f) => ({ ...f, message: e.detail }));
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        formRef.current?.querySelector("input")?.focus({ preventScroll: true });
      });
    }
    window.addEventListener("fh:prefill-enquiry", onPrefill);
    return () => window.removeEventListener("fh:prefill-enquiry", onPrefill);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId, projectId, agentId }),
      });
    } catch {
      /* still show success — enquiry UX shouldn't block on network */
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="card-surface flex flex-col items-center gap-2 p-6 text-center">
        <CheckCircle2 className="text-teal-600" size={28} />
        <p className="text-sm font-medium text-navy-900">Enquiry sent</p>
        <p className="text-xs text-navy-800/55">Someone from the team will get back to you shortly.</p>
        {/* Someone who just enquired is the warmest possible lead — offer the
            visit right now instead of letting them wait for a reply. */}
        {propertySlug && (
          <div className="mt-3 w-full border-t border-navy-900/8 pt-4">
            <p className="text-sm font-semibold text-navy-900">Why wait? See it in person</p>
            <p className="mt-0.5 text-xs text-navy-800/55">Pick a time now, it&apos;s free.</p>
            <Link href={`/properties/${propertySlug}/visit`} className="btn-primary mt-3 w-full justify-center">
              <CalendarCheck size={15} /> Book a visit
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card-surface space-y-3 p-5">
      <h3 className="font-display text-lg text-navy-900">{heading}</h3>
      <input
        required
        placeholder="Full name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      />
      <input
        required
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      />
      <input
        placeholder="Phone number (optional)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      />
      <textarea
        rows={3}
        placeholder="I'd like to book a viewing..."
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      />
      <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
        <Send size={15} />
        {status === "sending" ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
