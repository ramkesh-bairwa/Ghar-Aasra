import {
  Building2, Home, KeyRound, BadgeCheck, UserCheck, MapPin, Map, Smile, Heart, Star, Award, Handshake, CalendarCheck, TrendingUp,
} from "lucide-react";
import { listStats } from "@/lib/queries";

// Icon keys selectable per stat in Admin → Homepage Stats.
const STAT_ICONS = {
  building: Building2, home: Home, key: KeyRound, verified: BadgeCheck, agent: UserCheck, city: MapPin, map: Map,
  clients: Smile, heart: Heart, star: Star, award: Award, handshake: Handshake, calendar: CalendarCheck, trending: TrendingUp,
};

// No icon chosen? Pick one from the label's wording.
function guessIcon(label = "") {
  const l = label.toLowerCase();
  if (/agent|broker|verified/.test(l)) return "verified";
  if (/cit|location|area|state/.test(l)) return "city";
  if (/client|customer|happy|famil|buyer/.test(l)) return "clients";
  if (/deal|sold|closed/.test(l)) return "handshake";
  if (/visit|booking/.test(l)) return "calendar";
  if (/rent/.test(l)) return "key";
  if (/review|rating/.test(l)) return "star";
  if (/year|award/.test(l)) return "award";
  return "building";
}

export default async function StatsBar() {
  const stats = await listStats();
  return (
    <section className="bg-sand-50 pt-28 md:pt-32">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 border-b border-navy-900/8 pb-14 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = STAT_ICONS[s.icon] || STAT_ICONS[guessIcon(s.label)];
          return (
            <div key={s.label} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/15 md:h-14 md:w-14">
                <Icon size={24} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="font-display text-3xl leading-none text-navy-900">{s.value}</div>
                <div className="mt-1.5 text-sm text-navy-800/60">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
