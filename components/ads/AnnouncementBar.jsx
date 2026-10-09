"use client";

import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";

// Thin strip above the header (Admin → Ads & Banners → "Top announcement bar").
// Rotates when there are several; dismissible for the session.
export default function AnnouncementBar() {
  const [ads, setAds] = useState([]);
  const [i, setI] = useState(0);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    try { if (sessionStorage.getItem("announcement_closed")) return; } catch {}
    fetch("/api/ads?placement=announcement_bar")
      .then((r) => r.json())
      .then(({ ads }) => {
        if (ads?.length) {
          setAds(ads);
          setClosed(false);
          ads.forEach((a) => fetch(`/api/ads/${a.id}/view`, { method: "POST", keepalive: true }).catch(() => {}));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ads.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (closed || !ads.length) return null;
  const ad = ads[i];
  const content = (
    <>
      <Megaphone size={14} className="shrink-0 text-teal-300" />
      <span className="truncate font-medium">{ad.headline}</span>
      {ad.cta_label && ad.link_url && <span className="shrink-0 font-semibold text-teal-300 underline-offset-2 group-hover:underline">{ad.cta_label} →</span>}
    </>
  );
  return (
    <div className="relative z-[60] bg-navy-950 text-[13px] text-white">
      <div className="container-page flex h-9 items-center justify-center gap-2 pr-8">
        {ad.link_url ? (
          <a href={`/api/ads/${ad.id}/click`} target={ad.open_new_tab ? "_blank" : undefined} rel="noopener noreferrer sponsored" className="group flex min-w-0 items-center gap-2">
            {content}
          </a>
        ) : (
          <div className="flex min-w-0 items-center gap-2">{content}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => { setClosed(true); try { sessionStorage.setItem("announcement_closed", "1"); } catch {} }}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
