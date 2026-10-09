"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { AdCreative } from "./AdBanner";

// Popup banner: opens once per browser session, a few seconds after the
// visitor lands (delay set in Site Settings). Never on admin/seller screens.
export default function AdPopup() {
  const pathname = usePathname();
  const { ad_popup_delay_seconds } = useSiteSettings();
  const [ad, setAd] = useState(null);
  const [open, setOpen] = useState(false);
  const hidden = /^\/(admin|vendor|login|register)/.test(pathname || "");

  useEffect(() => {
    if (hidden) return undefined;
    let seen = false;
    try { seen = !!sessionStorage.getItem("ad_popup_seen"); } catch {}
    if (seen) return undefined;
    let timer;
    fetch("/api/ads?placement=popup")
      .then((r) => r.json())
      .then(({ ads }) => {
        if (!ads?.length) return;
        setAd(ads[0]);
        timer = setTimeout(() => {
          setOpen(true);
          try { sessionStorage.setItem("ad_popup_seen", "1"); } catch {}
        }, Math.max(0, Number(ad_popup_delay_seconds) || 8) * 1000);
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, [hidden, ad_popup_delay_seconds]);

  if (!open || !ad) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-950/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] shadow-card" style={{ animation: "celebrate-pop .3s ease-out both" }}>
        <AdCreative ad={ad} variant="card" />
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-soft hover:bg-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
