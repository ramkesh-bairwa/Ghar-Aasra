"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, Trash2 } from "lucide-react";

// Upload field for admin forms (images or videos via /api/admin/upload),
// with a preview and a remove button. `kind`: "image" | "video".
export default function AdminUpload({ value, onChange, kind = "image", hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      onChange(json.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      {value && (
        <div className="mb-2 overflow-hidden rounded-xl bg-navy-900 ring-1 ring-navy-900/10">
          {kind === "video" ? (
            <video src={value} controls muted playsInline className="max-h-56 w-full object-contain" />
          ) : (
            <img src={value} alt="" className="max-h-56 w-full object-contain" />
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-3.5 py-2 text-xs font-semibold text-navy-800 hover:border-teal-500 hover:text-teal-600">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {busy ? "Uploading…" : value ? "Replace" : `Upload ${kind}`}
          <input
            ref={input}
            type="file"
            className="hidden"
            disabled={busy}
            onChange={pick}
            accept={kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif"}
          />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-navy-800/50 hover:text-coral-600">
            <Trash2 size={13} /> Remove
          </button>
        )}
        {hint && <span className="text-[11px] text-navy-800/45">{hint}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-coral-600">{error}</p>}
    </div>
  );
}
