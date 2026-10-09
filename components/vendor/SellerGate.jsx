"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Clock, ShieldCheck, ShieldAlert, Home, Briefcase, Building2, CheckCircle2, FileCheck2, BadgePercent,
  AlertCircle, Send, UserRound, Phone as PhoneIcon,
} from "lucide-react";
import StudioShell from "./StudioShell";
import { Section, Field, FileUpload, inputClass } from "@/components/vendor/listing/WizardUI";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

// Only approved sellers see the seller panel and listing form. Everyone else
// gets the seller application, or a "waiting for approval" / "suspended"
// screen. `shell` wraps those screens in the seller panel frame (used on the
// dashboard, which has no frame of its own).
export default function SellerGate({ children, shell = false }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/vendor/seller", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load your seller account.");
        setState(json);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  if (state?.status === "approved") return children;

  const body = error ? (
    <p className="flex items-center gap-2 rounded-2xl bg-coral-500/10 p-4 text-sm text-coral-600">
      <AlertCircle size={16} /> {error}
    </p>
  ) : !state ? (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-20 text-sm text-navy-800/50 shadow-soft">
      <Loader2 size={16} className="animate-spin" /> Checking your seller account…
    </div>
  ) : state.status === "pending" ? (
    <PendingScreen state={state} onEdit={() => setState({ ...state, status: "editing" })} />
  ) : state.status === "suspended" ? (
    <StatusCard
      Icon={ShieldAlert}
      tone="coral"
      title="Your seller account is suspended"
      text="You can't add or edit listings right now. Please contact our team to reactivate your account."
    >
      <Link href="/contact" className="btn-primary mt-6">Contact us</Link>
    </StatusCard>
  ) : (
    <SellerApplication state={state} onSubmitted={load} />
  );

  if (!shell) return body;
  return (
    <StudioShell active="overview" title="Seller account" subtitle="Get approved once, then list as many properties as you like.">
      {body}
    </StudioShell>
  );
}

function StatusCard({ Icon, tone = "teal", title, text, children }) {
  const ring = tone === "coral" ? "bg-coral-500/10 text-coral-600" : tone === "amber" ? "bg-amber-500/15 text-amber-600" : "bg-teal-500/10 text-teal-600";
  return (
    <div className="mx-auto max-w-2xl rounded-[1.6rem] bg-white p-8 text-center shadow-card ring-1 ring-navy-900/5 md:p-10">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${ring}`}>
        <Icon size={30} />
      </span>
      <h2 className="mt-5 font-display text-2xl text-navy-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-navy-800/60">{text}</p>
      {children}
    </div>
  );
}

function PendingScreen({ state, onEdit }) {
  const steps = [
    { label: "Application sent", done: true },
    { label: "Our team checks your details", done: false, active: true },
    { label: "Start listing properties", done: false },
  ];
  return (
    <StatusCard
      Icon={Clock}
      tone="amber"
      title="Your application is under review"
      text="Thanks for applying! Our team checks every seller to keep listings trustworthy. This usually takes less than one working day."
    >
      <ol className="mx-auto mt-7 max-w-sm space-y-3 text-left">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                s.done ? "bg-teal-500 text-white" : s.active ? "bg-amber-500 text-white" : "bg-navy-900/8 text-navy-800/45"
              }`}
            >
              {s.done ? <CheckCircle2 size={15} /> : i + 1}
            </span>
            <span className={s.done || s.active ? "font-semibold text-navy-900" : "text-navy-800/50"}>{s.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onEdit} className="btn-outline">Update my details</button>
        <Link href="/" className="btn-primary">Back to website</Link>
      </div>
      {state.profile?.business_name && (
        <p className="mt-5 text-xs text-navy-800/45">Applied as {state.profile.business_name}</p>
      )}
    </StatusCard>
  );
}

const TYPES = [
  { v: "owner", t: "Property owner", d: "I own the property I'm listing", I: Home },
  { v: "agent", t: "Agent / broker", d: "I list properties for clients", I: Briefcase },
  { v: "builder", t: "Builder / developer", d: "I build and sell projects", I: Building2 },
];

