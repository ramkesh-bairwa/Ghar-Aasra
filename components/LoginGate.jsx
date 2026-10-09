"use client";

import { useEffect, useState } from "react";
import { Lock, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import AuthModal from "@/components/AuthModal";

const UNLOCKS = [
  "Full property details & documents",
  "All amenities & premium features",
  "Price insights & loan planner",
  "Exact location & commute times",
  "Agent contact & free visit booking",
];

// Everything below the property banner is blurred for signed-out visitors,
// with a sign-in card on top; signing in (in a popup) unlocks it in place.
// `unlockedExtras` render only once signed in (e.g. the visit popup, so it
// never stacks on top of this card).
export default function LoginGate({ children, unlockedExtras = null }) {
  const { user, loading } = useAuth();
  const [modal, setModal] = useState(null);
  // The sign-in card slides in 1 second after the page loads, and stays.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    const timer = setTimeout(() => setRevealed(true), 1000);
    return () => clearTimeout(timer);
  }, [loading, user]);

  if (user) {
    return (
      <>
        {children}
        {unlockedExtras}
      </>
    );
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none max-h-[1100px] select-none overflow-hidden blur-xl print:hidden">
        {children}
      </div>

      {!loading && (
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-sand-50/60 via-sand-50/85 to-sand-50">
          <div className="sticky top-[110px] flex justify-center px-4 pt-10">
            <div
              className={`w-full max-w-lg rounded-[1.6rem] transition-all duration-700 ease-out ${
                revealed ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-16 scale-95 opacity-0"
              }`}
            >
            <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_40px_80px_-30px_rgba(15,27,45,0.5)] ring-1 ring-navy-900/5">
              <div className="relative bg-gradient-to-br from-navy-900 to-navy-950 px-7 pb-7 pt-8 text-white">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-teal-500/25 blur-2xl" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500">
                  <Lock size={22} />
                </span>
                <h2 className="relative mt-4 font-display text-2xl">Sign in to see everything about this home</h2>
                <p className="relative mt-1 text-sm text-white/65">Free, and takes about 10 seconds with your email or phone.</p>
              </div>
              <div className="p-7">
                <ul className="space-y-2.5">
                  {UNLOCKS.map((u) => (
                    <li key={u} className="flex items-center gap-2.5 text-sm text-navy-800/80">
                      <CheckCircle2 size={17} className="shrink-0 text-teal-600" /> {u}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  <button type="button" onClick={() => setModal("login")} className="btn-primary py-3.5">
                    Sign in <ArrowRight size={16} />
                  </button>
                  <button type="button" onClick={() => setModal("register")} className="btn-outline py-3.5">
                    Create free account
                  </button>
                </div>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-navy-800/50">
                  <Phone size={12} /> No password? Sign in with a one-time code on your phone.
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal open={!!modal} mode={modal || "login"} onClose={() => setModal(null)} />
    </div>
  );
}
