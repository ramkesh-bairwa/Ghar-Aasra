"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Megaphone, AlertCircle, Loader2, Eye, MousePointerClick, Pencil, Trash2, Image as ImageIcon, Video, Type, Star, Search, X, CalendarClock, RotateCcw,
} from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import AdminUpload from "@/components/admin/AdminUpload";
import { CardSkeletonList } from "@/components/admin/AdminSkeleton";
import { useDialog } from "@/components/ConfirmDialog";
import { AField, ainput, Modal, useMoney, formatDay, scrollToFirstError } from "@/components/admin/sellerAdminUI";
import { AD_PLACEMENTS } from "@/lib/adPlacements";

export default function AdminAdsPage() {
  return (
    <AdminGate>
      <AdsManager />
    </AdminGate>
  );
}

const placementLabel = (k) => AD_PLACEMENTS.find((p) => p.key === k)?.label || k;
const ctr = (a) => (a.impressions > 0 ? `${((a.clicks / a.impressions) * 100).toFixed(1)}%` : "—");

function AdsManager() {
  const { confirm, alert, dialog } = useDialog();
  const [tab, setTab] = useState("banners");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [placement, setPlacement] = useState("");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ads", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRows(json.rows);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load banners.");
      setRows([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(ad) {
    setRows((list) => list.map((a) => (a.id === ad.id ? { ...a, is_active: ad.is_active ? 0 : 1 } : a)));
    await fetch(`/api/admin/ads/${ad.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !ad.is_active }) });
    load();
  }
  async function remove(ad) {
    if (!(await confirm({ title: `Delete "${ad.title}"?`, message: "The banner and its stats are removed for good.", confirmLabel: "Delete" }))) return;
    await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    load();
  }
  async function resetStats(ad) {
    if (!(await confirm({ title: "Reset views and clicks?", message: "Useful when you replace the creative and want fresh numbers.", confirmLabel: "Reset", tone: "info" }))) return;
    await fetch(`/api/admin/ads/${ad.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset_stats: true }) });
    load();
  }

  const shown = (rows || []).filter((a) => !placement || a.placement === placement);
  const totals = useMemo(() => {
    const list = rows || [];
    const impressions = list.reduce((s, a) => s + a.impressions, 0);
    const clicks = list.reduce((s, a) => s + a.clicks, 0);
    return { live: list.filter((a) => Number(a.is_live)).length, impressions, clicks, ctr: impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : "—" };
  }, [rows]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Ads & Banners</h1>
          <p className="mt-1 text-sm text-navy-800/55">Image and video banners, popups and announcements across the site, plus sponsored listings. Schedule them and track views and clicks.</p>
        </div>
        {tab === "banners" && <button onClick={() => setEditing({})} className="btn-primary"><Plus size={16} /> New banner</button>}
      </div>

      <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-soft ring-1 ring-navy-900/5 sm:w-fit">
        {[{ k: "banners", l: "Banners", I: Megaphone }, { k: "sponsored", l: "Sponsored listings", I: Star }].map(({ k, l, I }) => (
          <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${tab === k ? "bg-navy-900 text-white" : "text-navy-800/60 hover:text-navy-900"}`}>
            <I size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "sponsored" ? (
        <SponsoredManager />
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { l: "Live now", v: totals.live, I: Megaphone },
              { l: "Views", v: totals.impressions.toLocaleString("en-IN"), I: Eye },
              { l: "Clicks", v: totals.clicks.toLocaleString("en-IN"), I: MousePointerClick },
              { l: "Click rate", v: totals.ctr, I: MousePointerClick },
            ].map(({ l, v, I }) => (
              <div key={l} className="card-surface flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600"><I size={18} /></span>
                <div><div className="text-xs text-navy-800/55">{l}</div><div className="font-display text-xl text-navy-900">{v}</div></div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setPlacement("")} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${!placement ? "bg-navy-900 text-white" : "bg-white text-navy-800/70 ring-1 ring-navy-900/10"}`}>All placements</button>
            {AD_PLACEMENTS.map((p) => {
              const n = (rows || []).filter((a) => a.placement === p.key).length;
              return (
                <button key={p.key} onClick={() => setPlacement(p.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${placement === p.key ? "bg-navy-900 text-white" : "bg-white text-navy-800/70 ring-1 ring-navy-900/10"}`}>
                  {p.label}{n ? ` · ${n}` : ""}
                </button>
              );
            })}
          </div>

          {error && <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700"><AlertCircle size={16} /> {error}</div>}

          <div className="mt-4">
            {rows === null ? (
              <CardSkeletonList count={3} height="h-32" />
            ) : shown.length === 0 ? (
              <div className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
                <Megaphone size={26} className="text-navy-800/25" />
                <p className="text-sm text-navy-800/55">{placement ? `No banners in "${placementLabel(placement)}" yet.` : "No banners yet. Create your first one."}</p>
                <button onClick={() => setEditing({ placement })} className="btn-primary"><Plus size={16} /> New banner</button>
              </div>
            ) : (
              <div className="space-y-3">
                {shown.map((a) => {
                  const live = Number(a.is_live);
                  const scheduled = a.is_active && a.starts_at && new Date(a.starts_at.replace(" ", "T")) > new Date();
                  const ended = a.ends_at && new Date(a.ends_at.replace(" ", "T")) < new Date();
                  return (
                    <div key={a.id} className="card-surface flex flex-wrap items-center gap-4 p-3">
                      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-navy-900">
                        {a.media_type === "video" && a.video_url ? (
                          <video src={a.video_url} muted playsInline className="h-full w-full object-cover" />
                        ) : a.image_url ? (
                          <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center p-2 text-center text-[10px] font-semibold text-white/80">{a.headline}</div>
                        )}
                        <span className="absolute bottom-1 left-1 rounded bg-black/55 p-1 text-white">
                          {a.media_type === "video" ? <Video size={11} /> : a.media_type === "text" ? <Type size={11} /> : <ImageIcon size={11} />}
                        </span>
                      </div>
                      <div className="min-w-[200px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-navy-900">{a.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${live ? "bg-teal-500/15 text-teal-600" : scheduled ? "bg-amber-500/15 text-amber-700" : "bg-navy-900/8 text-navy-800/55"}`}>
                            {live ? "● Live" : scheduled ? "Scheduled" : ended ? "Ended" : "Off"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-navy-800/55">
                          {placementLabel(a.placement)}
                          {a.target_listing_type && ` · ${a.target_listing_type} pages only`}
                          {a.target_city && ` · ${a.target_city} only`}
                        </div>
                        {(a.starts_at || a.ends_at) && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-navy-800/45"><CalendarClock size={11} /> {a.starts_at ? formatDay(a.starts_at) : "Now"} → {a.ends_at ? formatDay(a.ends_at) : "No end"}</div>
                        )}
                      </div>
                      <div className="flex gap-5 text-center text-xs">
                        <div><div className="font-display text-lg text-navy-900">{a.impressions.toLocaleString("en-IN")}</div><div className="text-navy-800/45">views</div></div>
                        <div><div className="font-display text-lg text-navy-900">{a.clicks.toLocaleString("en-IN")}</div><div className="text-navy-800/45">clicks</div></div>
                        <div><div className="font-display text-lg text-teal-600">{ctr(a)}</div><div className="text-navy-800/45">CTR</div></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggle(a)} role="switch" aria-checked={!!a.is_active} title={a.is_active ? "Turn off" : "Turn on"} className={`relative h-6 w-11 rounded-full transition-colors ${a.is_active ? "bg-teal-500" : "bg-navy-900/15"}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${a.is_active ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                        <button onClick={() => setEditing(a)} title="Edit" className="rounded-lg p-2 text-navy-800/50 hover:bg-sand-100 hover:text-navy-900"><Pencil size={15} /></button>
                        <button onClick={() => resetStats(a)} title="Reset stats" className="rounded-lg p-2 text-navy-800/50 hover:bg-sand-100 hover:text-navy-900"><RotateCcw size={15} /></button>
                        <button onClick={() => remove(a)} title="Delete" className="rounded-lg p-2 text-navy-800/40 hover:bg-coral-500/10 hover:text-coral-600"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-navy-800/45">Turn every banner off at once in <Link href="/admin/settings" className="font-semibold text-teal-600">Site Settings → Growth features</Link>.</p>
        </>
      )}

      {editing && <AdForm ad={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} onError={(m) => alert({ title: "Save failed", message: m })} />}
      {dialog}
    </div>
  );
}

const toLocalInput = (v) => (v ? String(v).replace(" ", "T").slice(0, 16) : "");

function AdForm({ ad, onClose, onSaved, onError }) {
  const isNew = !ad.id;
  const [f, setF] = useState({
    title: ad.title || "", placement: ad.placement || "home_hero_below", media_type: ad.media_type || "image",
    image_url: ad.image_url || "", mobile_image_url: ad.mobile_image_url || "", video_url: ad.video_url || "",
    headline: ad.headline || "", subtext: ad.subtext || "", cta_label: ad.cta_label || "", link_url: ad.link_url || "",
    open_new_tab: !!ad.open_new_tab, target_listing_type: ad.target_listing_type || "", target_city: ad.target_city || "",
    sort_order: ad.sort_order ?? 0, is_active: ad.is_active === undefined ? true : !!ad.is_active,
    starts_at: toLocalInput(ad.starts_at), ends_at: toLocalInput(ad.ends_at),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const place = AD_PLACEMENTS.find((p) => p.key === f.placement);
  const textOnly = place?.textOnly;
  const type = textOnly ? "text" : f.media_type;

  async function save() {
    setSaving(true);
    const res = await fetch(isNew ? "/api/admin/ads" : `/api/admin/ads/${ad.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, media_type: type }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      if (json.fieldErrors) { setErrors(json.fieldErrors); scrollToFirstError(); } else onError(json.error);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title={isNew ? "New banner" : "Edit banner"}
      subtitle={place?.hint}
      onClose={onClose}
      wide
      footer={<><button onClick={onClose} className="btn-outline px-5 py-2.5">Cancel</button><button onClick={save} disabled={saving} className="btn-primary px-5 py-2.5">{saving && <Loader2 size={15} className="animate-spin" />} {isNew ? "Create banner" : "Save changes"}</button></>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AField label="Banner name" required error={errors.title} hint="Only admins see this."><input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Diwali offer – homepage" className={ainput} /></AField>
          <AField label="Where to show it" required error={errors.placement} hint={place ? `Recommended: ${place.size}` : undefined}>
            <select value={f.placement} onChange={(e) => set("placement", e.target.value)} className={ainput}>
              {AD_PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </AField>
        </div>

        {!textOnly && (
          <AField label="Banner type">
            <div className="grid grid-cols-3 gap-2">
              {[{ k: "image", l: "Image", I: ImageIcon }, { k: "video", l: "Video", I: Video }, { k: "text", l: "Text only", I: Type }].map(({ k, l, I }) => (
                <button key={k} type="button" onClick={() => set("media_type", k)} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${type === k ? "bg-navy-900 text-white" : "bg-sand-50 text-navy-800 ring-1 ring-navy-900/10"}`}>
                  <I size={15} /> {l}
                </button>
              ))}
            </div>
          </AField>
        )}

        {type === "image" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AField label="Image" required error={errors.image_url}><AdminUpload value={f.image_url} onChange={(v) => set("image_url", v)} hint={place?.size} /></AField>
            <AField label="Mobile image" error={errors.mobile_image_url} hint="Optional. A taller crop for phones."><AdminUpload value={f.mobile_image_url} onChange={(v) => set("mobile_image_url", v)} /></AField>
          </div>
        )}
        {type === "video" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AField label="Video" required error={errors.video_url} hint="MP4, up to 100 MB. Plays muted on loop."><AdminUpload kind="video" value={f.video_url} onChange={(v) => set("video_url", v)} /></AField>
            <AField label="Poster image" error={errors.image_url} hint="Optional. Shown while the video loads."><AdminUpload value={f.image_url} onChange={(v) => set("image_url", v)} /></AField>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <AField label={type === "text" ? "Text" : "Headline"} required={type === "text"} error={errors.headline} hint={type === "text" ? undefined : "Optional. Shown over the banner."} className="sm:col-span-2">
            <input value={f.headline} maxLength={160} onChange={(e) => set("headline", e.target.value)} placeholder={textOnly ? "e.g. 🎉 Zero brokerage on all rentals this month" : "e.g. New launch: 3 BHK from ₹65L"} className={ainput} />
          </AField>
          {!textOnly && (
            <AField label="Subtext" error={errors.subtext} className="sm:col-span-2"><input value={f.subtext} maxLength={300} onChange={(e) => set("subtext", e.target.value)} className={ainput} /></AField>
          )}
          <AField label="Button text" error={errors.cta_label} hint="Optional"><input value={f.cta_label} maxLength={60} onChange={(e) => set("cta_label", e.target.value)} placeholder="e.g. Book a visit" className={ainput} /></AField>
          <AField label="Link" error={errors.link_url} hint="https://… or a page on this site, like /projects"><input value={f.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="/properties?city=Jaipur" className={ainput} /></AField>
          <label className="flex items-center gap-2 text-sm text-navy-800/75 sm:col-span-2"><input type="checkbox" checked={f.open_new_tab} onChange={(e) => set("open_new_tab", e.target.checked)} className="h-4 w-4 accent-teal-500" /> Open link in a new tab</label>
        </div>

        <section className="rounded-xl2 bg-sand-50 p-4 ring-1 ring-navy-900/8">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Targeting & schedule</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <AField label="Show on" hint="Applies to search and property pages.">
              <select value={f.target_listing_type} onChange={(e) => set("target_listing_type", e.target.value)} className={ainput}>
                <option value="">All pages</option>
                <option value="sale">Buy / sale pages</option>
                <option value="rent">Rent pages</option>
                <option value="commercial">Commercial pages</option>
              </select>
            </AField>
            <AField label="City" hint="Optional. Only on pages for this city."><input value={f.target_city} onChange={(e) => set("target_city", e.target.value)} placeholder="e.g. Jaipur" className={ainput} /></AField>
            <AField label="Start" error={errors.starts_at} hint="Leave blank to start now."><input type="datetime-local" value={f.starts_at} onChange={(e) => set("starts_at", e.target.value)} className={ainput} /></AField>
            <AField label="End" error={errors.ends_at} hint="Leave blank to run until turned off."><input type="datetime-local" value={f.ends_at} onChange={(e) => set("ends_at", e.target.value)} className={ainput} /></AField>
            <AField label="Order" hint="Lower shows first when several share a spot."><input type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={ainput} /></AField>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-navy-900"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-teal-500" /> Active</label>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function SponsoredManager() {
  const money = useMoney();
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [until, setUntil] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const load = useCallback(async (term = "") => {
    const res = await fetch(`/api/admin/sponsored${term ? `?q=${encodeURIComponent(term)}` : ""}`, { cache: "no-store" });
    setData(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => load(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  async function setSponsor(propertyId, date) {
    setError("");
    const res = await fetch("/api/admin/sponsored", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId, until: date }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.fieldErrors?.until || json.error);
    load(q.trim());
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr,1.2fr]">
      <div className="card-surface h-fit p-5">
        <h3 className="font-display text-lg text-navy-900">Sponsor a listing</h3>
        <p className="mt-1 text-sm text-navy-800/55">Sponsored listings show first in search results with a ★ Sponsored badge, until the end date.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,160px]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or ID" className={`${ainput} pl-9`} />
          </div>
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={ainput} aria-label="Sponsored until" />
        </div>
        {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
        <ul className="mt-3 divide-y divide-navy-900/5">
          {(data?.results || []).map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <img src={p.cover_image_url || "/brand/gharaashra-app-icon.png"} alt="" className="h-10 w-14 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-navy-900">{p.title}</div>
                <div className="text-xs text-navy-800/50">#{p.id} · {p.city} · {money(p.price)}</div>
              </div>
              <button onClick={() => setSponsor(p.id, until)} className="rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600">Sponsor</button>
            </li>
          ))}
          {q && data && !data.results?.length && <li className="py-3 text-sm text-navy-800/50">No live listings match.</li>}
        </ul>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-navy-900/8 px-5 py-3 font-display text-lg text-navy-900">Sponsored now & before</div>
        {!data ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-navy-800/50"><Loader2 size={15} className="animate-spin" /> Loading…</div>
        ) : !data.sponsored?.length ? (
          <p className="px-5 py-10 text-center text-sm text-navy-800/50">No sponsored listings yet.</p>
        ) : (
          <ul className="divide-y divide-navy-900/5">
            {data.sponsored.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <img src={p.cover_image_url || "/brand/gharaashra-app-icon.png"} alt="" className="h-12 w-16 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/properties/${p.slug}`} target="_blank" className="block truncate text-sm font-medium text-navy-900 hover:text-teal-600">{p.title}</Link>
                  <div className="text-xs text-navy-800/50">{p.seller_name ? `${p.seller_name} · ` : ""}{Number(p.is_live) ? `Until ${formatDay(p.sponsored_until)}` : `Ended ${formatDay(p.sponsored_until)}`}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${Number(p.is_live) ? "bg-amber-400 text-navy-950" : "bg-navy-900/8 text-navy-800/55"}`}>{Number(p.is_live) ? "★ Live" : "Ended"}</span>
                <button onClick={() => setSponsor(p.id, null)} title="Remove" className="rounded-lg p-1.5 text-navy-800/40 hover:bg-coral-500/10 hover:text-coral-600"><X size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
