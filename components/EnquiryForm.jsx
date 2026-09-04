"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export default function EnquiryForm({ propertyId, projectId, agentId, heading = "Interested? Send an enquiry" }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface space-y-3 p-5">
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
