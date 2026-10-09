"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Store, AlertCircle, Inbox, CheckCircle2, XCircle, PauseCircle, PlayCircle, FileText, ExternalLink, Loader2, ShieldCheck, Wallet,
} from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import { TableSkeletonRows } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import {
  AField, ainput, Modal, Badge, SELLER_STATUS, SELLER_TYPE_LABELS, useMoney, formatDay, scrollToFirstError,
} from "@/components/admin/sellerAdminUI";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

export default function AdminSellersPage() {
  return (
    <AdminGate>
      <SellersManager />
    </AdminGate>
  );
}

function SellersManager() {
  const money = useMoney();
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/admin/sellers${tab ? `?status=${tab}` : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load sellers.");
      setRows(json.rows);
      setCounts(json.counts || {});
    } catch (err) {
      setError(err.message);
      setRows([]);
    }
  }, [tab]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Sellers</h1>
          <p className="mt-1 text-sm text-navy-800/55">
            Sellers who sign up need your approval before they can list. Sellers you add here are approved straight away.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> Add seller
        </button>
      </div>

      {counts.pending > 0 && tab !== "pending" && (
        <button onClick={() => setTab("pending")} className="mt-4 flex w-full items-center gap-2 rounded-xl2 border border-amber-500/30 bg-amber-500/10 p-3 text-left text-sm font-medium text-amber-800">
          <AlertCircle size={16} /> {counts.pending} seller {counts.pending === 1 ? "application is" : "applications are"} waiting for approval. Review now →
        </button>
      )}

      <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-soft ring-1 ring-navy-900/5 sm:w-fit">
        {TABS.map((t) => {
          const n = t.key ? counts[t.key] : Object.values(counts).reduce((a, b) => a + b, 0);
          return (
            <button
              key={t.key || "all"}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-navy-900 text-white" : "text-navy-800/60 hover:text-navy-900"
              }`}
            >
              {t.label}
              {n > 0 && (
                <span className={`rounded-full px-1.5 text-[11px] ${tab === t.key ? "bg-white/20" : t.key === "pending" ? "bg-amber-500 text-white" : "bg-navy-900/8"}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/8 bg-sand-50 text-xs uppercase tracking-wide text-navy-800/40">
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Listings</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <TableSkeletonRows cols={7} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-navy-800/40">
                  <Inbox size={22} className="mx-auto mb-2 text-navy-800/20" />
                  {tab === "pending" ? "No applications waiting. You're all caught up." : "No sellers here yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="cursor-pointer border-b border-navy-900/5 last:border-0 hover:bg-sand-50" onClick={() => setOpenId(r.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{r.name}</div>
                    <div className="text-xs text-navy-800/50">
                      {[r.business_name, SELLER_TYPE_LABELS[r.seller_type]].filter(Boolean).join(" · ") || "—"}
                      {r.seller_created_by_admin ? " · added by admin" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">
                    <div>{r.email || "—"}</div>
                    <div className="text-xs text-navy-800/50">{r.contact_phone || r.phone || ""}{r.city ? ` · ${r.city}` : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">{r.listings}</td>
                  <td className="px-4 py-3">
                    <div className={Number(r.due) > 0 ? "font-semibold text-coral-600" : "text-navy-800/50"}>{money(r.due)}</div>
                    {Number(r.submitted) > 0 && <div className="text-xs text-amber-700">{money(r.submitted)} to verify</div>}
                  </td>
                  <td className="px-4 py-3"><Badge meta={SELLER_STATUS[r.seller_status]} /></td>
                  <td className="px-4 py-3 text-navy-800/60">{formatDay(r.applied_at || r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-600">
                      {r.seller_status === "pending" ? "Review" : "Open"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && <SellerFormModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setTab("approved"); load(); }} />}
      {openId && <SellerDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

// ---------- Create / edit form ----------

const BLANK = {
  name: "", email: "", phone: "", password: "", seller_type: "owner", business_name: "", contact_phone: "", contact_email: "",
  address: "", city: "", pan_number: "", gst_number: "", rera_number: "", id_proof_url: "", about: "",
  commission_per_visit: "", commission_per_lead: "", commission_deal_type: "", commission_deal_value: "", admin_notes: "",
};

function ProfileFields({ f, set, E }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AField label="Seller type" required error={E("seller_type")}>
        <select value={f.seller_type} onChange={(e) => set("seller_type", e.target.value)} className={ainput}>
          {Object.entries(SELLER_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </AField>
      <AField label={f.seller_type === "agent" ? "Agency name" : "Company / business name"} required={f.seller_type !== "owner"} error={E("business_name")}>
        <input value={f.business_name || ""} onChange={(e) => set("business_name", e.target.value)} className={ainput} />
      </AField>
      <AField label="Contact phone" error={E("contact_phone")}><input value={f.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} className={ainput} /></AField>
      <AField label="Contact email" error={E("contact_email")}><input value={f.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} className={ainput} /></AField>
      <AField label="City" error={E("city")}><input value={f.city || ""} onChange={(e) => set("city", e.target.value)} className={ainput} /></AField>
      <AField label="Address" error={E("address")}><input value={f.address || ""} onChange={(e) => set("address", e.target.value)} className={ainput} /></AField>
      <AField label="PAN" error={E("pan_number")}><input value={f.pan_number || ""} onChange={(e) => set("pan_number", e.target.value.toUpperCase())} className={`${ainput} uppercase`} /></AField>
      <AField label="GST" error={E("gst_number")}><input value={f.gst_number || ""} onChange={(e) => set("gst_number", e.target.value.toUpperCase())} className={`${ainput} uppercase`} /></AField>
      <AField label="RERA number" error={E("rera_number")} className="sm:col-span-2"><input value={f.rera_number || ""} onChange={(e) => set("rera_number", e.target.value)} className={ainput} /></AField>
    </div>
  );
}

function CommissionFields({ f, set, E }) {
  const s = useSiteSettings();
  const sym = s.currency_symbol || "₹";
  const globalDeal = s.commission_deal_type === "fixed" ? `${sym}${s.commission_deal_value || 0}` : `${s.commission_deal_value || 0}%`;
  return (
    <div>
      <p className="mb-3 text-xs text-navy-800/55">
        Leave blank to use the site-wide rates from Site Settings → Seller commission (visit {sym}{s.commission_per_visit || 0}, lead {sym}{s.commission_per_lead || 0}, deal {globalDeal}).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <AField label={`Per visit (${sym})`} error={E("commission_per_visit")}>
          <input type="number" min="0" value={f.commission_per_visit ?? ""} onChange={(e) => set("commission_per_visit", e.target.value)} placeholder={`Default: ${s.commission_per_visit || 0}`} className={ainput} />
        </AField>
        <AField label={`Per lead (${sym})`} error={E("commission_per_lead")}>
          <input type="number" min="0" value={f.commission_per_lead ?? ""} onChange={(e) => set("commission_per_lead", e.target.value)} placeholder={`Default: ${s.commission_per_lead || 0}`} className={ainput} />
        </AField>
        <AField label="Per deal — charge as" error={E("commission_deal_type")}>
          <select value={f.commission_deal_type || ""} onChange={(e) => set("commission_deal_type", e.target.value)} className={ainput}>
            <option value="">Default ({s.commission_deal_type === "fixed" ? "fixed amount" : "percentage"})</option>
            <option value="percent">Percentage of listing price</option>
            <option value="fixed">Fixed amount per deal</option>
          </select>
        </AField>
        <AField label={(f.commission_deal_type || s.commission_deal_type) === "fixed" ? `Per deal (${sym})` : "Per deal (%)"} error={E("commission_deal_value")}>
          <input type="number" min="0" step="0.01" value={f.commission_deal_value ?? ""} onChange={(e) => set("commission_deal_value", e.target.value)} placeholder={`Default: ${s.commission_deal_value || 0}`} className={ainput} />
        </AField>
      </div>
    </div>
  );
}

function SellerFormModal({ onClose, onSaved }) {
  const [f, setF] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const E = (k) => errors[k];

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/sellers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      setMessage(json.error || "Could not create the seller.");
      scrollToFirstError();
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title="Add seller"
      subtitle="Sellers you add are approved immediately and can list right away."
      onClose={onClose}
      wide
      footer={
        <>
          {message && <span className="mr-auto self-center text-sm text-coral-600">{message}</span>}
          <button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Create seller
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Sign-in account</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <AField label="Name" required error={E("name")} className="sm:col-span-2"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={ainput} /></AField>
            <AField label="Email" error={E("email")} hint="Signs in with email + password"><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={ainput} /></AField>
            <AField label="Phone" error={E("phone")} hint="Or signs in with phone + OTP"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={ainput} /></AField>
            <AField label="Password" required={!!f.email} error={E("password")} hint="At least 6 characters. Share it with the seller." className="sm:col-span-2">
              <input type="text" value={f.password} onChange={(e) => set("password", e.target.value)} className={ainput} autoComplete="new-password" />
            </AField>
          </div>
          <p className="mt-2 text-xs text-navy-800/45">If someone already has an account with this email or phone, they&apos;re turned into an approved seller instead.</p>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Business details</h3>
          <ProfileFields f={f} set={set} E={E} />
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Commission for this seller</h3>
          <CommissionFields f={f} set={set} E={E} />
        </section>
        <AField label="Internal notes" hint="Only admins see this."><textarea rows={2} value={f.admin_notes} onChange={(e) => set("admin_notes", e.target.value)} className={ainput} /></AField>
      </div>
    </Modal>
  );
}

// ---------- Seller detail drawer ----------

function SellerDetail({ id, onClose, onChanged }) {
  const money = useMoney();
  const { confirm, alert, dialog } = useDialog();
  const [data, setData] = useState(null);
  const [f, setF] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/sellers/${id}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) return alert({ title: "Could not load seller", message: json.error });
    setData(json);
    const a = json.account;
    setF({
      ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, a[k] == null ? "" : /^\d+\.\d+$/.test(String(a[k])) ? String(Number(a[k])) : a[k]])),
      seller_type: a.seller_type || "owner",
    });
  }, [id, alert]);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); setSaved(false); };
  const E = (k) => errors[k];

  async function act(action, extra = {}) {
    setBusy(action);
    const res = await fetch(`/api/admin/sellers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) {
      if (json.fieldErrors) { setErrors(json.fieldErrors); scrollToFirstError(); }
      else alert({ title: "Action failed", message: json.error });
      return false;
    }
    await load();
    onChanged();
    return true;
  }

  if (!data || !f) {
    return (
      <Modal title="Seller" onClose={onClose}>
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-navy-800/50"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        {dialog}
      </Modal>
    );
  }

  const a = data.account;
  const status = a.seller_status;

  return (
    <Modal
      title={a.name}
      subtitle={<span className="flex flex-wrap items-center gap-2"><Badge meta={SELLER_STATUS[status]} /> {a.email || a.phone} {a.seller_created_by_admin ? <span className="text-xs">· added by admin</span> : null}</span>}
      onClose={onClose}
      wide
      footer={
        <>
          {saved && <span className="mr-auto self-center text-sm text-teal-600">Saved.</span>}
          <button onClick={async () => { if (await act("update", f)) setSaved(true); }} disabled={!!busy} className="btn-primary px-5 py-2.5">
            {busy === "update" ? <Loader2 size={15} className="animate-spin" /> : null} Save details
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Approval actions */}
        <section className={`rounded-xl2 p-4 ${status === "pending" ? "bg-amber-500/10 ring-1 ring-amber-500/25" : "bg-sand-50 ring-1 ring-navy-900/8"}`}>
          {status === "pending" && (
            <p className="mb-3 text-sm text-amber-800">
              Applied {formatDay(a.applied_at)}. Check the details and ID proof below, then approve or reject.
            </p>
          )}
          {status === "rejected" && a.seller_rejection_reason && <p className="mb-3 text-sm text-coral-600">Rejected: {a.seller_rejection_reason}</p>}
          <div className="flex flex-wrap gap-2">
            {(status === "pending" || status === "rejected") && (
              <button onClick={() => act("approve")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">
                <CheckCircle2 size={15} /> Approve seller
              </button>
            )}
            {status === "pending" && (
              <button onClick={() => setRejecting((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-coral-500/40 bg-white px-4 py-2 text-sm font-semibold text-coral-600 hover:bg-coral-500/5">
                <XCircle size={15} /> Reject
              </button>
            )}
            {status === "approved" && (
              <button
                onClick={async () => {
                  const ok = await confirm({ title: `Suspend ${a.name}?`, message: "They won't be able to add or edit listings. Their published listings will be moved to draft so buyers can't see them.", confirmLabel: "Suspend" });
                  if (ok) act("suspend", { hideListings: true });
                }}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-4 py-2 text-sm font-semibold text-navy-800 hover:border-coral-500 hover:text-coral-600"
              >
                <PauseCircle size={15} /> Suspend
              </button>
            )}
            {status === "suspended" && (
              <button onClick={() => act("reactivate")} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">
                <PlayCircle size={15} /> Reactivate
              </button>
            )}
            <Link href={`/admin/commissions?seller=${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-4 py-2 text-sm font-semibold text-navy-800 hover:border-teal-500 hover:text-teal-600">
              <Wallet size={15} /> Charges
            </Link>
          </div>
          {rejecting && (
            <div className="mt-3 space-y-2">
              <AField label="Reason (the seller sees this)" required error={E("reason")}>
                <textarea rows={2} value={reason} onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })); }} placeholder="e.g. The ID proof is unreadable. Please upload a clear photo." className={ainput} />
              </AField>
              <button onClick={async () => { if (await act("reject", { reason })) setRejecting(false); }} disabled={!!busy} className="rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Reject application
              </button>
            </div>
          )}
        </section>

        {/* At a glance */}
        <section className="grid gap-3 sm:grid-cols-4">
          {[
            { l: "Listings", v: data.listings.length },
            { l: "Due", v: money(data.summary.unpaid.total), warn: data.summary.unpaid.total > 0 },
            { l: "To verify", v: money(data.summary.submitted.total) },
            { l: "Paid", v: money(data.summary.paid.total) },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-white p-3 ring-1 ring-navy-900/8">
              <div className="text-[11px] uppercase tracking-wide text-navy-800/45">{x.l}</div>
              <div className={`font-display text-lg ${x.warn ? "text-coral-600" : "text-navy-900"}`}>{x.v}</div>
            </div>
          ))}
        </section>

        {/* KYC */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900"><ShieldCheck size={15} className="text-teal-600" /> Verification documents</h3>
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand-50 p-3 text-sm ring-1 ring-navy-900/8">
            {a.id_proof_url ? (
              <a href={a.id_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-teal-600 hover:underline">
                <FileText size={15} /> View ID proof <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-navy-800/50">No ID proof uploaded</span>
            )}
            {a.about && <p className="w-full text-navy-800/65">{a.about}</p>}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Business details</h3>
          <ProfileFields f={f} set={set} E={E} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Commission for this seller</h3>
          <CommissionFields f={f} set={set} E={E} />
          <div className="mt-3 rounded-xl bg-teal-500/5 p-3 text-xs text-navy-800/65 ring-1 ring-teal-500/15">
            Currently charging: visit {money(data.rates.visit)} · lead {money(data.rates.lead)} · deal{" "}
            {data.rates.dealType === "fixed" ? money(data.rates.dealValue) : `${data.rates.dealValue}%`}
            {!data.rates.enabled && " · automatic charges are switched off in Site Settings"}
          </div>
        </section>

        <AField label="Internal notes" hint="Only admins see this."><textarea rows={2} value={f.admin_notes} onChange={(e) => set("admin_notes", e.target.value)} className={ainput} /></AField>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Store size={15} className="text-teal-600" /> Listings</h3>
          {data.listings.length === 0 ? (
            <p className="text-sm text-navy-800/50">No listings yet.</p>
          ) : (
            <ul className="divide-y divide-navy-900/5 rounded-xl ring-1 ring-navy-900/8">
              {data.listings.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <Link href={`/properties/${p.slug}`} target="_blank" className="min-w-0 truncate font-medium text-navy-900 hover:text-teal-600">{p.title}</Link>
                  <span className="shrink-0 text-xs text-navy-800/50">
                    {p.carpet_area_sqm ? `${Number(p.carpet_area_sqm)} m² carpet · ` : ""}{String(p.status).replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {dialog}
    </Modal>
  );
}
