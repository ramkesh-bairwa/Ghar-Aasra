"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AuthPanel } from "@/components/AuthForm";
import { useAuth } from "@/lib/useAuth";

// Sign in / sign up without leaving the current page.
export default function AuthModal({ open, onClose, mode = "login" }) {
  const { refresh } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[1.6rem] bg-white p-7 shadow-card sm:rounded-[1.6rem] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-navy-800/50 hover:bg-sand-100 hover:text-navy-900"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <AuthPanel
          mode={mode}
          inModal
          onSuccess={async () => {
            await refresh();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
