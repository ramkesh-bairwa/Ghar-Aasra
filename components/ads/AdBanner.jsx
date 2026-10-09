"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// Renders the live banners for one placement. Several banners rotate as a
// slider. Each one counts a view the first time it's on screen, and links go
// through /api/ads/<id>/click so clicks are counted too.
// variant: "wide" | "card" | "sidebar"
export default function AdBanner({ ads, variant = "wide", className = "" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = ads.length;

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(t);
  }, [count, paused]);

  if (!count) return null;
  const go = (d) => setIndex((i) => (i + d + count) % count);

  return (
    <div className={`relative ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative overflow-hidden rounded-[1.4rem] shadow-card">
        {ads.map((ad, i) => (
          <div key={ad.id} className={i === index ? "relative" : "pointer-events-none absolute inset-0 opacity-0"} style={{ transition: "opacity .6s" }} aria-hidden={i !== index}>
            <AdCreative ad={ad} variant={variant} visible={i === index} />
          </div>
        ))}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-navy-900 shadow-soft hover:bg-white sm:flex">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-navy-900 shadow-soft hover:bg-white sm:flex">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {ads.map((ad, i) => (
                <button key={ad.id} type="button" onClick={() => setIndex(i)} aria-label={`Banner ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/55"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ASPECT = {
  wide: "aspect-[16/9] sm:aspect-[4/1]",
  card: "aspect-[4/3]",
  sidebar: "aspect-[4/5]",
};

export function AdCreative({ ad, variant = "wide", visible = true }) {
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!visible || counted.current || !ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          fetch(`/api/ads/${ad.id}/view`, { method: "POST", keepalive: true }).catch(() => {});
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ad.id, visible]);

  const hasText = ad.headline || ad.subtext || ad.cta_label;
  const href = ad.link_url ? `/api/ads/${ad.id}/click` : null;
  const Wrapper = href ? "a" : "div";
  const linkProps = href ? { href, target: ad.open_new_tab ? "_blank" : undefined, rel: ad.open_new_tab ? "noopener noreferrer sponsored" : "sponsored" } : {};

  return (
    <Wrapper ref={ref} {...linkProps} className={`group relative block w-full overflow-hidden bg-navy-900 ${ASPECT[variant] || ASPECT.wide}`}>
      {ad.media_type === "video" && ad.video_url ? (
        <video src={ad.video_url} poster={ad.image_url || undefined} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : ad.image_url ? (
        <picture>
          {ad.mobile_image_url && <source media="(max-width: 640px)" srcSet={ad.mobile_image_url} />}
          <img src={ad.image_url} alt={ad.headline || ad.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </picture>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-teal-600" />
      )}

      {hasText && (
        <div className={`absolute inset-0 flex flex-col justify-end p-5 sm:p-7 ${variant === "wide" ? "bg-gradient-to-r from-navy-950/80 via-navy-950/35 to-transparent sm:justify-center" : "bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent"}`}>
          <div className={variant === "wide" ? "max-w-lg" : ""}>
            {ad.headline && <div className={`font-display leading-tight text-white ${variant === "wide" ? "text-2xl sm:text-3xl" : "text-xl"}`}>{ad.headline}</div>}
            {ad.subtext && <p className="mt-1.5 text-sm text-white/75 sm:text-[15px]">{ad.subtext}</p>}
            {ad.cta_label && href && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors group-hover:bg-teal-600">
                {ad.cta_label} <ArrowRight size={15} />
              </span>
            )}
          </div>
        </div>
      )}
      <span className="absolute right-3 top-3 rounded-md bg-navy-950/45 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">Ad</span>
    </Wrapper>
  );
}
