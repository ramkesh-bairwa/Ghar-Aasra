import Link from "next/link";
import { Play, ArrowRight, Heart, Eye } from "lucide-react";
import { listPublicReels } from "@/lib/reels";

// Homepage strip of the latest / featured reels. Tapping one opens the
// full-screen feed starting at that reel.
export default async function ReelsStrip({ title, subtitle }) {
  const reels = await listPublicReels({ limit: 10 });
  if (!reels.length) return null;
  return (
    <section className="overflow-hidden bg-navy-950 py-16 text-white">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-[15px] text-white/60">{subtitle}</p>}
          </div>
          <Link href="/reels" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15">
            Watch all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="-mx-5 mt-7 flex snap-x gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:-mx-8 md:px-8 [&::-webkit-scrollbar]:hidden">
          {reels.map((r) => (
            <Link key={r.id} href={`/reels?start=${r.id}`} className="group relative aspect-[9/16] w-[170px] shrink-0 snap-start overflow-hidden rounded-2xl bg-navy-900 ring-1 ring-white/10 sm:w-[200px]">
              {r.poster_url ? (
                <img src={r.poster_url} alt={r.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <video src={`${r.video_url}#t=0.5`} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
              <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform group-hover:scale-110">
                <Play size={20} fill="currentColor" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="line-clamp-2 text-sm font-semibold leading-snug">{r.title}</div>
                <div className="mt-1 flex gap-3 text-[11px] text-white/70">
                  <span className="flex items-center gap-1"><Eye size={11} /> {r.views}</span>
                  <span className="flex items-center gap-1"><Heart size={11} /> {r.likes}</span>
                  {r.city && <span className="truncate">{r.city}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
