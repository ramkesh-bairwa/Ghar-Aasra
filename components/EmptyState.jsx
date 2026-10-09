import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

// Friendly "nothing here yet" panel: a large icon on layered teal rings,
// a heading, one line of guidance, and up to two next-step buttons.
// `compact` is for tight spots like the notification dropdown.
export default function EmptyState({ icon: Icon, title, text, primary, secondary, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-6 py-8" : "card-surface px-6 py-14 sm:py-16"}`}>
      <div className={`relative ${compact ? "mb-4" : "mb-6"}`}>
        <span className={`absolute inset-0 rounded-full bg-teal-500/5 ${compact ? "-m-3" : "-m-5"}`} />
        <span className={`absolute inset-0 rounded-full bg-teal-500/10 ${compact ? "-m-1.5" : "-m-2.5"}`} />
        <span
          className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-navy-900 text-white shadow-card ${
            compact ? "h-14 w-14" : "h-20 w-20"
          }`}
        >
          <Icon size={compact ? 24 : 34} strokeWidth={1.8} />
        </span>
        {!compact && (
          <>
            <Sparkles size={16} className="absolute -right-5 -top-3 text-coral-500" />
            <span className="absolute -left-4 bottom-1 h-2 w-2 rounded-full bg-amber-500" />
          </>
        )}
      </div>
      <h3 className={`font-display text-navy-900 ${compact ? "text-base" : "text-xl"}`}>{title}</h3>
      {text && <p className={`mt-1.5 max-w-sm text-navy-800/60 ${compact ? "text-xs" : "text-sm"}`}>{text}</p>}
      {(primary || secondary) && (
        <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? "mt-4" : "mt-6"}`}>
          {primary && (
            <Link href={primary.href} className={`btn-primary ${compact ? "px-4 py-2 text-xs" : ""}`}>
              {primary.label} <ArrowRight size={compact ? 13 : 16} />
            </Link>
          )}
          {secondary && (
            <Link href={secondary.href} className={`btn-outline ${compact ? "px-4 py-2 text-xs" : ""}`}>
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
