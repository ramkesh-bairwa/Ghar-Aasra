"use client";

import { useState } from "react";
import { PhoneCall, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

// "Call me back" — the lowest-effort lead form on the property page: just a
// name and a phone number. Lands in admin Enquiries with source = callback.
export default function CallbackRequest({ propertyId, propertyTitle }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "callback",
          name: name || user?.name,
          phone: phone || user?.phone,
          email: user?.email || null,
          propertyId,
          message: `Callback requested about "${propertyTitle}".`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not send — please try again.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Network problem — please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="card-surface flex items-center gap-3 p-5">
        <CheckCircle2 size={22} className="shrink-0 text-teal-600" />
        <div>
          <p className="text-sm font-semibold text-navy-900">We&apos;ll call you shortly</p>
          <p className="text-xs text-navy-800/55">Keep your phone handy — an agent will ring you back.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-surface p-5">
      <h3 className="flex items-center gap-2 font-display text-lg text-navy-900">
        <PhoneCall size={17} className="text-teal-600" /> Prefer a quick call?
      </h3>
      <p className="mt-1 text-xs text-navy-800/55">Leave your number and an agent will call you back.</p>
      <div className="mt-3 flex flex-col gap-2">
        {!user?.name && (
          <input
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        )}
        <input
          required={!user?.phone}
          type="tel"
          placeholder={user?.phone ? `Call me on ${user.phone}` : "Phone number"}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
        {error && <p className="text-xs text-coral-600">{error}</p>}
        <button type="submit" disabled={status === "sending"} className="btn-outline w-full">
          {status === "sending" ? "Sending…" : "Call me back"}
        </button>
      </div>
    </form>
  );
}
