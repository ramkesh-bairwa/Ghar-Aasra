"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MapPinned, AlertCircle, Loader2, Pencil, Trash2, ExternalLink, Sparkles, Building2 } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import AdminUpload from "@/components/admin/AdminUpload";
import { TableSkeletonRows } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";
import { AField, ainput, Modal, useMoney, scrollToFirstError } from "@/components/admin/sellerAdminUI";

export default function AdminLocalitiesPage() {
  return (
    <AdminGate>
      <LocalitiesManager />
    </AdminGate>
  );
}

function LocalitiesManager() {
  const money = useMoney();
  const { confirm, alert, dialog } = useDialog();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/localities", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    setData(res.ok ? json : { rows: [], suggestions: [], locations: [], error: json.error });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function togglePublish(l) {
    setData((d) => ({ ...d, rows: d.rows.map((x) => (x.id === l.id ? { ...x, is_published: l.is_published ? 0 : 1 } : x)) }));
    await fetch(`/api/admin/localities/${l.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_published: !l.is_published }) });
  }
  async function remove(l) {
    if (!(await confirm({ title: `Delete ${l.name}?`, message: "Its guide page goes away. Listings are not affected.", confirmLabel: "Delete" }))) return;
    await fetch(`/api/admin/localities/${l.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Localities</h1>
          <p className="mt-1 text-sm text-navy-800/55">Neighbourhood guide pages with live average prices, rents and trends. Prices are worked out automatically from listings whose locality matches the name.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/localities" target="_blank" className="btn-outline px-4 py-2.5"><ExternalLink size={15} /> View pages</Link>
          <button onClick={() => setEditing({})} className="btn-primary"><Plus size={16} /> Add locality</button>
        </div>
      </div>

      {data?.suggestions?.length > 0 && (
        <div className="mt-5 rounded-xl2 border border-teal-500/25 bg-teal-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-900"><Sparkles size={15} className="text-teal-600" /> Found in your listings, no guide yet</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.suggestions.map((s) => (
              <button key={`${s.location_id}-${s.name}`} onClick={() => setEditing({ location_id: s.location_id, name: s.name })} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 ring-1 ring-navy-900/10 hover:ring-teal-500">
                <Plus size={12} /> {s.name}, {s.city} <span className="text-navy-800/45">· {s.listings}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {data?.error && <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700"><AlertCircle size={16} /> {data.error}</div>}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/8 bg-sand-50 text-xs uppercase tracking-wide text-navy-800/40">
              <th className="px-4 py-3 font-medium">Locality</th>
              <th className="px-4 py-3 font-medium">Live listings</th>
              <th className="px-4 py-3 font-medium">Avg sale price / m²</th>
              <th className="px-4 py-3 font-medium">Scores</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <TableSkeletonRows cols={6} />
            ) : data.rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-navy-800/40"><MapPinned size={22} className="mx-auto mb-2 text-navy-800/20" />No locality guides yet. Add one, or pick from the suggestions above.</td></tr>
            ) : (
              data.rows.map((l) => (
                <tr key={l.id} className="border-b border-navy-900/5 last:border-0 hover:bg-sand-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {l.cover_image_url ? <img src={l.cover_image_url} alt="" className="h-10 w-14 rounded-md object-cover" /> : <span className="flex h-10 w-14 items-center justify-center rounded-md bg-sand-100 text-navy-800/30"><MapPinned size={16} /></span>}
                      <div>
                        <div className="font-medium text-navy-900">{l.name}</div>
                        <div className="text-xs text-navy-800/50">{l.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-navy-800/75"><Building2 size={13} /> {l.listings}</span>{Number(l.listings) === 0 && <div className="text-[11px] text-amber-700">No listings use this name yet</div>}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{l.avg_sale_rate ? money(Math.round(l.avg_sale_rate)) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-navy-800/60">{[l.connectivity_score && `Connect ${l.connectivity_score}`, l.safety_score && `Safety ${l.safety_score}`, l.lifestyle_score && `Life ${l.lifestyle_score}`].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(l)} role="switch" aria-checked={!!l.is_published} className={`relative h-6 w-11 rounded-full transition-colors ${l.is_published ? "bg-teal-500" : "bg-navy-900/15"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${l.is_published ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/localities/${l.slug}`} target="_blank" title="View page" className="rounded-lg p-2 text-navy-800/50 hover:bg-sand-100 hover:text-navy-900"><ExternalLink size={15} /></Link>
                      <button onClick={() => setEditing(l)} title="Edit" className="rounded-lg p-2 text-navy-800/50 hover:bg-sand-100 hover:text-navy-900"><Pencil size={15} /></button>
                      <button onClick={() => remove(l)} title="Delete" className="rounded-lg p-2 text-navy-800/40 hover:bg-coral-500/10 hover:text-coral-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && <LocalityForm locality={editing} locations={data?.locations || []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} onError={(m) => alert({ title: "Save failed", message: m })} />}
      {dialog}
    </div>
  );
}

function LocalityForm({ locality, locations, onClose, onSaved, onError }) {
  const isNew = !locality.id;
  const [f, setF] = useState({
    location_id: locality.location_id || locations[0]?.id || "", name: locality.name || "", description: locality.description || "",
    cover_image_url: locality.cover_image_url || "", highlights: locality.highlights || "", nearby: locality.nearby || "",
    connectivity_score: locality.connectivity_score ?? "", safety_score: locality.safety_score ?? "", lifestyle_score: locality.lifestyle_score ?? "",
    is_published: locality.is_published === undefined ? true : !!locality.is_published, sort_order: locality.sort_order || 0,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  async function save() {
    setSaving(true);
    const res = await fetch(isNew ? "/api/admin/localities" : `/api/admin/localities/${locality.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { if (json.fieldErrors) { setErrors(json.fieldErrors); scrollToFirstError(); } else onError(json.error); return; }
    onSaved();
  }

  return (
    <Modal
      title={isNew ? "Add locality" : `Edit ${locality.name}`}
      subtitle="Prices on the page come from live listings. You add the story."
      onClose={onClose}
      wide
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">{saving && <Loader2 size={15} className="animate-spin" />} Save</button></>}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <AField label="City" required error={errors.location_id}>
            <select value={f.location_id} onChange={(e) => set("location_id", e.target.value)} className={ainput}>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.city}</option>)}
            </select>
          </AField>
          <AField label="Locality name" required error={errors.name} hint="Spell it the way sellers type it in their listings."><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Vaishali Nagar" className={ainput} /></AField>
        </div>
        <AField label="Cover image" error={errors.cover_image_url}><AdminUpload value={f.cover_image_url} onChange={(v) => set("cover_image_url", v)} hint="1600 × 600 works well" /></AField>
        <AField label="About this locality"><textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What's it like to live here? Who is it good for? How has it grown?" className={ainput} /></AField>
        <div className="grid gap-4 sm:grid-cols-2">
          <AField label="Highlights" hint="One per line"><textarea rows={4} value={f.highlights} onChange={(e) => set("highlights", e.target.value)} placeholder={"Wide roads and parks\nGood schools nearby\nQuiet, family-friendly"} className={ainput} /></AField>
          <AField label="What's nearby" hint="One per line"><textarea rows={4} value={f.nearby} onChange={(e) => set("nearby", e.target.value)} placeholder={"Metro: Mansarovar · 2 km\nHospital: Fortis · 3 km\nMall: Vaishali Nagar Market · 1 km"} className={ainput} /></AField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <AField label="Connectivity (1–10)" error={errors.connectivity_score}><input type="number" min="1" max="10" value={f.connectivity_score} onChange={(e) => set("connectivity_score", e.target.value)} className={ainput} /></AField>
          <AField label="Safety (1–10)" error={errors.safety_score}><input type="number" min="1" max="10" value={f.safety_score} onChange={(e) => set("safety_score", e.target.value)} className={ainput} /></AField>
          <AField label="Lifestyle (1–10)" error={errors.lifestyle_score}><input type="number" min="1" max="10" value={f.lifestyle_score} onChange={(e) => set("lifestyle_score", e.target.value)} className={ainput} /></AField>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900"><input type="checkbox" checked={f.is_published} onChange={(e) => set("is_published", e.target.checked)} className="h-4 w-4 accent-teal-500" /> Published</label>
          <AField label="Order" className="w-32"><input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={ainput} /></AField>
        </div>
      </div>
    </Modal>
  );
}
