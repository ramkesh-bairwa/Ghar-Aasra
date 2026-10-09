"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] rounded-xl2 border border-navy-900/10 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-navy-900">
        <ShieldCheck size={16} className="text-teal-600" />
        <span className="text-sm font-semibold">Cookie preferences</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-navy-800/60">
        We use cookies to improve your experience on this site. See our{" "}
        <a href="/privacy-policy" className="text-teal-600 underline underline-offset-2">
          Cookie Policy
        </a>
        .
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <button onClick={() => setVisible(false)} className="btn-primary w-full py-2 text-xs">
          Accept all cookies
        </button>
        <button onClick={() => setVisible(false)} className="btn-outline w-full py-2 text-xs">
          Essential only
        </button>
      </div>
    </div>
  );
}
