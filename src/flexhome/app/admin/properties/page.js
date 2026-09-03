"use client";

import AdminGate from "@/components/admin/AdminGate";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, AlertCircle, Star, Home, Eye, Search, X,
  ChevronDown, ChevronUp, Copy, Globe, EyeOff, ShieldCheck,
} from "lucide-react";

const STATUS_STYLES = {
  draft:       "bg-navy-900/8 text-navy-800/60",
  published:   "bg-teal-500/15 text-teal-700",
  under_offer: "bg-amber-500/15 text-amber-700",
  sold:        "bg-coral-500/15 text-coral-700",
  rented:      "bg-coral-500/15 text-coral-700",
};

const INIT = {
  search: "", listing: "", type: "", status: "", featured: "",
  bedrooms: "", bathrooms: "", priceMin: "", priceMax: "",
  carpetMin: "", carpetMax: "", pricePeriod: "",
};

export default function AdminPropertiesPage() {
  return <AdminGate><PropertiesList /></AdminGate>;
}

function PropertiesList() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [f, setF] = useState(INIT);
  const [showMore, setShowMore] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function upd(key, val) { setF((p) => ({ ...p, [key]: val })); }
  function clear() { setF(INIT); }

  async function load() {
    setLoading(true); setError("");
    const res = await fetch("/api/admin/properties");
    const data = await res.json();
    if (res.ok) setRows(data.rows);
    else setError(data.error || "Could not load properties.");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    const res = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    if (res.ok) load();
    else alert("Delete failed.");
  }

  async function handleDuplicate(e, id) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    const data = await res.json();
    if (res.ok) { load(); router.push(`/admin/properties/${data.id}`); }
    else alert("Duplicate failed.");
  }

  async function handleTogglePublish(e, row) {
    e.stopPropagation();
    const newStatus = row.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/properties/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "publish", status: newStatus }),
    });
    if (res.ok) load();
    else alert("Status update failed.");
  }

  async function handleToggleApprove(e, row) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/properties/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "approve", approved: !row.approved }),
    });
    if (res.ok) load();
    else alert("Approval update failed.");
  }

  const filtered = rows.filter((r) => {
    const s = f.search.toLowerCase();
    if (s && !r.title?.toLowerCase().includes(s) && !r.address?.toLowerCase().includes(s) && !r.slug?.toLowerCase().includes(s)) return false;
    if (f.listing && r.listing_type !== f.listing) return false;
    if (f.type && r.property_type !== f.type) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.featured !== "" && String(r.featured ?? "") !== f.featured) return false;
    if (f.bedrooms && Number(r.bedrooms) !== Number(f.bedrooms)) return false;
    if (f.bathrooms && Number(r.bathrooms) !== Number(f.bathrooms)) return false;
    if (f.priceMin && Number(r.price) < Number(f.priceMin)) return false;
    if (f.priceMax && Number(r.price) > Number(f.priceMax)) return false;
    if (f.carpetMin && Number(r.carpet_area_sqm) < Number(f.carpetMin)) return false;
    if (f.carpetMax && Number(r.carpet_area_sqm) > Number(f.carpetMax)) return false;
    if (f.pricePeriod && r.price_period !== f.pricePeriod) return false;
    return true;
  });

  const anyFilter = Object.values(f).some((v) => v !== "");
  const activeCount = Object.values(f).filter((v) => v !== "").length;

  const inputCls = "h-9 rounded-xl border border-navy-900/10 bg-white px-3 text-sm text-navy-800 placeholder:text-navy-800/35 focus:outline-none focus:ring-2 focus:ring-teal-500/30";
  const selectCls = "h-9 rounded-xl border border-navy-900/10 bg-white px-3 text-sm text-navy-800 capitalize focus:outline-none focus:ring-2 focus:ring-teal-500/30";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Properties</h1>
          <p className="mt-1 text-sm text-navy-800/55">{rows.length} {rows.length === 1 ? "listing" : "listings"}</p>
        </div>
        <button onClick={() => router.push("/admin/properties/new")} className="btn-primary">
          <Plus size={16} /> Add property
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-xs text-coral-700/70">Set DB_HOST / DB_USER / DB_PASSWORD in .env and run <code>npm run db:init</code>.</p>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="mt-4 rounded-xl border border-navy-900/10 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/35 pointer-events-none" />
            <input type="text" placeholder="Search title / address / slug" value={f.search}
              onChange={(e) => upd("search", e.target.value)} className={`${inputCls} pl-8 w-56`} />
          </div>
          <select value={f.listing} onChange={(e) => upd("listing", e.target.value)} className={selectCls}>
            <option value="">Listing: All</option>
            {["sale","rent","lease","commercial"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={f.type} onChange={(e) => upd("type", e.target.value)} className={selectCls}>
            <option value="">Type: All</option>
            {["apartment","villa","house","land","commercial","office","penthouse","mansion"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={f.status} onChange={(e) => upd("status", e.target.value)} className={selectCls}>
            <option value="">Status: All</option>
            {["draft","published","under_offer","sold","rented"].map((o) => <option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
          </select>
          <select value={f.featured} onChange={(e) => upd("featured", e.target.value)} className={selectCls}>
            <option value="">Featured: All</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
          <button onClick={() => setShowMore((v) => !v)}
            className="flex h-9 items-center gap-1 rounded-xl border border-navy-900/10 bg-white px-3 text-sm text-navy-800/60 hover:text-navy-900 transition-colors">
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showMore ? "Less" : "More filters"}
            {activeCount > 0 && <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">{activeCount}</span>}
          </button>
          {anyFilter && (
            <button onClick={clear} className="flex h-9 items-center gap-1.5 rounded-xl border border-navy-900/10 bg-white px-3 text-sm text-navy-800/50 hover:text-coral-600 transition-colors">
              <X size={13} /> Clear all
            </button>
          )}
          <span className="ml-auto text-xs text-navy-800/40">{filtered.length} of {rows.length}</span>
        </div>

        {showMore && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-navy-900/6 pt-3">
            <select value={f.bedrooms} onChange={(e) => upd("bedrooms", e.target.value)} className={selectCls}>
              <option value="">Bedrooms: Any</option>
              {["1","2","3","4","5","6"].map((o) => <option key={o} value={o}>{o} bed{o!=="1"?"s":""}</option>)}
            </select>
            <select value={f.bathrooms} onChange={(e) => upd("bathrooms", e.target.value)} className={selectCls}>
              <option value="">Bathrooms: Any</option>
              {["1","2","3","4","5"].map((o) => <option key={o} value={o}>{o} bath{o!=="1"?"s":""}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <input type="number" placeholder="Price min" value={f.priceMin} onChange={(e) => upd("priceMin", e.target.value)} className={`${inputCls} w-28`} />
              <span className="text-xs text-navy-800/40">–</span>
              <input type="number" placeholder="Price max" value={f.priceMax} onChange={(e) => upd("priceMax", e.target.value)} className={`${inputCls} w-28`} />
            </div>
            <select value={f.pricePeriod} onChange={(e) => upd("pricePeriod", e.target.value)} className={selectCls}>
              <option value="">Price period: All</option>
              {["one_time","monthly","yearly"].map((o) => <option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <input type="number" placeholder="Carpet min m²" value={f.carpetMin} onChange={(e) => upd("carpetMin", e.target.value)} className={`${inputCls} w-32`} />
              <span className="text-xs text-navy-800/40">–</span>
              <input type="number" placeholder="Carpet max m²" value={f.carpetMax} onChange={(e) => upd("carpetMax", e.target.value)} className={`${inputCls} w-32`} />
            </div>
          </div>
        )}
      </div>

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-900/8 text-xs uppercase tracking-wide text-navy-800/40 bg-sand-50">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Beds/Baths</th>
              <th className="px-4 py-3 font-medium">Carpet m²</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-navy-800/40" colSpan={8}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-10 text-center text-navy-800/40" colSpan={8}>No properties yet — add your first one.</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-10 text-center text-navy-800/40" colSpan={8}>No properties match your filters.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-navy-900/5 last:border-0 hover:bg-sand-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.cover_image_url ? (
                        <img src={row.cover_image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-navy-900/10" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-navy-800/30"><Home size={16} /></span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate font-medium text-navy-900">
                          {row.title}
                          {!!row.featured && <Star size={12} className="shrink-0 fill-teal-500 text-teal-500" />}
                        </div>
                        <div className="truncate text-xs text-navy-800/45">{row.property_custom_id ? `#${row.property_custom_id} · ` : ""}{row.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">
                    <span className="capitalize">{row.property_type}</span>
                    <span className="text-navy-800/35"> · </span>
                    <span className="capitalize">{row.listing_type}</span>
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">
                    {row.price ? `₹${Number(row.price).toLocaleString()}` : "—"}
                    {row.price_period && <span className="ml-1 text-xs text-navy-800/40">/{row.price_period.replace("one_time","once").replace("_","")}</span>}
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">{row.bedrooms ?? "—"} / {row.bathrooms ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-800/70">{row.carpet_area_sqm ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-pill ${STATUS_STYLES[row.status] || "bg-navy-900/8 text-navy-800/60"}`}>
                      {String(row.status || "").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {!!row.premium  && <span className="badge-pill bg-amber-500/15 text-amber-700">Premium</span>}
                      {!!row.luxury   && <span className="badge-pill bg-purple-500/15 text-purple-700">Luxury</span>}
                      {!!row.verified && <span className="badge-pill bg-teal-500/15 text-teal-700">Verified</span>}
                      {!!row.approved && <span className="badge-pill bg-green-500/15 text-green-700">Approved</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); window.open(`/properties/${row.slug}`, "_blank"); }} title="View on site"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4db6c8] text-white hover:opacity-90 transition-opacity">
                        <Eye size={15} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/properties/${row.id}`); }} title="Edit"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5cb85c] text-white hover:opacity-90 transition-opacity">
                        <Pencil size={15} />
                      </button>
                      <button onClick={(e) => handleDuplicate(e, row.id)} title="Duplicate"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0ad4e] text-white hover:opacity-90 transition-opacity">
                        <Copy size={15} />
                      </button>
                      <button onClick={(e) => handleTogglePublish(e, row)} title={row.status === "published" ? "Unpublish" : "Publish"}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5bc0de] text-white hover:opacity-90 transition-opacity">
                        {row.status === "published" ? <EyeOff size={15} /> : <Globe size={15} />}
                      </button>
                      <button onClick={(e) => handleToggleApprove(e, row)} title={row.approved ? "Revoke approval" : "Approve"}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-white hover:opacity-90 transition-opacity ${row.approved ? "bg-green-500" : "bg-gray-400"}`}>
                        <ShieldCheck size={15} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} title="Delete"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e05a4e] text-white hover:opacity-90 transition-opacity">
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-xl2 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-navy-900/8 px-6 py-4">
              <h2 className="font-display text-lg text-navy-900">Delete Property</h2>
              <button onClick={() => setDeleteTarget(null)} className="text-navy-800/40 hover:text-navy-900"><X size={18} /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-navy-800/70">
                Are you sure you want to delete <span className="font-medium text-navy-900">{deleteTarget.title}</span>? This cannot be undone.
              </p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget.id)}
                  className="flex-1 rounded-xl bg-[#e05a4e] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
