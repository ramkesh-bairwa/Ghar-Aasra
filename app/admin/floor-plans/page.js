"use client";

import { useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import { CardSkeletonList } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";
import { LayoutPanelTop, Plus, Trash2, Pencil, Check, X, Loader2, Ruler, BedDouble, Bath, AlertCircle } from "lucide-react";

const ic = "w-full rounded-xl border border-navy-900/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30";
const SQFT = 10.7639;
const n = (v) => (v === null || v === undefined || v === "" ? "" : String(Number(v)));
const blankType = { name: "", bedrooms: "", bathrooms: "", balconies: "" };
const blankSize = { label: "", carpet_area_sqm: "", built_up_area_sqm: "", super_area_sqm: "" };

async function api(url, method, body) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export default function FloorPlansAdminPage() {
  return (
    <AdminGate>
      <FloorPlansManager />
    </AdminGate>
  );
}

function FloorPlansManager() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [newType, setNewType] = useState(blankType);

  async function load(selectAfter) {
    try {
      const data = await api("/api/admin/floor-plan-types", "GET");
      setTypes(data.types);
      setSelectedId((cur) => selectAfter ?? (data.types.some((t) => t.id === cur) ? cur : data.types[0]?.id ?? null));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function run(key, fn) {
    setBusy(key);
    setError("");
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(""); }
  }

  const addType = (e) => {
    e.preventDefault();
    run("add-type", async () => {
      const { id } = await api("/api/admin/floor-plan-types", "POST", newType);
      setNewType(blankType);
      await load(id);
    });
  };

  const selected = types.find((t) => t.id === selectedId);

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-navy-900">Floor Plans &amp; Sizes</h1>
        <p className="mt-1 max-w-2xl text-sm text-navy-800/55">
          Set up the unit types you list (1 BHK, 2 BHK…) and the standard sizes for each. When adding a property, you pick a floor plan and a size here and the areas fill in automatically.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px,minmax(0,1fr)]">
        {/* Floor plan types */}
        <div className="card-surface h-fit p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-navy-900">Floor plans</h2>
            <span className="text-xs text-navy-800/45">{types.length}</span>
          </div>

          <form onSubmit={addType} className="mt-3 space-y-2 rounded-xl bg-sand-50 p-3 ring-1 ring-navy-900/5">
            <input value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} placeholder="New floor plan, e.g. 2 BHK" maxLength={60} className={ic} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="0" value={newType.bedrooms} onChange={(e) => setNewType({ ...newType, bedrooms: e.target.value })} placeholder="Beds" className={ic} />
              <input type="number" min="0" value={newType.bathrooms} onChange={(e) => setNewType({ ...newType, bathrooms: e.target.value })} placeholder="Baths" className={ic} />
              <input type="number" min="0" value={newType.balconies} onChange={(e) => setNewType({ ...newType, balconies: e.target.value })} placeholder="Balc." className={ic} />
            </div>
            <button type="submit" disabled={!newType.name.trim() || busy === "add-type"} className="btn-primary w-full justify-center py-2 disabled:opacity-50">
              {busy === "add-type" ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add floor plan
            </button>
          </form>

          <div className="mt-3 space-y-1.5">
            {loading ? (
              <CardSkeletonList count={4} />
            ) : types.length === 0 ? (
              <p className="py-6 text-center text-sm text-navy-800/45">No floor plans yet. Add your first one above.</p>
            ) : (
              types.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${active ? "bg-navy-900 text-white" : "hover:bg-sand-50"}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-teal-500" : "bg-teal-500/10 text-teal-600"}`}>
                      <LayoutPanelTop size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.name}</span>
                      <span className={`block text-xs ${active ? "text-white/60" : "text-navy-800/50"}`}>
                        {[t.bedrooms != null && `${t.bedrooms} bed`, t.bathrooms != null && `${t.bathrooms} bath`].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-white/15" : "bg-navy-900/5 text-navy-800/60"}`}>
                      {t.sizes.length} size{t.sizes.length === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected type + its sizes */}
        {selected ? (
          <TypeDetail key={selected.id} type={selected} busy={busy} run={run} reload={load} />
        ) : (
          !loading && (
            <div className="card-surface flex flex-col items-center justify-center px-6 py-16 text-center text-sm text-navy-800/45">
              <LayoutPanelTop size={26} className="mb-2 text-navy-800/25" />
              Add a floor plan on the left to set up its sizes.
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TypeDetail({ type, busy, run, reload }) {
  const [edit, setEdit] = useState({ name: type.name, bedrooms: n(type.bedrooms), bathrooms: n(type.bathrooms), balconies: n(type.balconies), sort_order: type.sort_order });
  const [newSize, setNewSize] = useState(blankSize);
  const [editingSize, setEditingSize] = useState(null); // { id, ...fields }
  const { confirm: ask, dialog } = useDialog();
  const dirty = edit.name !== type.name || edit.bedrooms !== n(type.bedrooms) || edit.bathrooms !== n(type.bathrooms) || edit.balconies !== n(type.balconies);

  const saveType = () => run("save-type", async () => { await api(`/api/admin/floor-plan-types/${type.id}`, "PUT", edit); await reload(); });
  const deleteType = async () => {
    const ok = await ask({
      title: `Delete ${type.name}?`,
      message: `This removes the ${type.name} floor plan and its ${type.sizes.length} size${type.sizes.length === 1 ? "" : "s"}. Properties that already use it keep their floor plans.`,
      confirmLabel: "Delete floor plan",
    });
    if (!ok) return;
    run("delete-type", async () => { await api(`/api/admin/floor-plan-types/${type.id}`, "DELETE"); await reload(); });
  };
  const addSize = (e) => {
    e.preventDefault();
    run("add-size", async () => { await api(`/api/admin/floor-plan-types/${type.id}/sizes`, "POST", newSize); setNewSize(blankSize); await reload(); });
  };
  const saveSize = () => run(`size-${editingSize.id}`, async () => { await api(`/api/admin/floor-plan-sizes/${editingSize.id}`, "PUT", editingSize); setEditingSize(null); await reload(); });
  const deleteSize = async (s) => {
    const ok = await ask({
      title: "Delete this size?",
      message: `${[s.label, `${s.carpet_area_sqm} m² carpet`].filter(Boolean).join(" · ")} will be removed from ${type.name}. Properties that already use it keep their areas.`,
      confirmLabel: "Delete size",
    });
    if (!ok) return;
    run(`size-${s.id}`, async () => { await api(`/api/admin/floor-plan-sizes/${s.id}`, "DELETE"); await reload(); });
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-navy-900">{type.name}</h2>
          <button type="button" onClick={deleteType} disabled={busy === "delete-type"} className="flex items-center gap-1.5 text-sm font-semibold text-coral-600 hover:opacity-80">
            {busy === "delete-type" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete floor plan
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr,1fr,1fr,auto] sm:items-end">
          <label className="block"><span className="mb-1 block text-xs font-medium text-navy-800/60">Name</span><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} maxLength={60} className={ic} /></label>
          <label className="block"><span className="mb-1 flex items-center gap-1 text-xs font-medium text-navy-800/60"><BedDouble size={12} /> Bedrooms</span><input type="number" min="0" value={edit.bedrooms} onChange={(e) => setEdit({ ...edit, bedrooms: e.target.value })} className={ic} /></label>
          <label className="block"><span className="mb-1 flex items-center gap-1 text-xs font-medium text-navy-800/60"><Bath size={12} /> Bathrooms</span><input type="number" min="0" value={edit.bathrooms} onChange={(e) => setEdit({ ...edit, bathrooms: e.target.value })} className={ic} /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-navy-800/60">Balconies</span><input type="number" min="0" value={edit.balconies} onChange={(e) => setEdit({ ...edit, balconies: e.target.value })} className={ic} /></label>
          <button type="button" onClick={saveType} disabled={!dirty || !edit.name.trim() || busy === "save-type"} className="btn-primary justify-center py-2 disabled:opacity-40">
            {busy === "save-type" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save
          </button>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center gap-2 border-b border-navy-900/8 px-5 py-4">
          <Ruler size={16} className="text-teal-600" />
          <h3 className="font-display text-base text-navy-900">Sizes for {type.name}</h3>
          <span className="text-xs text-navy-800/45">· smallest first</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sand-50 text-xs uppercase tracking-wide text-navy-800/45">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Carpet (m²)</th>
                <th className="px-4 py-3 font-medium">Built-up (m²)</th>
                <th className="px-4 py-3 font-medium">Super built-up (m²)</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {type.sizes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-800/45">No sizes yet. Add one below.</td></tr>
              )}
              {type.sizes.map((s) =>
                editingSize?.id === s.id ? (
                  <tr key={s.id} className="border-t border-navy-900/5 bg-teal-500/5">
                    <td className="px-3 py-2"><input value={editingSize.label} onChange={(e) => setEditingSize({ ...editingSize, label: e.target.value })} className={ic} /></td>
                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" value={editingSize.carpet_area_sqm} onChange={(e) => setEditingSize({ ...editingSize, carpet_area_sqm: e.target.value })} className={ic} /></td>
                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" value={editingSize.built_up_area_sqm} onChange={(e) => setEditingSize({ ...editingSize, built_up_area_sqm: e.target.value })} className={ic} /></td>
                    <td className="px-3 py-2"><input type="number" min="0" step="0.01" value={editingSize.super_area_sqm} onChange={(e) => setEditingSize({ ...editingSize, super_area_sqm: e.target.value })} className={ic} /></td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={saveSize} disabled={busy === `size-${s.id}`} title="Save" className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white hover:bg-teal-600">
                          {busy === `size-${s.id}` ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        </button>
                        <button type="button" onClick={() => setEditingSize(null)} title="Cancel" className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-900/10 text-navy-800/60 hover:bg-white"><X size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className="border-t border-navy-900/5 hover:bg-sand-50">
                    <td className="px-4 py-3 font-medium text-navy-900">{s.label || <span className="text-navy-800/40">—</span>}</td>
                    <td className="px-4 py-3 text-navy-800/80">{s.carpet_area_sqm} <span className="text-xs text-navy-800/45">· {Math.round(s.carpet_area_sqm * SQFT)} sq ft</span></td>
                    <td className="px-4 py-3 text-navy-800/80">{s.built_up_area_sqm ?? "—"}</td>
                    <td className="px-4 py-3 text-navy-800/80">{s.super_area_sqm ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" title="Edit" onClick={() => setEditingSize({ id: s.id, label: s.label || "", carpet_area_sqm: n(s.carpet_area_sqm), built_up_area_sqm: n(s.built_up_area_sqm), super_area_sqm: n(s.super_area_sqm) })}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4db6c8] text-white hover:opacity-90"><Pencil size={14} /></button>
                        <button type="button" title="Delete" onClick={() => deleteSize(s)} disabled={busy === `size-${s.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-coral-500 text-white hover:opacity-90"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={addSize} className="grid gap-2 border-t border-navy-900/8 bg-sand-50 p-4 sm:grid-cols-[1.3fr,1fr,1fr,1fr,auto] sm:items-center">
          <input value={newSize.label} onChange={(e) => setNewSize({ ...newSize, label: e.target.value })} placeholder="Label, e.g. Type A / Apartment" maxLength={60} className={ic} />
          <input type="number" min="0" step="0.01" value={newSize.carpet_area_sqm} onChange={(e) => setNewSize({ ...newSize, carpet_area_sqm: e.target.value })} placeholder="Carpet m² *" className={ic} />
          <input type="number" min="0" step="0.01" value={newSize.built_up_area_sqm} onChange={(e) => setNewSize({ ...newSize, built_up_area_sqm: e.target.value })} placeholder="Built-up m²" className={ic} />
          <input type="number" min="0" step="0.01" value={newSize.super_area_sqm} onChange={(e) => setNewSize({ ...newSize, super_area_sqm: e.target.value })} placeholder="Super m²" className={ic} />
          <button type="submit" disabled={!newSize.carpet_area_sqm || busy === "add-size"} className="btn-primary justify-center py-2 disabled:opacity-50">
            {busy === "add-size" ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add size
          </button>
        </form>
      </div>
      {dialog}
    </div>
  );
}
