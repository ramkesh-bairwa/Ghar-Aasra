"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Images, PlayCircle, Lock } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import AuthModal from "@/components/AuthModal";

// Hero mosaic (one large photo + up to four thumbnails) that opens a
// full-screen lightbox. Arrow keys, Escape, and touch swipes all work.
// Signed-out visitors see only the cover photo; the rest unlock on sign-in.
export default function PropertyGallery({ images, title, hasVideo }) {
  const { user } = useAuth();
  const allPhotos = [...new Set(images.filter(Boolean))];
  const locked = !user;
  const photos = locked ? allPhotos.slice(0, 1) : allPhotos;
  const hiddenCount = allPhotos.length - photos.length;
  const [authOpen, setAuthOpen] = useState(false);
  const [index, setIndex] = useState(null); // null = closed
  const touchX = useRef(null);
  const open = index !== null;

  const go = useCallback((delta) => setIndex((i) => (i + delta + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  const thumbs = photos.slice(1, 5);

  return (
    <>
      <div className="container-page pt-6">
        <div className={`grid h-[300px] gap-2 overflow-hidden rounded-xl2 sm:h-[440px] ${thumbs.length ? "md:grid-cols-[2fr,1fr]" : ""}`}>
          <button type="button" onClick={() => (locked ? setAuthOpen(true) : setIndex(0))} className="group relative h-full w-full overflow-hidden">
            <img src={photos[0]} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </button>
          {thumbs.length > 0 && (
            <div className={`hidden gap-2 md:grid ${thumbs.length > 2 ? "grid-cols-2 grid-rows-2" : "grid-rows-2"}`}>
              {thumbs.map((src, i) => (
                <button key={src} type="button" onClick={() => setIndex(i + 1)} className="group relative h-full w-full overflow-hidden">
                  <img src={src} alt={`${title} photo ${i + 2}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="absolute -top-14 right-3 flex gap-2">
            {hasVideo && !locked && (
              <a href="#video-tour" className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-navy-900 shadow-card hover:bg-white">
                <PlayCircle size={15} /> Video tour
              </a>
            )}
            {locked ? (
              hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-navy-900/90 px-3.5 py-2 text-xs font-semibold text-white shadow-card backdrop-blur hover:bg-navy-900"
                >
                  <Lock size={14} /> Sign in to see {hiddenCount} more photo{hiddenCount > 1 ? "s" : ""}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-navy-900 shadow-card hover:bg-white"
              >
                <Images size={15} /> {photos.length > 1 ? `View all ${photos.length} photos` : "View photo"}
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {open && !locked && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-navy-950/95"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm text-white/70">
              {index + 1} / {photos.length}
            </span>
            <button type="button" onClick={() => setIndex(null)} aria-label="Close gallery" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <X size={20} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <img src={photos[index]} alt={`${title} photo ${index + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:left-6">
                  <ChevronLeft size={22} />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:right-6">
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4">
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition-opacity ${i === index ? "opacity-100 ring-teal-400" : "opacity-50 ring-transparent hover:opacity-80"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
