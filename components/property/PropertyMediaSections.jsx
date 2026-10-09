import { PlayCircle, Rotate3d, FileText, Download, ExternalLink, LayoutPanelTop, Map as MapIcon } from "lucide-react";
import { getVideoEmbed } from "@/lib/videoEmbed";

const isPdf = (url) => /\.pdf(\?|#|$)/i.test(url || "");

function SectionHeading({ Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-xl text-navy-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-navy-800/55">{subtitle}</p>}
      </div>
    </div>
  );
}

function ResponsiveFrame({ src, title, allow }) {
  return (
    <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-2xl bg-navy-950 ring-1 ring-navy-900/10">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow={allow}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

export function VideoTourSection({ videoUrl, poster, title }) {
  const video = getVideoEmbed(videoUrl);
  if (!video) return null;
  const provider = video.kind === "youtube" ? "YouTube" : video.kind === "vimeo" ? "Vimeo" : null;
  return (
    <div id="video-tour" className="card-surface mt-6 scroll-mt-40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading Icon={PlayCircle} title="Video tour" subtitle="Walk through the home before you visit." />
        {provider && (
          <span className="badge-pill bg-navy-900/8 text-navy-800/70">via {provider}</span>
        )}
      </div>
      {video.kind === "file" ? (
        <div className="mt-5 overflow-hidden rounded-2xl bg-navy-950 ring-1 ring-navy-900/10">
          <video
            src={video.embedUrl}
            controls
            playsInline
            preload="metadata"
            poster={poster}
            className="aspect-video w-full bg-navy-950 object-contain"
          >
            Your browser can&apos;t play this video. <a href={video.embedUrl}>Download it</a> instead.
          </video>
        </div>
      ) : (
        <ResponsiveFrame
          src={video.embedUrl}
          title={`Video tour of ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        />
      )}
    </div>
  );
}

export function VirtualTourSection({ url, title }) {
  if (!url) return null;
  return (
    <div id="virtual-tour" className="card-surface mt-6 scroll-mt-40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading Icon={Rotate3d} title="360° virtual tour" subtitle="Drag to look around. Use full screen for the best view." />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          <ExternalLink size={15} /> Open full screen
        </a>
      </div>
      <ResponsiveFrame
        src={url}
        title={`360° virtual tour of ${title}`}
        allow="accelerometer; gyroscope; xr-spatial-tracking; vr; fullscreen"
      />
    </div>
  );
}

function FileCard({ href, label, hint, Icon = FileText, download = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...(download ? { download: "" } : {})}
      className="group flex items-center gap-3 rounded-2xl bg-sand-50 p-4 ring-1 ring-navy-900/5 transition-all hover:bg-white hover:shadow-card hover:ring-teal-500/30"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-navy-900/5 transition-colors group-hover:bg-teal-500 group-hover:text-white">
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-navy-900">{label}</div>
        <div className="text-xs text-navy-800/55">{hint}</div>
      </div>
      {download ? (
        <Download size={18} className="shrink-0 text-navy-800/40 group-hover:text-teal-600" />
      ) : (
        <ExternalLink size={18} className="shrink-0 text-navy-800/40 group-hover:text-teal-600" />
      )}
    </a>
  );
}

function PlanTile({ url, label, Icon }) {
  if (isPdf(url)) {
    return <FileCard href={url} label={label} hint="PDF document · opens in a new tab" Icon={Icon} />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl bg-sand-50 ring-1 ring-navy-900/5 transition-all hover:shadow-card hover:ring-teal-500/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <Icon size={16} className="text-teal-600" /> {label}
        </span>
        <span className="flex items-center gap-1 text-xs text-navy-800/50 group-hover:text-teal-600">
          View full size <ExternalLink size={13} />
        </span>
      </div>
    </a>
  );
}

export function DocumentsSection({ floorPlanUrl, sitePlanUrl, brochureUrl }) {
  const plans = [
    floorPlanUrl && { url: floorPlanUrl, label: "Floor plan", Icon: LayoutPanelTop },
    sitePlanUrl && { url: sitePlanUrl, label: "Site plan", Icon: MapIcon },
  ].filter(Boolean);
  if (!plans.length && !brochureUrl) return null;
  return (
    <div id="documents" className="card-surface mt-6 scroll-mt-40 p-6">
      <SectionHeading Icon={FileText} title="Floor plan & documents" subtitle="Layouts and paperwork shared by the seller." />
      {plans.length > 0 && (
        <div className={`mt-5 grid gap-4 ${plans.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {plans.map((p) => (
            <PlanTile key={p.label} {...p} />
          ))}
        </div>
      )}
      {brochureUrl && (
        <div className="mt-4">
          <FileCard
            href={brochureUrl}
            label="Property brochure"
            hint={isPdf(brochureUrl) ? "PDF · download for offline viewing" : "Image · download for offline viewing"}
            Icon={FileText}
            download
          />
        </div>
      )}
    </div>
  );
}
