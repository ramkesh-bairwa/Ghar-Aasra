"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper } from "lucide-react";

// Homepage blog slider. Swipe on touch, arrows on desktop, auto-advances
// (paused while hovered or focused). Count and autoplay are set in
// Site Settings → Homepage sections.
export default function NewsSection({ posts = [], title, subtitle, autoplay = true }) {
  const track = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [paused, setPaused] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const go = useCallback((to) => {
    const el = track.current;
    if (!el) return;
    const max = Math.max(0, Math.ceil(el.scrollWidth / el.clientWidth) - 1);
    const target = to > max ? 0 : to < 0 ? max : to;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoplay || paused || pages < 2) return undefined;
    const t = setInterval(() => go(page + 1), 5500);
    return () => clearInterval(t);
  }, [autoplay, paused, pages, page, go]);

  if (!posts.length) return null;

  return (
    <section className="bg-sand-50 py-16">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-navy-900 md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-[15px] text-navy-800/60">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/blog" className="mr-2 hidden items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline sm:inline-flex">
              All articles <ArrowRight size={15} />
            </Link>
            {pages > 1 && (
              <>
                <button type="button" onClick={() => go(page - 1)} aria-label="Previous articles" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-900 shadow-soft ring-1 ring-navy-900/10 transition-colors hover:bg-navy-900 hover:text-white">
                  <ArrowLeft size={17} />
                </button>
                <button type="button" onClick={() => go(page + 1)} aria-label="Next articles" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-900 shadow-soft ring-1 ring-navy-900/10 transition-colors hover:bg-navy-900 hover:text-white">
                  <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
        </div>

        <div
          ref={track}
          onScroll={measure}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          className="-mx-3 mt-8 flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carousel"
        >
          {posts.map((n) => (
            <div key={n.slug} className="w-[85%] shrink-0 snap-start px-3 sm:w-1/2 lg:w-1/3 xl:w-1/4">
              <Link href={`/blog/${n.slug}`} className="card-surface group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="relative h-44 overflow-hidden bg-navy-900">
                  {n.image ? (
                    <img src={n.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/30"><Newspaper size={34} /></div>
                  )}
                  {n.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-teal-700 backdrop-blur">{n.category}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 font-display text-[17px] leading-snug text-navy-900 transition-colors group-hover:text-teal-600">{n.title}</h3>
                  {n.excerpt && <p className="mt-2 line-clamp-2 text-sm text-navy-800/60">{n.excerpt}</p>}
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-navy-800/50">
                    <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {n.date}</span>
                    <span className="flex items-center gap-1 font-semibold text-teal-600">Read <ArrowRight size={13} /></span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="mt-5 flex justify-center gap-1.5">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === page ? "w-7 bg-teal-500" : "w-2 bg-navy-900/15 hover:bg-navy-900/30"}`}
              />
            ))}
          </div>
        )}
        <Link href="/blog" className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-teal-600 sm:hidden">
          All articles <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
