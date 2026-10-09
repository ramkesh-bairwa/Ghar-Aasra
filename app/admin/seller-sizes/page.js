"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Inbox, Loader2, PencilRuler, Ruler, Search, Plus, ExternalLink, Store } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import { CardSkeletonList } from "@/components/admin/AdminSkeleton";
import { AField, ainput, Modal, formatDay } from "@/components/admin/sellerAdminUI";

export default function AdminSellerSizesPage() {
  return (
    <AdminGate>
      <SellerSizes />
    </AdminGate>
  );
}

const area = (v) => (v == null || v === "" ? "—" : `${Number(v)} m²`);

// Sizes sellers entered themselves, grouped seller by seller: custom floor
// plan sizes (not from Floor Plans & Sizes) and each listing's own areas.
function SellerSizes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("custom");
  const [q, setQ] = useState("");
  const [promoting, setPromoting] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seller-sizes", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load seller sizes.");
      setData(json);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const list = (view === "custom" ? data?.plans : data?.listings) || [];
    const term = q.trim().toLowerCase();
    const filtered = term
      ? list.filter((r) => [r.seller_name, r.business_name, r.property_title, r.label].some((x) => String(x || "").toLowerCase().includes(term)))
      : list;
    const map = new Map();
    for (const r of filtered) {
      if (!map.has(r.seller_id)) map.set(r.seller_id, { seller: r, rows: [] });
      map.get(r.seller_id).rows.push(r);
    }
    return [...map.values()];
  }, [data, view, q]);

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-navy-900">Seller-added Sizes</h1>
        <p className="mt-1 text-sm text-navy-800/55">
          Carpet, built-up and super built-up areas that sellers entered themselves, grouped by seller. Add a good one to your standard list so other sellers can pick it.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-white p-1 shadow-soft ring-1 ring-navy-900/5">
          {[
            { k: "custom", l: "Custom floor plan sizes", n: data?.plans.length },
            { k: "listings", l: "Listing areas", n: data?.listings.length },
          ].map((t) => (
            <button key={t.k} onClick={() => setView(t.k)} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium ${view === t.k ? "bg-navy-900 text-white" : "text-navy-800/60 hover:text-navy-900"}`}>
              {t.l} {t.n > 0 && <span className={`rounded-full px-1.5 text-[11px] ${view === t.k ? "bg-white/20" : "bg-navy-900/8"}`}>{t.n}</span>}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search seller or listing" className={`${ainput} pl-9`} />
        </div>
      </div>

      {error && <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700"><AlertCircle size={16} /> {error}</div>}

      <div className="mt-4 space-y-4">
        {!data && !error ? (
          <CardSkeletonList count={3} height="h-40" />
        ) : groups.length === 0 ? (
          <div className="card-surface px-6 py-14 text-center text-sm text-navy-800/45">
            <Inbox size={22} className="mx-auto mb-2 text-navy-800/20" />
            {view === "custom" ? "No seller has entered a custom floor plan size yet." : "No seller listings with areas yet."}
          </div>
        ) : (
          groups.map(({ seller, rows }) => (
            <section key={seller.seller_id} className="card-surface overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-900/8 bg-sand-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-teal-600" />
                  <span className="font-semibold text-navy-900">{seller.seller_name}</span>
                  <span className="text-xs text-navy-800/50">{[seller.business_name, seller.seller_email].filter(Boolean).join(" · ")}</span>
                </div>
                <span className="text-xs text-navy-800/50">{rows.length} {view === "custom" ? (rows.length === 1 ? "size" : "sizes") : rows.length === 1 ? "listing" : "listings"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-navy-800/40">
                      <th className="px-4 py-2 font-medium">Listing</th>
                      <th className="px-4 py-2 font-medium">{view === "custom" ? "Layout" : "Type"}</th>
                      <th className="px-4 py-2 font-medium">Carpet</th>
                      <th className="px-4 py-2 font-medium">Built-up</th>
                      <th className="px-4 py-2 font-medium">{view === "custom" ? "Super built-up" : "Plot"}</th>
                      <th className="px-4 py-2 font-medium">Added</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={view === "custom" ? r.id : r.property_id} className="border-t border-navy-900/5">
                        <td className="px-4 py-2.5">
                          <Link href={`/properties/${r.property_slug}`} target="_blank" className="inline-flex items-center gap-1 font-medium text-navy-900 hover:text-teal-600">
                            <span className="max-w-[220px] truncate">{r.property_title}</span> <ExternalLink size={11} className="shrink-0 opacity-50" />
                          </Link>
                          <div className="text-[11px] capitalize text-navy-800/45">{String(r.property_status || "").replace(/_/g, " ")}</div>
                        </td>
                        <td className="px-4 py-2.5 text-navy-800/75">
                          {view === "custom" ? (
                            <>
                              <span className="inline-flex items-center gap-1 font-medium text-navy-900"><PencilRuler size={13} className="text-amber-600" /> {r.label}</span>
                              <div className="text-[11px] text-navy-800/45">{r.type_name ? `Type: ${r.type_name}` : "Custom layout"}{r.bedrooms != null ? ` · ${r.bedrooms} bed` : ""}</div>
                            </>
                          ) : (
                            <span className="capitalize">{[r.bhk, r.property_type].filter(Boolean).join(" · ") || "—"}{r.plan_count > 0 ? <span className="block text-[11px] normal-case text-navy-800/45">{r.plan_count} floor plans</span> : null}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-navy-900">{area(r.carpet_area_sqm)}</td>
                        <td className="px-4 py-2.5 text-navy-800/75">{area(r.built_up_area_sqm)}</td>
                        <td className="px-4 py-2.5 text-navy-800/75">{area(view === "custom" ? r.super_area_sqm : r.area_sqm)}</td>
                        <td className="px-4 py-2.5 text-navy-800/55">{formatDay(r.created_at)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {view === "custom" && Number(r.carpet_area_sqm) > 0 && (
                            <button onClick={() => setPromoting(r)} className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-500/20">
                              <Plus size={12} /> Add to standard sizes
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>

      {promoting && <PromoteModal plan={promoting} types={data?.types || []} onClose={() => setPromoting(null)} onDone={() => { setPromoting(null); load(); }} />}
    </div>
  );
}

function PromoteModal({ plan, types, onClose, onDone }) {
  const guess = types.find((t) => String(plan.label || "").toLowerCase().includes(t.name.toLowerCase()));
  const [typeId, setTypeId] = useState(plan.floor_plan_type_id || guess?.id || "");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/seller-sizes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id, typeId, label }) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(json.fieldErrors?.typeId || json.error);
    onDone();
  }

  return (
    <Modal
      title="Add to standard sizes"
      subtitle={`${plan.label} · ${area(plan.carpet_area_sqm)} carpet, from ${plan.seller_name}`}
      onClose={onClose}
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">{saving && <Loader2 size={15} className="animate-spin" />} Add size</button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-sand-50 p-3 text-center text-sm ring-1 ring-navy-900/8">
          {[["Carpet", plan.carpet_area_sqm], ["Built-up", plan.built_up_area_sqm], ["Super", plan.super_area_sqm]].map(([l, v]) => (
            <div key={l}><div className="text-[11px] uppercase text-navy-800/45">{l}</div><div className="font-semibold text-navy-900"><Ruler size={12} className="mr-1 inline text-teal-600" />{area(v)}</div></div>
          ))}
        </div>
        <AField label="Floor plan type" required error={error}>
          <select value={typeId} onChange={(e) => { setTypeId(e.target.value); setError(""); }} className={ainput}>
            <option value="">Choose a type…</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </AField>
        <AField label="Size label" hint='Optional, e.g. "Apartment" or "Corner unit".'>
          <input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} className={ainput} />
        </AField>
        <p className="text-xs text-navy-800/50">
          Manage the full list under <Link href="/admin/floor-plans" className="font-semibold text-teal-600 hover:underline">Floor Plans & Sizes</Link>.
        </p>
      </div>
    </Modal>
  );
}
