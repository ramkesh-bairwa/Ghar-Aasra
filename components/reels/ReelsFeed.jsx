"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Share2, Volume2, VolumeX, X, MapPin, CalendarPlus, ArrowRight, Eye, Loader2, Clapperboard, BedDouble } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n || 0));

// Full-screen vertical reels feed: snap scrolling, the reel in view plays
// (muted until the viewer turns sound on), double-tap or ♥ to like.
export default function ReelsFeed({ startId }) {
  const [reels, setReels] = useState(null);
  const [muted, setMuted] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/reels${startId ? `?start=${startId}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setReels(d.reels || []))
      .catch(() => setReels([]));
  }, [startId]);

  return (
    <div className="fixed inset-0 z-[90] bg-black">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        aria-label="Close reels"
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
      >
        <X size={20} />
      </button>
      <div className="pointer-events-none absolute inset-x-0 top-5 z-10 text-center font-display text-lg text-white/90">Reels</div>
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Turn sound on" : "Mute"}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {reels === null ? (
        <div className="flex h-full items-center justify-center text-white/60"><Loader2 className="animate-spin" /></div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
          <Clapperboard size={40} className="text-teal-400" />
          <h1 className="font-display text-2xl">No reels yet</h1>
          <p className="max-w-xs text-sm text-white/60">Video tours will appear here soon. Meanwhile, browse all properties.</p>
          <Link href="/properties" className="btn-primary mt-2">Browse properties</Link>
        </div>
      ) : (
        <div className="h-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reels.map((r) => (
            <Reel key={r.id} reel={r} muted={muted} onUnmute={() => setMuted(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Reel({ reel, muted, onUnmute }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const viewed = useRef(false);
  const { user } = useAuth();
  const { currency_symbol: symbol = "₹" } = useSiteSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(reel.liked);
  const [likes, setLikes] = useState(reel.likes);
  const [burst, setBurst] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) {
          v.play().catch(() => {});
          if (!viewed.current) {
            viewed.current = true;
            fetch(`/api/reels/${reel.id}/view`, { method: "POST", keepalive: true }).catch(() => {});
          }
        } else {
          v.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reel.id]);

  async function like(forceOn = false) {
    if (!user) return router.push(`/login?next=${encodeURIComponent(pathname)}`);
    if (forceOn && liked) return;
    setLiked((l) => !l);
    setLikes((n) => n + (liked ? -1 : 1));
    const res = await fetch(`/api/reels/${reel.id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setLikes(d.likes);
    }
  }

  async function share() {
    const url = `${window.location.origin}/reels?start=${reel.id}`;
    if (navigator.share) {
      navigator.share({ title: reel.title, url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  const price = reel.price > 0 ? `${symbol}${Number(reel.price).toLocaleString("en-IN")}${reel.listing_type === "rent" ? "/mo" : ""}` : null;

  return (
    <section ref={ref} className="relative flex h-full snap-start snap-always items-center justify-center">
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.poster_url || undefined}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={() => (muted ? onUnmute() : videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause())}
        onDoubleClick={() => { like(true); setBurst(true); setTimeout(() => setBurst(false), 700); }}
        className="h-full w-full max-w-[520px] object-cover sm:rounded-2xl"
      />
      {burst && <Heart size={110} className="pointer-events-none absolute text-white drop-shadow-2xl" fill="currentColor" style={{ animation: "celebrate-pop .6s ease-out both" }} />}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-1/2 max-w-[520px] bg-gradient-to-t from-black/85 via-black/30 to-transparent sm:rounded-b-2xl" />

      <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5 text-white sm:right-[calc(50%-260px+12px)]">
        <button type="button" onClick={() => like()} className="flex flex-col items-center gap-1" aria-label={liked ? "Unlike" : "Like"}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur ${liked ? "bg-coral-500" : "bg-white/15"}`}>
            <Heart size={22} fill={liked ? "currentColor" : "none"} />
          </span>
          <span className="text-xs font-semibold">{compact(likes)}</span>
        </button>
        <button type="button" onClick={share} className="flex flex-col items-center gap-1" aria-label="Share">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur"><Share2 size={20} /></span>
          <span className="text-xs font-semibold">{copied ? "Copied" : "Share"}</span>
        </button>
        <span className="flex flex-col items-center gap-1 text-white/80">
          <Eye size={18} />
          <span className="text-xs">{compact(reel.views)}</span>
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[520px] p-4 pb-6 pr-20 text-white">
        <h2 className="font-display text-xl leading-snug">{reel.title}</h2>
        {reel.property_slug && (
          <>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
              {price && <span className="font-semibold text-white">{price}</span>}
              {reel.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble size={14} /> {reel.bedrooms} BHK</span>}
              {(reel.locality || reel.city) && <span className="flex items-center gap-1"><MapPin size={14} /> {[reel.locality, reel.city].filter(Boolean).join(", ")}</span>}
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/properties/${reel.property_slug}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy-900">
                View property <ArrowRight size={15} />
              </Link>
              <Link href={`/properties/${reel.property_slug}/visit`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white">
                <CalendarPlus size={15} /> Book visit
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
