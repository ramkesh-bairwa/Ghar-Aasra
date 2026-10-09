"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clapperboard, AlertCircle, Loader2, Eye, Heart, CheckCircle2, XCircle, Star, Trash2, Pencil, ExternalLink, Settings } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import AdminUpload from "@/components/admin/AdminUpload";
import { CardSkeletonList } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";
import { AField, ainput, Modal, formatDay, scrollToFirstError } from "@/components/admin/sellerAdminUI";

export default function AdminReelsPage() {
  return (
    <AdminGate>
      <ReelsManager />
    </AdminGate>
  );
}

const TABS = [
  { key: "pending", label: "Waiting for review" },
  { key: "approved", label: "Live" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

function ReelsManager() {
  const { confirm, alert, dialog } = useDialog();
  const [tab, setTab] = useState("pending");
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/reels${tab ? `?status=${tab}` : ""}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    setData(res.ok ? json : { rows: [], counts: {}, error: json.error });
  }, [tab]);
  useEffect(() => { setData(null); load(); }, [load]);

  // Land on "Live" when nothing is waiting.
  useEffect(() => {
    if (data && tab === "pending" && !data.counts?.pending && data.counts?.approved) setTab("approved");
  }, [data, tab]);

  async function act(r, action, extra = {}) {
    const res = await fetch(`/api/admin/reels/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return json;
    load();
    return null;
  }
  async function remove(r) {
    if (!(await confirm({ title: "Delete this reel?", message: r.title, confirmLabel: "Delete" }))) return;
    await fetch(`/api/admin/reels/${r.id}`, { method: "DELETE" });
    load();
  }

  const c = data?.counts || {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Property Reels</h1>
          <p className="mt-1 text-sm text-navy-800/55">Short vertical video tours on /reels and the homepage. Review seller uploads, feature the best ones, or upload your own.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reels" target="_blank" className="btn-outline px-4 py-2.5"><ExternalLink size={15} /> View feed</Link>
          <button onClick={() => setEditing({})} className="btn-primary"><Plus size={16} /> Upload reel</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { l: "Waiting for review", v: c.pending || 0, I: Clapperboard, warn: c.pending > 0 },
          { l: "Live reels", v: c.approved || 0, I: CheckCircle2 },
          { l: "Total views", v: (c.views || 0).toLocaleString("en-IN"), I: Eye },
          { l: "Total likes", v: (c.likes || 0).toLocaleString("en-IN"), I: Heart },
        ].map(({ l, v, I, warn }) => (
          <div key={l} className={`card-surface flex items-center gap-3 p-4 ${warn ? "ring-2 ring-amber-500/40" : ""}`}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${warn ? "bg-amber-500/15 text-amber-700" : "bg-teal-500/10 text-teal-600"}`}><I size={18} /></span>
            <div><div className="text-xs text-navy-800/55">{l}</div><div className="font-display text-xl text-navy-900">{v}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-soft ring-1 ring-navy-900/5 sm:w-fit">
        {TABS.map((t) => (
          <button key={t.key || "all"} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium ${tab === t.key ? "bg-navy-900 text-white" : "text-navy-800/60 hover:text-navy-900"}`}>
            {t.label}{t.key && c[t.key] > 0 && <span className={`rounded-full px-1.5 text-[11px] ${tab === t.key ? "bg-white/20" : t.key === "pending" ? "bg-amber-500 text-white" : "bg-navy-900/8"}`}>{c[t.key]}</span>}
          </button>
        ))}
      </div>

      {data?.error && <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700"><AlertCircle size={16} /> {data.error}</div>}

      <div className="mt-4">
        {!data ? (
          <CardSkeletonList count={2} height="h-64" />
        ) : data.rows.length === 0 ? (
          <div className="card-surface px-6 py-14 text-center text-sm text-navy-800/50">
            <Clapperboard size={26} className="mx-auto mb-2 text-navy-800/25" />
            {tab === "pending" ? "Nothing to review. Seller uploads show up here." : "No reels here yet."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.rows.map((r) => (
              <div key={r.id} className="card-surface overflow-hidden">
                <div className="relative aspect-[9/16] bg-navy-900">
                  <video src={r.video_url} poster={r.poster_url || undefined} controls muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                  {r.featured ? <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-navy-950">★ Featured</span> : null}
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === "approved" ? "bg-teal-500 text-white" : r.status === "pending" ? "bg-amber-500 text-white" : "bg-coral-600 text-white"}`}>
                    {r.status === "approved" ? "Live" : r.status === "pending" ? "Review" : "Rejected"}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <div className="truncate text-sm font-semibold text-navy-900">{r.title}</div>
                    <div className="truncate text-xs text-navy-800/50">{r.property_title || "No listing linked"}</div>
                    <div className="truncate text-[11px] text-navy-800/40">{r.uploader_name ? `By ${r.uploader_name}` : "Uploaded by admin"} · {formatDay(r.created_at)}</div>
                  </div>
                  {r.status === "rejected" && r.rejection_reason && <p className="text-[11px] text-coral-600">{r.rejection_reason}</p>}
                  <div className="flex gap-3 text-xs text-navy-800/55"><span className="flex items-center gap-1"><Eye size={12} /> {r.views}</span><span className="flex items-center gap-1"><Heart size={12} /> {r.likes}</span></div>
                  {r.status === "pending" ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => act(r, "approve")} className="flex items-center justify-center gap-1 rounded-full bg-teal-500 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"><CheckCircle2 size={13} /> Approve</button>
                      <button onClick={() => setRejecting(r)} className="flex items-center justify-center gap-1 rounded-full border border-coral-500/40 py-1.5 text-xs font-semibold text-coral-600 hover:bg-coral-500/5"><XCircle size={13} /> Reject</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {r.status === "approved" ? (
                        <button onClick={() => act(r, "feature", { featured: !r.featured })} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${r.featured ? "bg-amber-400 text-navy-950" : "bg-sand-100 text-navy-800/70 hover:bg-amber-400/30"}`}>
                          <Star size={12} fill={r.featured ? "currentColor" : "none"} /> {r.featured ? "Featured" : "Feature"}
                        </button>
                      ) : (
                        <button onClick={() => act(r, "approve")} className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-600">Approve</button>
                      )}
                      <span className="flex">
                        <button onClick={() => setEditing(r)} title="Edit" className="rounded p-1.5 text-navy-800/45 hover:text-navy-900"><Pencil size={14} /></button>
                        <button onClick={() => remove(r)} title="Delete" className="rounded p-1.5 text-navy-800/40 hover:text-coral-600"><Trash2 size={14} /></button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-4 flex items-center gap-1 text-xs text-navy-800/45"><Settings size={12} /> Seller uploads and auto-publishing are set in <Link href="/admin/settings" className="font-semibold text-teal-600">Site Settings → Growth features</Link>.</p>

      {editing && <ReelForm reel={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} onError={(m) => alert({ title: "Save failed", message: m })} />}
      {rejecting && <RejectModal reel={rejecting} onClose={() => setRejecting(null)} onReject={async (reason) => { const err = await act(rejecting, "reject", { reason }); if (!err) setRejecting(null); return err; }} />}
      {dialog}
    </div>
  );
}

function RejectModal({ reel, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal
      title="Reject reel"
      subtitle={reel.title}
      onClose={onClose}
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={async () => { const err = await onReject(reason); if (err) setError(err.fieldErrors?.reason || err.error); }} className="rounded-full bg-coral-600 px-5 py-2.5 text-sm font-semibold text-white">Reject</button></>}
    >
      <AField label="Reason (the seller sees this)" required error={error}>
        <textarea rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} placeholder="e.g. Video is landscape and blurry. Please re-shoot in portrait." className={ainput} />
      </AField>
    </Modal>
  );
}

function ReelForm({ reel, onClose, onSaved, onError }) {
  const isNew = !reel.id;
  const [f, setF] = useState({ title: reel.title || "", property_id: reel.property_id || "", video_url: reel.video_url || "", poster_url: reel.poster_url || "", sort_order: reel.sort_order || 0, featured: !!reel.featured });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!q.trim()) return setResults([]);
    const t = setTimeout(() => fetch(`/api/admin/sponsored?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).then((d) => setResults(d.results || [])).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function save() {
    setSaving(true);
    const res = await fetch(isNew ? "/api/admin/reels" : `/api/admin/reels/${reel.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? f : { action: "update", ...f }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { if (json.fieldErrors) { setErrors(json.fieldErrors); scrollToFirstError(); } else onError(json.error); return; }
    onSaved();
  }

  return (
    <Modal
      title={isNew ? "Upload reel" : "Edit reel"}
      subtitle={isNew ? "Admin uploads go live immediately." : undefined}
      onClose={onClose}
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">{saving && <Loader2 size={15} className="animate-spin" />} {isNew ? "Publish reel" : "Save"}</button></>}
    >
      <div className="space-y-4">
        <AField label="Title" required error={errors.title}><input value={f.title} maxLength={160} onChange={(e) => set("title", e.target.value)} className={ainput} /></AField>
        <AField label="Video" required error={errors.video_url} hint="Vertical 9:16, MP4, up to 100 MB."><AdminUpload kind="video" value={f.video_url} onChange={(v) => set("video_url", v)} /></AField>
        <AField label="Cover image" error={errors.poster_url} hint="Optional"><AdminUpload value={f.poster_url} onChange={(v) => set("poster_url", v)} /></AField>
        <AField label="Linked listing" hint={f.property_id ? `Listing #${f.property_id} linked. Search to change.` : "Optional. Adds 'View property' and 'Book visit' buttons."}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings by title or ID" className={ainput} />
          {results.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-xl ring-1 ring-navy-900/10">
              {results.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => { set("property_id", p.id); setQ(p.title); setResults([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-sand-50">#{p.id} · {p.title}</button>
                </li>
              ))}
            </ul>
          )}
          {f.property_id ? <button type="button" onClick={() => set("property_id", "")} className="mt-1 text-xs font-semibold text-coral-600">Unlink listing</button> : null}
        </AField>
        <AField label="Order" hint="Lower shows first."><input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={ainput} /></AField>
        {isNew && <label className="flex items-center gap-2 text-sm text-navy-900"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-teal-500" /> Feature it (shows first)</label>}
      </div>
    </Modal>
  );
}
