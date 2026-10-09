"use client";

import AdminGate from "@/components/admin/AdminGate";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2, Save, Check } from "lucide-react";
import { SETTINGS_GROUPS, ALL_SETTINGS_FIELDS } from "@/lib/siteSettingsSchema";
import { getBackgroundEmbed } from "@/lib/videoEmbed";
import { CardSkeletonList } from "@/components/admin/AdminSkeleton";

export default function AdminSettingsPage() {
  return (
    <AdminGate>
      <SiteSettingsEditor />
    </AdminGate>
  );
}

function SiteSettingsEditor() {
  const [values, setValues] = useState(() => Object.fromEntries(ALL_SETTINGS_FIELDS.map((f) => [f.key, f.default])));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  // Bumped on save so image previews built from settings (the favicon) refresh.
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => {
        const fromDb = Object.fromEntries((d.rows || []).map((r) => [r.setting_key, r.setting_value]));
        setValues((prev) => ({ ...prev, ...fromDb }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setValue(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMessage("");
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (res.ok) {
        setDirty(false);
        setSavedAt(Date.now());
        setMessage("Saved. Changes are live on the site.");
      } else {
        setMessage("Could not save — check your MySQL connection.");
      }
    } catch {
      setMessage("Could not save — check your MySQL connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy-900">Site Settings</h1>
          <p className="mt-1 text-sm text-navy-800/55">
            Manage branding, theme colors, typography, and content shown across the live site.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8"><CardSkeletonList count={3} height="h-48" /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {SETTINGS_GROUPS.map((group) => (
            <section key={group.key} className="card-surface p-5">
              <h2 className="font-display text-lg text-navy-900">{group.label}</h2>
              {group.description && <p className="mt-1 text-xs text-navy-800/50">{group.description}</p>}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {group.fields.filter((field) => isShown(field, values)).map((field) => (
                  <Field key={field.key} field={field} value={values[field.key]} onChange={(v) => setValue(field.key, v)} savedAt={savedAt} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-900/10 bg-white/95 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="text-xs text-navy-800/50">
            {message ? message : dirty ? "You have unsaved changes." : "All changes saved."}
          </span>
          <button
            onClick={saveAll}
            disabled={saving || !dirty}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : dirty ? <><Save size={16} /> Save changes</> : <><Check size={16} /> Saved</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ field, value, onChange, savedAt }) {
  const wide = field.type === "textarea";
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-navy-800/60">{field.label}</label>
      {field.help && <p className="mb-1.5 text-xs text-navy-800/40">{field.help}</p>}
      <FieldInput field={field} value={value} onChange={onChange} savedAt={savedAt} />
    </div>
  );
}

// Fields with `showIf: { otherKey: [values] }` only appear when that other
// setting has one of those values (e.g. the YouTube link only for a YouTube hero).
function isShown(field, values) {
  if (!field.showIf) return true;
  return Object.entries(field.showIf).every(([key, allowed]) => {
    const def = ALL_SETTINGS_FIELDS.find((f) => f.key === key)?.default;
    return allowed.includes(values[key] ?? def);
  });
}

function FieldInput({ field, value, onChange, savedAt = 0 }) {
  switch (field.type) {
    case "youtube": {
      const embed = getBackgroundEmbed(value);
      return (
        <div>
          <input
            type="url"
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value.trim())}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${value && !embed ? "border-coral-500" : "border-navy-900/10"}`}
          />
          {value && !embed && <p className="mt-1.5 text-xs font-medium text-coral-600">That doesn&apos;t look like a YouTube or Vimeo video link. Copy the link from the video page or its Share button.</p>}
          {embed && (
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-sand-50 p-2 ring-1 ring-navy-900/8">
              {embed.thumb ? <img src={embed.thumb} alt="" className="h-14 w-24 rounded-lg object-cover" /> : <span className="flex h-14 w-24 items-center justify-center rounded-lg bg-navy-900 text-[11px] font-semibold text-white">Vimeo</span>}
              <span className="text-xs text-navy-800/60">
                <b className="text-teal-600">✓ {embed.kind === "youtube" ? "YouTube" : "Vimeo"} video found.</b> It will play muted on loop behind the homepage search.
              </span>
            </div>
          )}
        </div>
      );
    }
    case "text":
      return (
        <input
          type="text"
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      );
    case "textarea":
      return (
        <textarea
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      );
    case "select":
      return (
        <select
          value={value ?? field.default}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : field.default}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-navy-900/10 bg-transparent p-1"
          />
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.default}
            className="w-full rounded-xl border border-navy-900/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      );
    case "image":
      return (
        <MediaField
          kind="image"
          value={value}
          onChange={onChange}
          // The favicon's "default" is the built-in icon drawn in the saved colours.
          fallback={field.key === "favicon_url" ? `/theme-icon?size=48&t=${savedAt}` : field.default}
          dark={field.key === "logo_dark_url"}
        />
      );
    case "video":
      return <MediaField kind="video" value={value} onChange={onChange} />;
    case "toggle": {
      const on = value === "true" || value === true;
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(on ? "false" : "true")}
          className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${on ? "bg-teal-500" : "bg-navy-900/15"}`}
        >
          <span className={`h-6 w-6 rounded-full bg-white shadow-soft transition-transform ${on ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      );
    }
    default:
      return null;
  }
}

function MediaField({ kind, value, onChange, fallback = "", dark = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      {kind === "image" && (value || fallback) && (
        <div className="mb-2 flex items-center gap-3">
          <img
            src={value || fallback}
            alt=""
            className={`h-24 w-auto max-w-xs rounded-lg border border-navy-900/10 object-contain p-2 ${dark ? "bg-navy-900" : "bg-white"}`}
          />
          {(!value || value === fallback) && fallback && (
            <span className="rounded-full bg-navy-900/5 px-2.5 py-1 text-[11px] font-medium text-navy-800/55">Default</span>
          )}
        </div>
      )}
      {value && kind === "video" && (
        <video src={value} controls className="mb-2 w-full max-w-xs rounded-lg border border-navy-900/10" />
      )}
      <div className="flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-navy-900/10 px-3.5 py-2 text-xs font-medium text-navy-800/70 hover:border-teal-500 hover:text-teal-600">
          <UploadCloud size={14} />
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
          <input
            ref={fileInputRef}
            type="file"
            accept={kind === "video" ? "video/mp4,video/webm,video/ogg,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif,image/x-icon,.ico"}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {value && value !== fallback && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={uploading}
            className="flex items-center gap-1 rounded-full border border-navy-900/10 px-3 py-2 text-xs font-medium text-navy-800/50 hover:text-red-600"
          >
            <Trash2 size={13} /> {fallback ? "Reset to default" : "Remove"}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
