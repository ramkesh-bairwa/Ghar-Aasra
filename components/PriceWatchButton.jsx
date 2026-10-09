"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

// "Tell me if the price drops" on a property page.
export default function PriceWatchButton({ propertyId, className = "" }) {
  const { user, loading } = useAuth();
  const { alerts_enabled } = useSiteSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [watching, setWatching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`/api/price-watch?propertyId=${propertyId}`).then((r) => r.json()).then((d) => setWatching(!!d.watching)).catch(() => {});
  }, [user, propertyId]);

  if (alerts_enabled === "false") return null;

  async function toggle() {
    if (loading) return;
    if (!user) return router.push(`/login?next=${encodeURIComponent(pathname)}`);
    setBusy(true);
    const res = await fetch("/api/price-watch", {
      method: watching ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setWatching(!!json.watching);
      setNote(json.watching ? "We'll alert you if the price drops." : "Price alert removed.");
      setTimeout(() => setNote(""), 3000);
    } else setNote(json.error || "Something went wrong.");
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
          watching ? "bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/30 hover:bg-teal-500/15" : "bg-white text-navy-900 ring-1 ring-navy-900/15 hover:ring-teal-500"
        }`}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : watching ? <BellOff size={15} /> : <BellRing size={15} />}
        {watching ? "Watching price · stop alerts" : "Alert me if the price drops"}
      </button>
      {note && <p className="mt-1.5 text-center text-xs text-navy-800/55">{note}</p>}
    </div>
  );
}
