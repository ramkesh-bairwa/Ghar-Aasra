"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, AlertCircle, Inbox, CheckCircle2, Loader2, Wallet, Clock, Ban, RotateCcw, Trash2, ExternalLink, Settings } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import { TableSkeletonRows } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";
import {
  AField, ainput, Modal, Badge, CHARGE_STATUS, CHARGE_TYPE_LABELS, PAYMENT_METHOD_LABELS, useMoney, formatDay, scrollToFirstError,
} from "@/components/admin/sellerAdminUI";

export default function AdminCommissionsPage() {
  return (
    <AdminGate>
      <CommissionsManager />
    </AdminGate>
  );
}

function CommissionsManager() {
  const money = useMoney();
  const { confirm, alert, dialog } = useDialog();
  const [filters, setFilters] = useState({ status: "", type: "", seller: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState(null);
  const [editing, setEditing] = useState(null);

  // ?seller=<id> (from the Sellers screen) pre-filters to one seller.
  useEffect(() => {
    const seller = new URLSearchParams(window.location.search).get("seller");
    if (seller) setFilters((f) => ({ ...f, seller }));
  }, []);

  const load = useCallback(async () => {
    setError("");
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    try {
      const res = await fetch(`/api/admin/commissions${qs ? `?${qs}` : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load commissions.");
      setData(json);
    } catch (err) {
      setError(err.message);
      setData({ rows: [], totals: {}, sellers: [] });
    }
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  async function act(row, action, extra = {}) {
    const res = await fetch(`/api/admin/commissions/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { alert({ title: "Action failed", message: json.error }); return false; }
    load();
    return true;
  }

  async function remove(row) {
    if (!(await confirm({ title: "Delete this charge?", message: `${row.description} · ${money(row.amount)}. This can't be undone.`, confirmLabel: "Delete" }))) return;
    const res = await fetch(`/api/admin/commissions/${row.id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const t = data?.totals || {};
  const tile = (k) => t[k] || { count: 0, total: 0 };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Seller Commissions</h1>
          <p className="mt-1 text-sm text-navy-800/55">
            Charges are added automatically for completed visits, leads and deals. Verify payments sellers submit, or record payments yourself.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/settings" className="btn-outline px-4 py-2.5"><Settings size={15} /> Rates</Link>
          <button onClick={() => setAdding(true)} className="btn-primary"><Plus size={16} /> Add charge</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "unpaid", l: "Outstanding", I: Wallet, cls: "text-coral-600 bg-coral-500/10" },
          { k: "submitted", l: "Waiting for you to verify", I: Clock, cls: "text-amber-700 bg-amber-500/15" },
          { k: "paid", l: "Collected", I: CheckCircle2, cls: "text-teal-600 bg-teal-500/10" },
          { k: "waived", l: "Waived", I: Ban, cls: "text-navy-800/60 bg-navy-900/8" },
        ].map(({ k, l, I, cls }) => (
          <button
            key={k}
            onClick={() => setFilters((f) => ({ ...f, status: f.status === k ? "" : k }))}
            className={`card-surface flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-card ${filters.status === k ? "ring-2 ring-teal-500" : ""}`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}><I size={18} /></span>
            <div>
              <div className="text-xs text-navy-800/55">{l}</div>
              <div className="font-display text-xl text-navy-900">{money(tile(k).total)}</div>
              <div className="text-[11px] text-navy-800/45">{tile(k).count} {tile(k).count === 1 ? "charge" : "charges"}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={filters.seller} onChange={(e) => setFilters((f) => ({ ...f, seller: e.target.value }))} className={`${ainput} w-auto min-w-[200px]`}>
          <option value="">All sellers</option>
          {(data?.sellers || []).map((s) => <option key={s.id} value={s.id}>{s.name}{s.business_name ? ` · ${s.business_name}` : ""}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className={`${ainput} w-auto`}>
          <option value="">All types</option>
          {Object.entries(CHARGE_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className={`${ainput} w-auto`}>
          <option value="">All statuses</option>
          {Object.entries(CHARGE_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>

      {error && <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700"><AlertCircle size={16} /> {error}</div>}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/8 bg-sand-50 text-xs uppercase tracking-wide text-navy-800/40">
              <th className="px-4 py-3 font-medium">Charge</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <TableSkeletonRows cols={6} />
            ) : data.rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-navy-800/40"><Inbox size={22} className="mx-auto mb-2 text-navy-800/20" />No charges match these filters.</td></tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r.id} className={`border-b border-navy-900/5 last:border-0 ${r.status === "submitted" ? "bg-amber-500/[0.04]" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{r.description}</div>
                    <div className="text-xs text-navy-800/50">
                      {CHARGE_TYPE_LABELS[r.charge_type]} · {formatDay(r.created_at)}
                      {r.deal_value > 0 && ` · deal value ${money(r.deal_value)}`}
                      {r.source_type ? " · automatic" : " · added by admin"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-navy-900">{r.seller_name}</div>
                    <div className="text-xs text-navy-800/50">{r.business_name || r.seller_email || r.seller_phone}</div>
                  </td>
                  <td className="px-4 py-3 font-display text-base text-navy-900">{money(r.amount)}</td>
                  <td className="px-4 py-3"><Badge meta={CHARGE_STATUS[r.status]} /></td>
                  <td className="px-4 py-3 text-xs text-navy-800/65">
                    {r.payment_reference ? (
                      <>
                        <div className="font-semibold text-navy-900">{PAYMENT_METHOD_LABELS[r.payment_method] || r.payment_method} · {r.payment_reference}</div>
                        <div>{r.status === "paid" ? `Paid ${formatDay(r.paid_at)}` : r.submitted_at ? `Submitted ${formatDay(r.submitted_at)}` : ""}</div>
                        {r.payment_proof_url && <a href={r.payment_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:underline">Screenshot <ExternalLink size={11} /></a>}
                        {r.payment_note && <div className="italic">“{r.payment_note}”</div>}
                      </>
                    ) : r.status === "paid" ? `Paid ${formatDay(r.paid_at)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {(r.status === "unpaid" || r.status === "submitted") && (
                        <button onClick={() => setPaying(r)} className="rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600">
                          {r.status === "submitted" ? "Verify & mark paid" : "Mark paid"}
                        </button>
                      )}
                      {r.status === "submitted" && (
                        <button
                          onClick={async () => {
                            if (await confirm({ title: "Payment not found?", message: "The charge goes back to unpaid and the seller is asked to pay again.", confirmLabel: "Send back", tone: "danger" })) {
                              act(r, "reopen", { note: "We couldn't find this payment. Please check the reference and try again." });
                            }
                          }}
                          className="rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:border-coral-500 hover:text-coral-600"
                        >
                          Not received
                        </button>
                      )}
                      {r.status === "unpaid" && (
                        <>
                          <button onClick={() => setEditing(r)} className="rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:border-teal-500 hover:text-teal-600">Edit</button>
                          <button onClick={async () => { if (await confirm({ title: "Waive this charge?", message: "The seller won't have to pay it.", confirmLabel: "Waive", tone: "info" })) act(r, "waive"); }} className="rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:border-teal-500 hover:text-teal-600">Waive</button>
                        </>
                      )}
                      {(r.status === "paid" || r.status === "waived") && (
                        <button onClick={() => act(r, "reopen")} title="Mark unpaid again" className="rounded-full p-1.5 text-navy-800/50 hover:bg-sand-100 hover:text-navy-900"><RotateCcw size={14} /></button>
                      )}
                      {r.status !== "paid" && (
                        <button onClick={() => remove(r)} title="Delete" className="rounded-full p-1.5 text-navy-800/40 hover:bg-coral-500/10 hover:text-coral-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {adding && <AddChargeModal sellers={data?.sellers || []} defaultSeller={filters.seller} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      {paying && <MarkPaidModal charge={paying} money={money} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); load(); }} />}
      {editing && <EditChargeModal charge={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {dialog}
    </div>
  );
}

function useForm(initial) {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  return { f, set, errors, setErrors };
}

function AddChargeModal({ sellers, defaultSeller, onClose, onSaved }) {
  const money = useMoney();
  const { f, set, errors, setErrors } = useForm({ seller_user_id: defaultSeller || "", property_id: "", charge_type: "deal", description: "", deal_value: "", amount: "" });
  const [listings, setListings] = useState([]);
  const [rates, setRates] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!f.seller_user_id) { setListings([]); setRates(null); return; }
    fetch(`/api/admin/sellers/${f.seller_user_id}`).then((r) => r.json()).then((j) => { setListings(j.listings || []); setRates(j.rates || null); }).catch(() => {});
  }, [f.seller_user_id]);

  const preview = useMemo(() => {
    if (f.amount || !rates) return null;
    if (f.charge_type === "deal" && Number(f.deal_value) > 0) {
      return rates.dealType === "fixed" ? rates.dealValue : Math.round(Number(f.deal_value) * rates.dealValue) / 100;
    }
    if (f.charge_type === "visit") return rates.visit || null;
    if (f.charge_type === "lead") return rates.lead || null;
    return null;
  }, [f, rates]);

  async function save() {
    setSaving(true);
    const body = { ...f, amount: f.amount || (preview && f.charge_type !== "deal" ? preview : "") };
    const res = await fetch("/api/admin/commissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setErrors(json.fieldErrors || { amount: json.error }); scrollToFirstError(); return; }
    onSaved();
  }

  return (
    <Modal
      title="Add charge"
      subtitle="Bill a seller for a deal you closed, a visit, a lead, or anything else."
      onClose={onClose}
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">{saving && <Loader2 size={15} className="animate-spin" />} Add charge</button></>}
    >
      <div className="space-y-4">
        <AField label="Seller" required error={errors.seller_user_id}>
          <select value={f.seller_user_id} onChange={(e) => { set("seller_user_id", e.target.value); set("property_id", ""); }} className={ainput}>
            <option value="">Choose a seller…</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.business_name ? ` · ${s.business_name}` : ""}</option>)}
          </select>
        </AField>
        <AField label="For" required error={errors.charge_type}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(CHARGE_TYPE_LABELS).map(([k, l]) => (
              <button key={k} type="button" onClick={() => set("charge_type", k)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${f.charge_type === k ? "bg-navy-900 text-white" : "bg-sand-50 text-navy-800 ring-1 ring-navy-900/10"}`}>{l.replace("Per ", "")}</button>
            ))}
          </div>
        </AField>
        <AField label="Listing" error={errors.property_id} hint="Optional">
          <select value={f.property_id} onChange={(e) => set("property_id", e.target.value)} disabled={!f.seller_user_id} className={ainput}>
            <option value="">{f.seller_user_id ? "Not linked to a listing" : "Choose a seller first"}</option>
            {listings.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </AField>
        {f.charge_type === "deal" && (
          <AField label="Deal value" error={errors.deal_value} hint="Final sale price or rent agreed. Used to work out a percentage commission.">
            <input type="number" min="0" value={f.deal_value} onChange={(e) => set("deal_value", e.target.value)} className={ainput} />
          </AField>
        )}
        <AField label="Amount to charge" error={errors.amount} hint={preview ? `Leave blank to charge ${money(preview)} (this seller's rate).` : "Required unless it can be worked out from the seller's rate."}>
          <input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder={preview ? String(preview) : ""} className={ainput} />
        </AField>
        <AField label="Description" hint="Shown to the seller. Leave blank for a standard one.">
          <input value={f.description} maxLength={255} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Deal closed · 3 BHK, Vaishali Nagar" className={ainput} />
        </AField>
      </div>
    </Modal>
  );
}

function MarkPaidModal({ charge, money, onClose, onSaved }) {
  const { f, set, errors, setErrors } = useForm({ method: charge.payment_method || "upi", reference: charge.payment_reference || "", note: "" });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/commissions/${charge.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_paid", ...f }) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setErrors(json.fieldErrors || { method: json.error }); return; }
    onSaved();
  }
  return (
    <Modal
      title={`Mark ${money(charge.amount)} as paid`}
      subtitle={`${charge.seller_name} · ${charge.description}`}
      onClose={onClose}
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">{saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Mark paid</button></>}
    >
      <div className="space-y-4">
        {charge.status === "submitted" && (
          <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800">
            The seller says they paid by {PAYMENT_METHOD_LABELS[charge.payment_method] || charge.payment_method} with reference <b>{charge.payment_reference}</b>. Check it in your bank / UPI app before confirming.
          </p>
        )}
        <AField label="Paid by" required error={errors.method}>
          <select value={f.method} onChange={(e) => set("method", e.target.value)} className={ainput}>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </AField>
        <AField label="Reference" hint="Transaction / UTR / receipt number"><input value={f.reference} onChange={(e) => set("reference", e.target.value)} className={ainput} /></AField>
        <AField label="Note" hint="Optional"><input value={f.note} onChange={(e) => set("note", e.target.value)} className={ainput} /></AField>
      </div>
    </Modal>
  );
}

function EditChargeModal({ charge, onClose, onSaved }) {
  const { f, set, errors, setErrors } = useForm({ amount: String(Number(charge.amount)), description: charge.description });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/commissions/${charge.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", ...f }) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setErrors(json.fieldErrors || { amount: json.error }); return; }
    onSaved();
  }
  return (
    <Modal
      title="Edit charge"
      subtitle={charge.seller_name}
      onClose={onClose}
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">Save</button></>}
    >
      <div className="space-y-4">
        <AField label="Amount" required error={errors.amount}><input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => set("amount", e.target.value)} className={ainput} /></AField>
        <AField label="Description" required error={errors.description}><input value={f.description} maxLength={255} onChange={(e) => set("description", e.target.value)} className={ainput} /></AField>
      </div>
    </Modal>
  );
}
