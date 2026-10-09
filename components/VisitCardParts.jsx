import { Building2, Clock } from "lucide-react";

// Shared visual pieces for the My Visits cards (booked visits + visit requests).

// Cover image with a soft bottom fade, or a branded gradient when the property
// has no photo. Children are overlaid (status pill, booking code, …).
export function VisitCover({ src, alt, children }) {
  return (
    <div className="relative h-44 overflow-hidden">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-teal-600">
          <Building2 size={40} strokeWidth={1.4} className="text-white/40" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/60 via-navy-950/0 to-navy-950/20" />
      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">{children}</div>
    </div>
  );
}

// Status pill sized for sitting on top of a photo.
export function StatusPill({ tone, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize shadow-soft backdrop-blur-md ${tone.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}

export function CodeChip({ code }) {
  if (!code) return null;
  return (
    <span title="Booking ID" className="rounded-md bg-navy-950/45 px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-white backdrop-blur-md">
      {code}
    </span>
  );
}

function relativeDay(when) {
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(when) - startOf(new Date())) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days < 0) return "Past";
  return null;
}

// Calendar-leaf style date block: month + day on the left, weekday/time and a
// "Today / In 3 days" hint on the right.
export function DateTile({ when, muted = false }) {
  if (Number.isNaN(when.getTime())) return null;
  const rel = relativeDay(when);
  return (
    <div className={`flex items-center gap-3 rounded-xl p-2.5 ${muted ? "bg-sand-100/70" : "bg-teal-500/[0.07]"}`}>
      <div className="w-12 shrink-0 overflow-hidden rounded-lg bg-white text-center shadow-soft ring-1 ring-navy-900/5">
        <div className={`py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${muted ? "bg-navy-800/50" : "bg-teal-500"}`}>
          {when.toLocaleDateString(undefined, { month: "short" })}
        </div>
        <div className="py-1 font-display text-xl leading-none text-navy-900">{when.getDate()}</div>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-navy-900">
          {when.toLocaleDateString(undefined, { weekday: "long" })}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-800/60">
          <Clock size={12} />
          {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          {rel && (
            <span className={`ml-1 rounded-full px-1.5 py-px text-[10px] font-semibold ${muted ? "bg-navy-900/8 text-navy-800/60" : "bg-teal-500 text-white"}`}>
              {rel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Section heading used by both lists: icon badge, title, subtitle, and
// optional stat chips on the right.
export function SectionHeading({ icon: Icon, title, subtitle, stats = [] }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-navy-900 text-white shadow-card">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="font-display text-2xl text-navy-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-navy-800/55">{subtitle}</p>}
        </div>
      </div>
      {stats.length > 0 && (
        <div className="flex gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white px-4 py-2 text-center shadow-soft ring-1 ring-navy-900/5">
              <div className={`font-display text-xl leading-none ${s.accent ? "text-teal-600" : "text-navy-900"}`}>{s.value}</div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-navy-800/50">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
