"use client";

import { useRef, useState } from "react";
import { Minus, Plus, UploadCloud, Loader2, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export const inputClass =
  "w-full rounded-xl bg-sand-50 px-4 py-3 text-[15px] text-navy-900 ring-1 ring-navy-900/10 placeholder:text-navy-800/35 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500";

export function humanize(value) {
  const s = String(value || "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Section({ icon: Icon, title, subtitle, children, aside, error }) {
  return (
    <section
      data-field-error={error ? "" : undefined}
      className={`rounded-[1.4rem] bg-white p-5 shadow-soft ring-1 md:p-7 ${error ? "ring-coral-500/50" : "ring-navy-900/5"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <Icon size={19} />
            </span>
          )}
          <div>
            <h3 className="font-display text-lg text-navy-900">{title}</h3>
            {subtitle && <p className="text-sm text-navy-800/55">{subtitle}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}

export function ErrorText({ children }) {
  return (
    <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-coral-600">
      <AlertCircle size={13} className="shrink-0" /> {children}
    </span>
  );
}

// `error` turns the control's ring red and shows the message below it.
export function Field({ label, hint, required, error, children, className = "" }) {
  return (
    <label
      data-field-error={error ? "" : undefined}
      className={`block ${className} ${
        error ? "[&_input:not(.bare)]:!ring-2 [&_input:not(.bare)]:!ring-coral-500/70 [&_select]:!ring-2 [&_select]:!ring-coral-500/70 [&_textarea]:!ring-2 [&_textarea]:!ring-coral-500/70 [&_.ring-1]:!ring-coral-500/70" : ""
      }`}
    >
      <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-navy-900">
        {label}
        {required && <span className="text-coral-500">*</span>}
      </span>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : hint && <span className="mt-1 block text-xs text-navy-800/45">{hint}</span>}
    </label>
  );
}

export function SuffixInput({ suffix, prefix, ...props }) {
  return (
    <div className="flex items-center rounded-xl bg-sand-50 ring-1 ring-navy-900/10 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500">
      {prefix && <span className="pl-4 text-sm text-navy-800/45">{prefix}</span>}
      <input {...props} className="bare w-full bg-transparent px-4 py-3 text-[15px] text-navy-900 placeholder:text-navy-800/35 focus:outline-none" />
      {suffix && <span className="pr-4 text-sm text-navy-800/45">{suffix}</span>}
    </div>
  );
}

// Single-select chips; click the active chip again to clear it (unless `required`).
export function ChipGroup({ options, value, onChange, labels = {}, icons = {}, required = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o;
        const Icon = icons[o];
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(active && !required ? "" : o)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-navy-900 text-white shadow-soft"
                : "bg-sand-50 text-navy-800/75 ring-1 ring-navy-900/10 hover:bg-white hover:text-navy-900 hover:ring-teal-500/50"
            }`}
          >
            {Icon && <Icon size={14} className={active ? "text-teal-300" : "text-teal-600"} />}
            {labels[o] || humanize(o)}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 20 }) {
  const n = Number(value) || 0;
  return (
    <div className="flex items-center justify-between rounded-xl bg-sand-50 p-1.5 ring-1 ring-navy-900/10">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, n - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-navy-900 shadow-soft disabled:opacity-40"
        disabled={n <= min}
        aria-label="Decrease"
      >
        <Minus size={15} />
      </button>
      <span className="font-display text-lg text-navy-900">{n}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, n + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-navy-900 shadow-soft"
        aria-label="Increase"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left ring-1 transition-colors ${
        checked ? "bg-teal-500/10 ring-teal-500/40" : "bg-sand-50 ring-navy-900/10 hover:ring-teal-500/40"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-navy-900">{label}</span>
        {hint && <span className="block text-xs text-navy-800/50">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-teal-500" : "bg-navy-900/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

// XHR upload so large videos can report progress.
export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/properties/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new Error(data.error || "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(form);
  });
}

// One-file upload box (floor plan, brochure, video) with progress + remove.
// beforeRemove: optional async () => boolean, e.g. a confirm dialog.
export function FileUpload({ value, onChange, accept, label, hint, icon: Icon = UploadCloud, preview = "auto", beforeRemove }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setProgress(0);
    try {
      onChange(await uploadFile(file, setProgress));
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isImage = value && preview === "auto" && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(value);
  const isVideo = value && /\.(mp4|webm|ogv|mov)(\?|$)/i.test(value);

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3 ring-1 ring-navy-900/10">
          {isImage ? (
            <img src={value} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : isVideo ? (
            <video src={value} className="h-16 w-28 rounded-xl bg-navy-950 object-cover" muted />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-navy-900/5">
              <FileText size={24} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
              <CheckCircle2 size={15} className="text-teal-600" /> {label} added
            </div>
            <a href={value} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-teal-600 hover:underline">{value}</a>
          </div>
          <button type="button" onClick={async () => { if (!beforeRemove || (await beforeRemove())) onChange(""); }} className="rounded-lg p-2 text-navy-800/50 hover:bg-coral-500/10 hover:text-coral-600" aria-label={`Remove ${label}`}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-navy-900/15 bg-sand-50/60 p-4 text-left transition-colors hover:border-teal-500 hover:bg-teal-500/5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-navy-900/5 group-hover:bg-teal-500 group-hover:text-white">
            {progress !== null ? <Loader2 size={20} className="animate-spin" /> : <Icon size={20} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-navy-900">
              {progress !== null ? `Uploading… ${progress}%` : `Upload ${label.toLowerCase()}`}
            </span>
            <span className="block text-xs text-navy-800/50">{hint}</span>
            {progress !== null && (
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-navy-900/10">
                <span className="block h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
              </span>
            )}
          </span>
        </button>
      )}
      {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={onFile} className="hidden" />
    </div>
  );
}