function SellerApplication({ state, onSubmitted }) {
  const { site_title, currency_symbol: symbol = "₹", commission_per_visit, commission_per_lead, commission_deal_type, commission_deal_value } = useSiteSettings();
  const [f, setF] = useState(() => ({
    seller_type: "owner", business_name: "", contact_phone: state.user?.phone || "", contact_email: state.user?.email || "",
    address: "", city: "", pan_number: "", gst_number: "", rera_number: "", id_proof_url: "", about: "",
    ...Object.fromEntries(Object.entries(state.profile || {}).filter(([, v]) => v)),
    accept_terms: false,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const E = (k) => errors[k];

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/vendor/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.fieldErrors || {});
        setMessage(json.error || "Could not send your application.");
        setTimeout(() => document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
        return;
      }
      onSubmitted();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const rates = [
    Number(commission_per_visit) > 0 && `${symbol}${commission_per_visit} per completed visit`,
    Number(commission_per_lead) > 0 && `${symbol}${commission_per_lead} per buyer lead`,
    Number(commission_deal_value) > 0 &&
      (commission_deal_type === "fixed" ? `${symbol}${commission_deal_value} per deal closed` : `${commission_deal_value}% of the price per deal closed`),
  ].filter(Boolean);
  const isBusiness = f.seller_type !== "owner";
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5" noValidate>
      {state.status === "rejected" && (
        <div className="flex gap-3 rounded-2xl bg-coral-500/10 p-4 text-sm text-coral-600">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Your last application wasn&apos;t approved</div>
            {state.rejectionReason && <p className="mt-0.5">Reason: {state.rejectionReason}</p>}
            <p className="mt-0.5">Fix the details below and send it again.</p>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-white md:p-8">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-teal-500/25 blur-3xl" />
        <h2 className="relative font-display text-2xl md:text-3xl">Become a seller on {site_title}</h2>
        <p className="relative mt-2 max-w-xl text-sm text-white/65">
          Tell us a little about yourself. Once our team approves your account, you can list properties, get buyer leads and track visits.
        </p>
        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { I: UserRound, t: "1. Your details", d: "2 minutes" },
            { I: ShieldCheck, t: "2. We verify", d: "Usually within a day" },
            { I: CheckCircle2, t: "3. Start listing", d: "Unlimited listings" },
          ].map(({ I, t, d }) => (
            <div key={t} className="flex items-center gap-3 rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <I size={18} className="shrink-0 text-teal-300" />
              <div>
                <div className="text-sm font-semibold">{t}</div>
                <div className="text-xs text-white/50">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Section icon={UserRound} title="Who are you selling as? *" error={E("seller_type")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map(({ v, t, d, I }) => {
            const active = f.seller_type === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => set("seller_type", v)}
                className={`relative rounded-2xl p-4 text-left transition-all ${active ? "bg-navy-900 text-white shadow-card" : "bg-sand-50 ring-1 ring-navy-900/10 hover:ring-teal-500/50"}`}
              >
                <I size={20} className={active ? "text-teal-300" : "text-teal-600"} />
                <span className="mt-2 block font-semibold">{t}</span>
                <span className={`block text-xs ${active ? "text-white/60" : "text-navy-800/50"}`}>{d}</span>
                {active && <CheckCircle2 size={17} className="absolute right-3 top-3 text-teal-400" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={PhoneIcon} title="Contact details" subtitle="Our team uses these to verify you. Buyers contact you through the site.">
        <div className="grid gap-4 sm:grid-cols-2">
          {isBusiness && (
            <Field label={f.seller_type === "agent" ? "Agency name" : "Company name"} required error={E("business_name")} className="sm:col-span-2">
              <input value={f.business_name} maxLength={160} onChange={(e) => set("business_name", e.target.value)} className={inputClass} />
            </Field>
          )}
          <Field label="Phone number" required error={E("contact_phone")}>
            <input type="tel" value={f.contact_phone} maxLength={30} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
          </Field>
          <Field label="Email" error={E("contact_email")} hint="Optional">
            <input type="email" value={f.contact_email} maxLength={160} onChange={(e) => set("contact_email", e.target.value)} placeholder="you@example.com" className={inputClass} />
          </Field>
          <Field label="City" required error={E("city")}>
            <input value={f.city} maxLength={120} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Jaipur" className={inputClass} />
          </Field>
          <Field label="Address" required error={E("address")}>
            <input value={f.address} maxLength={255} onChange={(e) => set("address", e.target.value)} placeholder="House / office, street, area" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section icon={FileCheck2} title="Verification" subtitle="Only our team sees these. They're never shown to buyers.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="PAN number" required error={E("pan_number")} hint="10 characters, like ABCDE1234F">
            <input value={f.pan_number} maxLength={10} onChange={(e) => set("pan_number", e.target.value.toUpperCase())} placeholder="ABCDE1234F" className={`${inputClass} uppercase`} />
          </Field>
          <Field label="GST number" error={E("gst_number")} hint="Optional · 15 characters">
            <input value={f.gst_number} maxLength={15} onChange={(e) => set("gst_number", e.target.value.toUpperCase())} placeholder="22ABCDE1234F1Z5" className={`${inputClass} uppercase`} />
          </Field>
          <Field label="RERA registration number" required={f.seller_type === "builder"} error={E("rera_number")} hint={f.seller_type === "builder" ? undefined : "Optional for owners and agents"} className="sm:col-span-2">
            <input value={f.rera_number} maxLength={100} onChange={(e) => set("rera_number", e.target.value)} className={inputClass} />
          </Field>
          <Field label="ID proof" required error={E("id_proof_url")} hint="Aadhaar, PAN card, passport or business registration · image or PDF" className="sm:col-span-2">
            <FileUpload value={f.id_proof_url} onChange={(v) => set("id_proof_url", v)} accept="image/*,application/pdf" label="ID proof" hint="Image or PDF" icon={FileCheck2} />
          </Field>
          <Field label="About you" hint="Optional · e.g. years of experience, areas you cover" className="sm:col-span-2">
            <textarea rows={3} value={f.about} maxLength={2000} onChange={(e) => set("about", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section icon={BadgePercent} title="Commission" subtitle="Listing is free. You pay a commission only when the site brings you results." error={E("accept_terms")}>
        {rates.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-navy-800/75">
            {rates.map((r) => (
              <li key={r} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-teal-600" /> {r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-navy-800/60">There is currently no commission for sellers.</p>
        )}
        <p className="mt-2 text-xs text-navy-800/45">Rates may be agreed separately for your account. You can see and pay every charge from the Payments tab in your seller panel.</p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-sand-50 p-3 ring-1 ring-navy-900/10">
          <input type="checkbox" checked={f.accept_terms} onChange={(e) => set("accept_terms", e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-500" />
          <span className="text-sm text-navy-800/75">
            I confirm these details are correct and I accept the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-teal-600 hover:underline">seller terms</Link> and commission policy.
          </span>
        </label>
      </Section>

      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-coral-500/10 px-4 py-3 text-sm font-medium text-coral-600">
          <AlertCircle size={16} className="shrink-0" />
          {errorCount > 0 ? `Please fix the ${errorCount === 1 ? "highlighted field" : `${errorCount} highlighted fields`} above.` : message}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary px-8">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {state.status === "editing" ? "Update application" : "Send for approval"}
        </button>
      </div>
    </form>
  );
}
