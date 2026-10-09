"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet, Clock, CheckCircle2, AlertCircle, Loader2, X, Copy, Check, Receipt, CalendarCheck, Inbox, Handshake, FileText,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { Field, FileUpload, inputClass } from "@/components/vendor/listing/WizardUI";
import { formatDate, EmptyState } from "./vendorShared";

const TYPE_META = {
  visit: { label: "Visit", Icon: CalendarCheck },
  lead: { label: "Lead", Icon: Inbox },
  deal: { label: "Deal", Icon: Handshake },
  other: { label: "Other", Icon: FileText },
};
const STATUS_META = {
  unpaid: { label: "Due", cls: "bg-coral-500/10 text-coral-600" },
  submitted: { label: "Payment under review", cls: "bg-amber-500/15 text-amber-700" },
  paid: { label: "Paid", cls: "bg-teal-500/10 text-teal-600" },
  waived: { label: "Waived", cls: "bg-navy-900/8 text-navy-800/60" },
};
const METHODS = { upi: "UPI", bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque", other: "Other" };

// Seller panel → Payments: what they owe the site in commission, the rates
// that apply to them, and a "Pay" flow that records their payment reference
// for an admin to verify.
export default function VendorPayments({ symbol }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [paying, setPaying] = useState(null); // array of charges
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/charges", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load your payments.");
      setData(json);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const money = (n) => `${symbol}${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const unpaid = useMemo(() => (data?.charges || []).filter((c) => c.status === "unpaid"), [data]);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-coral-500/10 p-4 text-sm text-coral-600">
        <AlertCircle size={16} /> {error}
        <button type="button" onClick={load} className="ml-auto font-semibold underline">Retry</button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl bg-white py-20 text-sm text-navy-800/50">
        <Loader2 size={16} className="animate-spin" /> Loading payments…
      </div>
    );
  }

  const { summary, rates, charges } = data;
  const rateRows = [
    { label: "Per completed visit", value: rates.visit > 0 ? money(rates.visit) : "Free", custom: rates.custom.visit },
    { label: "Per buyer lead", value: rates.lead > 0 ? money(rates.lead) : "Free", custom: rates.custom.lead },
    {
      label: "Per deal (sold / rented)",
      value: rates.dealValue > 0 ? (rates.dealType === "fixed" ? money(rates.dealValue) : `${rates.dealValue}% of price`) : "Free",
      custom: rates.custom.deal,
    },
  ];
  const selectedCharges = unpaid.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard Icon={Wallet} tone="coral" label="Amount due" value={money(summary.unpaid.total)} sub={`${summary.unpaid.count} unpaid ${summary.unpaid.count === 1 ? "charge" : "charges"}`} />
        <SummaryCard Icon={Clock} tone="amber" label="Under review" value={money(summary.submitted.total)} sub="Payments we're verifying" />
        <SummaryCard Icon={CheckCircle2} tone="teal" label="Paid so far" value={money(summary.paid.total)} sub={`${summary.paid.count} paid`} />
      </div>

      {summary.unpaid.total > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-950 p-5 text-white md:p-6">
          <div className="flex-1">
            <div className="font-display text-xl">You have {money(summary.unpaid.total)} due</div>
            <p className="mt-0.5 text-sm text-white/60">Pay everything at once, or tick individual charges below.</p>
          </div>
          <button type="button" onClick={() => setPaying(unpaid)} className="btn-primary">
            <Wallet size={16} /> Pay all due
          </button>
        </div>
      )}

      {notice && (
        <p className="flex items-center gap-2 rounded-2xl bg-teal-500/10 p-4 text-sm font-medium text-teal-600">
          <CheckCircle2 size={16} /> {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),300px]">
        <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-navy-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-900/5 px-5 py-4">
            <h3 className="font-display text-lg text-navy-900">Charges</h3>
            {selectedCharges.length > 0 && (
              <button type="button" onClick={() => setPaying(selectedCharges)} className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-600">
                Pay selected ({money(selectedCharges.reduce((s, c) => s + Number(c.amount), 0))})
              </button>
            )}
          </div>
          {charges.length === 0 ? (
            <EmptyState Icon={Receipt} title="No charges yet" text="When the site brings you visits, leads or deals, the commission shows up here." />
          ) : (
            <ul className="divide-y divide-navy-900/5">
              {charges.map((c) => {
                const T = TYPE_META[c.charge_type] || TYPE_META.other;
                const S = STATUS_META[c.status];
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    {c.status === "unpaid" ? (
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-teal-500" aria-label="Select charge" />
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                      <T.Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-navy-900">{c.description}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-navy-800/50">
                        <span>{T.label}</span>·<span>{formatDate(c.created_at)}</span>
                        {c.deal_value > 0 && <>·<span>Deal value {money(c.deal_value)}</span></>}
                        {c.payment_reference && <>·<span>Ref {c.payment_reference}</span></>}
                      </div>
                      {c.status === "unpaid" && c.payment_note && (
                        <div className="mt-1 text-xs text-coral-600">Note from our team: {c.payment_note}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg text-navy-900">{money(c.amount)}</div>
                      <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${S.cls}`}>{S.label}</span>
                    </div>
                    {c.status === "unpaid" && (
                      <button type="button" onClick={() => setPaying([c])} className="rounded-full bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-500/20">
                        Pay
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5">
          <h3 className="font-display text-lg text-navy-900">Your commission rates</h3>
          {!rates.enabled && <p className="mt-1 text-xs text-navy-800/50">Automatic charges are paused right now.</p>}
          <dl className="mt-3 space-y-2.5">
            {rateRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-2 border-b border-navy-900/5 pb-2.5 text-sm last:border-0">
                <dt className="text-navy-800/60">{r.label}</dt>
                <dd className="text-right font-semibold text-navy-900">
                  {r.value}
                  {r.custom && <span className="ml-1.5 rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-600">Your rate</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-navy-800/45">
            Questions about a charge? <Link href="/contact" className="font-semibold text-teal-600 hover:underline">Contact us</Link>.
          </p>
        </aside>
      </div>

      {paying && (
        <PayModal
          charges={paying}
          money={money}
          onClose={() => setPaying(null)}
          onDone={(n) => {
            setPaying(null);
            setSelected([]);
            setNotice(`Thanks! We've received your payment details for ${n} ${n === 1 ? "charge" : "charges"}. We'll confirm once it's verified.`);
            load();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ Icon, tone, label, value, sub }) {
  const cls = { coral: "bg-coral-500/10 text-coral-600", amber: "bg-amber-500/15 text-amber-600", teal: "bg-teal-500/10 text-teal-600" }[tone];
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><Icon size={19} /></span>
      <div className="mt-3 text-sm text-navy-800/55">{label}</div>
      <div className="font-display text-2xl text-navy-900">{value}</div>
      <div className="text-xs text-navy-800/45">{sub}</div>
    </div>
  );
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-4 py-3 ring-1 ring-navy-900/8">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-navy-800/45">{label}</div>
        <div className="whitespace-pre-line break-words text-sm font-semibold text-navy-900">{value}</div>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="shrink-0 rounded-lg p-2 text-navy-800/50 hover:bg-white hover:text-teal-600"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={16} className="text-teal-600" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function PayModal({ charges, money, onClose, onDone }) {
  const { payment_upi_id, payment_bank_details, payment_instructions } = useSiteSettings();
  const total = charges.reduce((s, c) => s + Number(c.amount), 0);
  const [f, setF] = useState({ method: payment_upi_id ? "upi" : "bank_transfer", reference: "", note: "", proof_url: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/vendor/charges/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, ids: charges.map((c) => c.id) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.fieldErrors || {});
        setMessage(json.fieldErrors ? "" : json.error);
        return;
      }
      onDone(json.updated);
    } catch {
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const upiLink = payment_upi_id ? `upi://pay?pa=${encodeURIComponent(payment_upi_id)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Seller commission")}` : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-card sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
          <div>
            <h2 className="font-display text-xl text-navy-900">Pay {money(total)}</h2>
            <p className="text-xs text-navy-800/50">{charges.length} {charges.length === 1 ? "charge" : "charges"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <div className="mb-2 text-sm font-semibold text-navy-900">Step 1 · Send the payment</div>
            {payment_instructions && <p className="mb-3 text-sm text-navy-800/60">{payment_instructions}</p>}
            <div className="space-y-2">
              {payment_upi_id && <CopyRow label="UPI ID" value={payment_upi_id} />}
              {payment_bank_details && <CopyRow label="Bank transfer" value={payment_bank_details} />}
              {!payment_upi_id && !payment_bank_details && (
                <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">Contact our team for payment details, then record your payment below.</p>
              )}
            </div>
            {upiLink && (
              <a href={upiLink} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline sm:hidden">
                Open UPI app to pay {money(total)}
              </a>
            )}
          </div>

          <div className="border-t border-navy-900/8 pt-4">
            <div className="mb-3 text-sm font-semibold text-navy-900">Step 2 · Tell us you&apos;ve paid</div>
            <div className="space-y-4">
              <Field label="Paid by" required error={errors.method}>
                <select value={f.method} onChange={(e) => set("method", e.target.value)} className={inputClass}>
                  {Object.entries(METHODS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </Field>
              <Field label="Transaction / UTR / cheque number" required error={errors.reference} hint="Copy it exactly from your payment app or bank statement.">
                <input value={f.reference} maxLength={120} onChange={(e) => set("reference", e.target.value)} placeholder="e.g. 412345678901" className={inputClass} />
              </Field>
              <Field label="Payment screenshot" error={errors.proof_url} hint="Optional, but it speeds up verification.">
                <FileUpload value={f.proof_url} onChange={(v) => set("proof_url", v)} accept="image/*,application/pdf" label="Screenshot" hint="Image or PDF" />
              </Field>
              <Field label="Note" hint="Optional">
                <input value={f.note} maxLength={500} onChange={(e) => set("note", e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>
          {(message || errors.ids) && <p className="rounded-xl bg-coral-500/10 px-4 py-3 text-sm text-coral-600">{message || errors.ids}</p>}
        </div>
        <div className="flex gap-2 border-t border-navy-900/8 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} I&apos;ve paid
          </button>
        </div>
      </form>
    </div>
  );
}
