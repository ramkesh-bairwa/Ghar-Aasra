"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertCircle, X } from "lucide-react";

// In-app replacement for window.confirm / window.alert. Usage:
//   const { confirm, alert, dialog } = useDialog();
//   if (await confirm({ title: "Delete booking?", message: "…", confirmLabel: "Delete" })) …
//   await alert({ title: "Delete failed", message: err.message });
//   return <>{…}{dialog}</>;
// `tone: "danger"` (the default for confirm) styles it as a destructive action.
export function useDialog() {
  const [state, setState] = useState(null);
  const open = useCallback((kind, opts) => new Promise((resolve) => setState({ kind, ...opts, resolve })), []);
  const confirm = useCallback((opts) => open("confirm", opts), [open]);
  const alert = useCallback((opts) => open("alert", typeof opts === "string" ? { message: opts } : opts), [open]);
  const close = (value) => {
    state?.resolve(value);
    setState(null);
  };
  const dialog = state ? <DialogModal {...state} onClose={close} /> : null;
  return { confirm, alert, dialog };
}

function DialogModal({ kind, title, message, confirmLabel, cancelLabel = "Cancel", tone, onClose }) {
  const isConfirm = kind === "confirm";
  const danger = (tone || (isConfirm ? "danger" : "info")) === "danger";
  const okRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e) => e.key === "Escape" && onClose(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => { if (mounted) okRef.current?.focus(); }, [mounted]);
  if (!mounted) return null;

  const Icon = danger && isConfirm ? Trash2 : AlertCircle;
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-navy-900/10"
        style={{ animation: "celebrate-pop .25s ease-out both" }}
      >
        <div className="flex items-start gap-4 p-6">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${danger ? "bg-coral-500/10 text-coral-600" : "bg-teal-500/10 text-teal-600"}`}>
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="dialog-title" className="font-display text-lg text-navy-900">
              {title || (isConfirm ? "Are you sure?" : "Something went wrong")}
            </h2>
            {message && <p className="mt-1 text-sm leading-relaxed text-navy-800/65">{message}</p>}
          </div>
          <button type="button" onClick={() => onClose(false)} className="-mr-2 -mt-2 rounded-lg p-1.5 text-navy-800/40 hover:bg-sand-50 hover:text-navy-900" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-2 bg-sand-50 px-6 py-4">
          {isConfirm && (
            <button type="button" onClick={() => onClose(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-navy-800/70 ring-1 ring-navy-900/15 hover:bg-white hover:text-navy-900">
              {cancelLabel}
            </button>
          )}
          <button
            ref={okRef}
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${danger ? "bg-coral-500 hover:bg-coral-600" : "bg-teal-500 hover:bg-teal-600"}`}
          >
            {confirmLabel || (isConfirm ? "Delete" : "OK")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
