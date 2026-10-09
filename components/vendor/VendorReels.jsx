"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clapperboard, Upload, Loader2, Trash2, Eye, Heart, Clock, CheckCircle2, XCircle, AlertCircle, Video, ImageIcon } from "lucide-react";
import { Field, FileUpload, inputClass } from "@/components/vendor/listing/WizardUI";
import { useDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "./vendorShared";

const STATUS = {
  pending: { label: "Waiting for review", cls: "bg-amber-500/15 text-amber-700", Icon: Clock },
  approved: { label: "Live", cls: "bg-teal-500/15 text-teal-700", Icon: CheckCircle2 },
  rejected: { label: "Not approved", cls: "bg-coral-500/10 text-coral-600", Icon: XCircle },
};

// Seller panel → Reels: upload short vertical video tours for your listings.
export default function VendorReels({ properties }) {
  const { confirm, dialog } = useDialog();
  const [data, setData] = useState(null);
  const [f, setF] = useState({ property_id: "", title: "", video_url: "", poster_url: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const load = useCallback(() => {
    fetch("/api/vendor/reels", { cache: "no-store" }).then((r) => r.json()).then(setData).catch(() => setData({ reels: [] }));
  }, []);
  useEffect(load, [load]);

  const live = properties.filter((p) => ["published", "under_offer"].includes(p.status));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    const res = await fetch("/api/vendor/reels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      if (!json.fieldErrors) setNotice(json.error);
      return;
    }
    setF({ property_id: "", title: "", video_url: "", poster_url: "" });
    setNotice(json.status === "approved" ? "Your reel is live!" : "Uploaded! Our team will review it shortly.");
    load();
  }

  async function remove(r) {
    if (!(await confirm({ title: "Delete this reel?", message: r.title, confirmLabel: "Delete" }))) return;
    await fetch(`/api/vendor/reels/${r.id}`, { method: "DELETE" });
    load();
  }

  if (!data) return <div className="flex items-center justify-center gap-2 rounded-3xl bg-white py-20 text-sm text-navy-800/50"><Loader2 size={16} className="animate-spin" /> Loading reels…</div>;

  return (
    <div className="grid gap-6 xl:grid-cols-[380px,minmax(0,1fr)]">
      <form onSubmit={submit} noValidate className="h-fit space-y-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5 md:p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600"><Clapperboard size={19} /></span>
          <div>
            <h3 className="font-display text-lg text-navy-900">Upload a reel</h3>
            <p className="text-xs text-navy-800/50">15–60 sec vertical video gets the most views.</p>
          </div>
        </div>
        {!data.uploadsEnabled ? (
          <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800">Reel uploads are switched off right now.</p>
        ) : live.length === 0 ? (
          <p className="rounded-xl bg-sand-50 p-3 text-sm text-navy-800/60">Publish a listing first, then add a reel for it. <Link href="/vendor/new" className="font-semibold text-teal-600">Add property</Link></p>
        ) : (
          <>
            <Field label="Listing" required error={errors.property_id}>
              <select value={f.property_id} onChange={(e) => set("property_id", e.target.value)} className={inputClass}>
                <option value="">Choose a listing…</option>
                {live.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
            <Field label="Title" required error={errors.title}>
              <input value={f.title} maxLength={160} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sunny 3 BHK walkthrough" className={inputClass} />
            </Field>
            <Field label="Video" required error={errors.video_url} hint="MP4 or MOV, up to 100 MB. Film in portrait (9:16).">
              <FileUpload value={f.video_url} onChange={(v) => set("video_url", v)} accept="video/mp4,video/webm,video/quicktime" label="Video" hint="Vertical video" icon={Video} />
            </Field>
            <Field label="Cover image" error={errors.poster_url} hint="Optional. Shown before the video plays.">
              <FileUpload value={f.poster_url} onChange={(v) => set("poster_url", v)} accept="image/*" label="Cover" hint="Portrait image" icon={ImageIcon} />
            </Field>
            {notice && <p className={`rounded-xl p-3 text-sm ${notice.includes("!") ? "bg-teal-500/10 text-teal-700" : "bg-coral-500/10 text-coral-600"}`}>{notice}</p>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {data.autoApprove ? "Publish reel" : "Submit for review"}
            </button>
          </>
        )}
      </form>

      <div>
        {data.reels.length === 0 ? (
          <EmptyState Icon={Clapperboard} title="No reels yet" text="Short video tours appear on the Reels page and the homepage, and get far more attention than photos." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.reels.map((r) => {
              const S = STATUS[r.status];
              return (
                <div key={r.id} className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy-900/5">
                  <div className="relative aspect-[9/16] bg-navy-900">
                    <video src={r.video_url} poster={r.poster_url || undefined} muted playsInline preload="metadata" controls className="absolute inset-0 h-full w-full object-cover" />
                    <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${S.cls}`}><S.Icon size={11} /> {S.label}</span>
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-semibold text-navy-900">{r.title}</div>
                    <div className="truncate text-xs text-navy-800/50">{r.property_title}</div>
                    {r.status === "rejected" && r.rejection_reason && <p className="mt-1 flex gap-1 text-[11px] text-coral-600"><AlertCircle size={12} className="mt-px shrink-0" /> {r.rejection_reason}</p>}
                    <div className="mt-2 flex items-center justify-between text-xs text-navy-800/55">
                      <span className="flex gap-2"><span className="flex items-center gap-0.5"><Eye size={12} /> {r.views}</span><span className="flex items-center gap-0.5"><Heart size={12} /> {r.likes}</span></span>
                      <button type="button" onClick={() => remove(r)} aria-label="Delete reel" className="rounded p-1 text-navy-800/40 hover:text-coral-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
