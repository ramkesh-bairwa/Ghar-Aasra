"use client";

import { useEffect, useRef, useState } from "react";
import { getBackgroundEmbed } from "@/lib/videoEmbed";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop";

// Homepage hero background, chosen in Site Settings → Homepage hero:
// an image, an uploaded video, or a YouTube / Vimeo link. Videos play muted
// on loop over the image (which shows while they load), and can be turned
// off on phones to save data.
export default function HeroBackground({ type, imageUrl, videoUrl, youtubeUrl, videoOnMobile = true }) {
  const embed = type === "youtube" ? getBackgroundEmbed(youtubeUrl) : null;
  const image = imageUrl || (embed?.kind === "youtube" ? `https://i.ytimg.com/vi/${embed.id}/maxresdefault.jpg` : FALLBACK_IMAGE);
  // Hide the video on small screens when the admin turned mobile video off.
  const videoVisibility = videoOnMobile ? "" : "hidden md:block";

  return (
    <>
      <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      {type === "video" && videoUrl && (
        <video
          src={videoUrl}
          poster={imageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover ${videoVisibility}`}
        />
      )}
      {embed && <EmbedCover embed={embed} className={videoVisibility} />}
    </>
  );
}

// A 16:9 iframe scaled to cover the hero like object-fit: cover, faded in
// once the player has had a moment to start (hides YouTube's loading flash).
function EmbedCover({ embed, className }) {
  const box = useRef(null);
  const [size, setSize] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.max(width, (height * 16) / 9);
      setSize({ w: w * 1.02, h: (w * 1.02 * 9) / 16 });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {size && (
        <iframe
          src={embed.src}
          title="Background video"
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => setTimeout(() => setReady(true), 1200)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-1000"
          style={{ width: size.w, height: size.h, opacity: ready ? 1 : 0 }}
        />
      )}
    </div>
  );
}
