"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Plus, Eye, Heart, Building2, Inbox, ArrowUpRight, ArrowDownRight, Phone, MessageCircle,
  TrendingUp, Wand2, ChevronRight, ImagePlus, Video, MapPin, FileText, ListChecks, Trophy, Rocket, Camera,
} from "lucide-react";
import {
  LEAD_STAGE, LEAD_TYPES, LISTING_STATUS, parseDate, timeAgo, formatPrice, leadsFor, strengthTone, Initial,
} from "./vendorShared";

const CHART = { enquiry: "#14b8ac", callback: "#f59e0b", visit: "#0f1b2d", visit_request: "#f2733d" };
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Maps a listing tip to the wizard step that fixes it.
export function tipStep(tip = "") {
  const t = tip.toLowerCase();
  if (/photo|video|floor plan|brochure|360|tour/.test(t)) return "media";
  if (/description|title/.test(t)) return "basics";
  if (/amenit/.test(t)) return "amenities";
  if (/location|pin|map/.test(t)) return "location";
  return "basics";
}
const TIP_ICON = { media: ImagePlus, basics: FileText, amenities: ListChecks, location: MapPin };

function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-navy-900">{title}</h3>
            {subtitle && <p className="text-xs text-navy-800/50">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Kpi({ Icon, label, value, delta, deltaLabel, tone }) {
  const up = delta > 0;
  const flat = !delta;
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-soft ring-1 ring-navy-900/5 transition-all hover:-translate-y-0.5 hover:shadow-card">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-60 blur-2xl ${tone.glow}`} />
      <div className="relative flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone.icon}`}>
          <Icon size={20} />
        </span>
        {deltaLabel && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              flat ? "bg-navy-900/5 text-navy-800/50" : up ? "bg-teal-500/10 text-teal-700" : "bg-coral-500/10 text-coral-600"
            }`}
          >
            {!flat && (up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
            {deltaLabel}
          </span>
        )}
      </div>
      <div className="relative mt-4 font-display text-3xl text-navy-900">{value}</div>
      <div className="relative text-sm text-navy-800/55">{label}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-xl bg-navy-950 px-3 py-2 text-xs text-white shadow-card">
      <div className="mb-1 font-semibold">{label} · {total} lead{total === 1 ? "" : "s"}</div>
      {payload.filter((p) => p.value).map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5 text-white/75">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} /> {LEAD_TYPES[p.dataKey]?.label}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function StudioOverview({ user, properties, leads, symbol, onNavigate }) {
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const m = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { key: dayKey(d), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), enquiry: 0, callback: 0, visit: 0, visit_request: 0 };
    });
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
    const weekAgo = Date.now() - 7 * 86400000;
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    let thisWeek = 0;
    let lastWeek = 0;
    const byType = { enquiry: 0, callback: 0, visit: 0, visit_request: 0 };
    for (const l of leads) {
      const d = parseDate(l.createdAt);
      if (!d) continue;
      byType[l.type] = (byType[l.type] || 0) + 1;
      const slot = byKey[dayKey(d)];
      if (slot) slot[l.type] = (slot[l.type] || 0) + 1;
      if (d.getTime() >= weekAgo) thisWeek++;
      else if (d.getTime() >= twoWeeksAgo) lastWeek++;
    }
    const live = properties.filter((p) => ["published", "under_offer"].includes(p.status)).length;
    const views = properties.reduce((s, p) => s + (p.views || 0), 0);
    const saves = properties.reduce((s, p) => s + (p.saves || 0), 0);
    const newLeads = leads.filter((l) => (LEAD_STAGE[l.status] || "new") === "new").length;
    const avgStrength = properties.length ? Math.round(properties.reduce((s, p) => s + (p.strength || 0), 0) / properties.length) : 0;
    const top = [...properties].sort((a, b) => b.views + leadsFor(b) * 10 - (a.views + leadsFor(a) * 10)).slice(0, 4);
    const health = [...properties].filter((p) => p.tips?.length).sort((a, b) => (a.strength || 0) - (b.strength || 0)).slice(0, 4);
    const pie = Object.entries(byType).filter(([, v]) => v).map(([k, v]) => ({ key: k, name: LEAD_TYPES[k]?.label || k, value: v }));
    return { days, thisWeek, lastWeek, live, views, saves, newLeads, avgStrength, top, health, pie };
  }, [properties, leads]);

  const leadDelta = m.thisWeek - m.lastWeek;
  const recent = leads.slice(0, 5);
  const hero = m.top[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 p-6 text-white shadow-card md:p-8">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-teal-500/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-coral-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="relative grid items-center gap-6 md:grid-cols-[1.4fr,1fr]">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">
              {greeting}, <span className="bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">{firstName}</span> 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/65 md:text-base">
              {m.newLeads
                ? `${m.newLeads} buyer${m.newLeads === 1 ? " is" : "s are"} waiting to hear from you. Replying within an hour wins most deals.`
                : properties.length
                  ? "You're all caught up. Fresh photos and a video keep your listings at the top of search."
                  : "List your first property in a few minutes. It's free, and buyers can book visits right away."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/vendor/new" className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-teal-400">
                <Plus size={16} /> Add property
              </Link>
              {m.newLeads > 0 && (
                <button type="button" onClick={() => onNavigate("leads")} className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-600">
                  <Inbox size={16} /> Reply to {m.newLeads}
                </button>
              )}
              <button type="button" onClick={() => onNavigate("analytics")} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/15">
                <TrendingUp size={16} /> See analytics
              </button>
            </div>
          </div>

          {hero ? (
            <Link href={`/vendor/properties/${hero.id}/edit`} className="group relative hidden overflow-hidden rounded-3xl ring-1 ring-white/15 md:block">
              {hero.image ? (
                <img src={hero.image} alt="" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-white/5"><Building2 size={32} className="text-white/30" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-navy-950">
                <Trophy size={12} /> Top listing
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="truncate font-display text-lg">{hero.title}</div>
                <div className="mt-1 flex gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1"><Eye size={12} /> {hero.views}</span>
                  <span className="flex items-center gap-1"><Inbox size={12} /> {leadsFor(hero)}</span>
                  <span className="flex items-center gap-1"><Heart size={12} /> {hero.saves}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="hidden grid-cols-3 gap-3 md:grid">
              {[
                { I: ListChecks, t: "Add details" },
                { I: Camera, t: "Upload photos" },
                { I: Rocket, t: "Go live" },
              ].map(({ I, t }, i) => (
                <div key={t} className="rounded-2xl bg-white/[0.07] p-4 text-center ring-1 ring-white/10">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500"><I size={18} /></span>
                  <div className="mt-2 text-[11px] text-white/50">Step {i + 1}</div>
                  <div className="text-xs font-semibold">{t}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi Icon={Building2} label="Live listings" value={m.live} deltaLabel={`${properties.length} total`} delta={0} tone={{ icon: "bg-teal-500/10 text-teal-600", glow: "bg-teal-400/30" }} />
        <Kpi Icon={Eye} label="Total views" value={m.views.toLocaleString()} tone={{ icon: "bg-sky-500/10 text-sky-600", glow: "bg-sky-400/30" }} />
        <Kpi
          Icon={Inbox}
          label="Leads this week"
          value={m.thisWeek}
          delta={leadDelta}
          deltaLabel={m.lastWeek || m.thisWeek ? `${leadDelta >= 0 ? "+" : ""}${leadDelta} vs last wk` : null}
          tone={{ icon: "bg-coral-500/10 text-coral-600", glow: "bg-coral-400/30" }}
        />
        <Kpi Icon={Heart} label="Saved by buyers" value={m.saves} tone={{ icon: "bg-pink-500/10 text-pink-600", glow: "bg-pink-400/30" }} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
        <Card
          title="Lead activity"
          subtitle="Enquiries, callbacks and visits over the last 30 days"
          action={<span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-navy-800/70">{leads.length} total</span>}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,27,45,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(15,27,45,0.45)" }} tickLine={false} axisLine={false} interval={6} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(15,27,45,0.45)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(20,184,172,0.08)", radius: 6 }} />
                {Object.entries(CHART).map(([k, c], i, all) => (
                  <Bar key={k} dataKey={k} stackId="1" fill={c} radius={i === all.length - 1 ? [5, 5, 0, 0] : 0} maxBarSize={18} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-navy-800/60">
            {Object.entries(CHART).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {LEAD_TYPES[k].label}</span>
            ))}
          </div>
        </Card>

        <Card title="Where leads come from" subtitle="All time, by type">
          {m.pie.length ? (
            <div className="flex flex-col items-center">
              <div className="relative h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={m.pie} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none">
                      {m.pie.map((p) => <Cell key={p.key} fill={CHART[p.key]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl text-navy-900">{leads.length}</span>
                  <span className="text-[11px] uppercase tracking-wider text-navy-800/45">leads</span>
                </div>
              </div>
              <div className="mt-4 w-full space-y-2">
                {m.pie.map((p) => (
                  <div key={p.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-navy-800/70"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART[p.key] }} /> {p.name}</span>
                    <span className="font-semibold text-navy-900">{p.value} <span className="text-xs font-normal text-navy-800/40">({Math.round((p.value / leads.length) * 100)}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-center text-sm text-navy-800/50">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-100"><Inbox size={24} className="text-navy-800/30" /></span>
              No leads yet. They&apos;ll show up here as buyers get in touch.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent leads */}
        <Card
          title="Recent leads"
          subtitle="Newest buyer enquiries and visit bookings"
          action={leads.length > 0 && (
            <button type="button" onClick={() => onNavigate("leads")} className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700">
              View all <ChevronRight size={15} />
            </button>
          )}
        >
          {recent.length ? (
            <div className="divide-y divide-navy-900/5">
              {recent.map((l) => {
                const type = LEAD_TYPES[l.type] || LEAD_TYPES.enquiry;
                const isNew = (LEAD_STAGE[l.status] || "new") === "new";
                const digits = (l.phone || "").replace(/[^\d]/g, "");
                return (
                  <div key={l.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative">
                      <Initial name={l.name} className="h-10 w-10 text-sm" />
                      {isNew && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-coral-500 ring-2 ring-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-navy-900">{l.name || "Guest"}</span>
                        <span className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 sm:flex ${type.className}`}>
                          <type.Icon size={10} /> {type.label}
                        </span>
                      </div>
                      <div className="truncate text-xs text-navy-800/50">{l.propertyTitle} · {timeAgo(l.createdAt)}</div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {l.phone && (
                        <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-navy-900 hover:bg-teal-500 hover:text-white" aria-label="Call">
                          <Phone size={15} />
                        </a>
                      )}
                      {digits && (
                        <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C4B] hover:bg-[#25D366] hover:text-white" aria-label="WhatsApp">
                          <MessageCircle size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-navy-800/50">No leads yet.</p>
          )}
        </Card>

        {/* Top listings */}
        <Card
          title="Top listings"
          subtitle="Ranked by views and leads"
          action={properties.length > 0 && (
            <button type="button" onClick={() => onNavigate("listings")} className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700">
              All listings <ChevronRight size={15} />
            </button>
          )}
        >
          {m.top.length ? (
            <div className="space-y-3">
              {m.top.map((p, i) => {
                const status = LISTING_STATUS[p.status] || LISTING_STATUS.draft;
                return (
                  <Link key={p.id} href={`/vendor/properties/${p.id}/edit`} className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-sand-50">
                    <span className="w-5 text-center font-display text-lg text-navy-800/30">{i + 1}</span>
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                      {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <Building2 className="m-auto mt-4 text-navy-800/25" size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-navy-900">{p.title}</div>
                      <div className="flex items-center gap-2 text-xs text-navy-800/50">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label} · {formatPrice(p, symbol)}
                      </div>
                    </div>
                    <div className="hidden gap-4 text-right text-xs sm:flex">
                      <div><div className="font-semibold text-navy-900">{p.views}</div><div className="text-navy-800/45">views</div></div>
                      <div><div className="font-semibold text-navy-900">{leadsFor(p)}</div><div className="text-navy-800/45">leads</div></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-navy-800/50">You haven&apos;t listed anything yet.</p>
              <Link href="/vendor/new" className="btn-primary mt-4"><Plus size={16} /> List a property</Link>
            </div>
          )}
        </Card>
      </div>

      {/* Listing health */}
      {m.health.length > 0 && (
        <Card
          title="Make your listings shine"
          subtitle={`Average listing strength ${m.avgStrength}%. Each fix below takes about a minute.`}
          action={<span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700"><Wand2 size={13} /> Quick wins</span>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {m.health.map((p) => {
              const tone = strengthTone(p.strength || 0);
              const step = tipStep(p.tips[0]);
              const TipIcon = TIP_ICON[step] || Video;
              return (
                <Link
                  key={p.id}
                  href={`/vendor/properties/${p.id}/edit?step=${step}`}
                  className="group flex items-center gap-4 rounded-2xl bg-sand-50 p-4 ring-1 ring-navy-900/5 transition-all hover:bg-white hover:shadow-card hover:ring-teal-500/30"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-navy-900/5 group-hover:bg-teal-500 group-hover:text-white">
                    <TipIcon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-navy-900">{p.tips[0]}</div>
                    <div className="truncate text-xs text-navy-800/50">{p.title}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-900/8">
                        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${p.strength || 0}%` }} />
                      </div>
                      <span className={`text-xs font-semibold ${tone.text}`}>{p.strength || 0}%</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-navy-800/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
