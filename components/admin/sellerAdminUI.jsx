"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

// Small shared pieces for the admin Sellers / Commissions / Seller sizes screens.

export const ainput =
  "w-full rounded-xl border border-navy-900/10 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30";

export function AField({ label, required, error, hint, className = "", children }) {
  return (
    <label className={`block ${className}`} data-field-error={error ? "" : undefined}>
      <span className="mb-1 block text-xs font-semibold text-navy-800/70">
        {label} {required && <span className="text-coral-500">*</span>}
      </span>
      <div className={error ? "[&_input]:!border-coral-500 [&_select]:!border-coral-500 [&_textarea]:!border-coral-500" : ""}>{children}</div>
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-coral-600">
          <AlertCircle size={12} className="shrink-0" /> {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-navy-800/45">{hint}</span>
      )}
    </label>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[150] flex justify-end bg-navy-950/40 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex h-full w-full flex-col bg-white shadow-card ${wide ? "max-w-3xl" : "max-w-xl"}`}>
        <div className="flex items-start justify-between gap-3 border-b border-navy-900/8 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl text-navy-900">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-navy-800/55">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-navy-800/40 hover:bg-sand-100 hover:text-navy-900">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-navy-900/8 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export const SELLER_STATUS = {
  pending: { label: "Pending approval", cls: "bg-amber-500/15 text-amber-700" },
  approved: { label: "Approved", cls: "bg-teal-500/15 text-teal-600" },
  rejected: { label: "Rejected", cls: "bg-coral-500/10 text-coral-600" },
  suspended: { label: "Suspended", cls: "bg-navy-900/10 text-navy-800/70" },
};

export const CHARGE_STATUS = {
  unpaid: { label: "Unpaid", cls: "bg-coral-500/10 text-coral-600" },
  submitted: { label: "Payment submitted", cls: "bg-amber-500/15 text-amber-700" },
  paid: { label: "Paid", cls: "bg-teal-500/15 text-teal-600" },
  waived: { label: "Waived", cls: "bg-navy-900/8 text-navy-800/60" },
};

export const CHARGE_TYPE_LABELS = { visit: "Per visit", lead: "Per lead", deal: "Per deal", other: "Other" };
export const PAYMENT_METHOD_LABELS = { upi: "UPI", bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque", other: "Other" };
export const SELLER_TYPE_LABELS = { owner: "Owner", agent: "Agent / broker", builder: "Builder" };

export function Badge({ meta }) {
  if (!meta) return null;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>;
}

export function useMoney() {
  const { currency_symbol: symbol = "₹" } = useSiteSettings();
  return (n) => `${symbol}${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDay(value) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function scrollToFirstError() {
  setTimeout(() => document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
}
