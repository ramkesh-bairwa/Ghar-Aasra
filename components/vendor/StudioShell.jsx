"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Inbox, BarChart3, Wallet, Clapperboard, Plus, Home, LogOut, Menu, X, Bell, ArrowUpRight, Lightbulb,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { LEAD_STAGE, Initial } from "./vendorShared";

export const STUDIO_VIEWS = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "listings", label: "My listings", Icon: Building2 },
  { key: "leads", label: "Leads", Icon: Inbox },
  { key: "analytics", label: "Analytics", Icon: BarChart3 },
  { key: "reels", label: "Reels", Icon: Clapperboard },
  { key: "payments", label: "Payments", Icon: Wallet },
];

const TIPS = [
  "Listings with 8+ photos get far more visits.",
  "Add a YouTube walkthrough — buyers love video.",
  "Reply to new leads within an hour.",
  "Pin the exact location to appear on map search.",
];

// Sidebar + top bar frame shared by every seller panel screen (dashboard
// views, new listing, edit listing). On the dashboard, `onNavigate` switches
// views in place; elsewhere the menu links back to /vendor?view=….
// Pass `counts` when the page already has them; otherwise they're fetched.
export default function StudioShell({ active, title, subtitle, counts: givenCounts, onNavigate, actions, children }) {
  const { user, logout } = useAuth();
  const { site_title, logo_url, logo_dark_url } = useSiteSettings();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tip, setTip] = useState(0);
  const [fetched, setFetched] = useState(null);

  useEffect(() => setTip(Math.floor(Math.random() * TIPS.length)), []);

  useEffect(() => {
    if (givenCounts) return;
    fetch("/api/vendor/overview", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFetched({
        listings: d.properties.length,
        leads: d.leads.filter((l) => (LEAD_STAGE[l.status] || "new") === "new").length,
        payments: d.unpaidCharges || 0,
      }))
      .catch(() => {});
  }, [givenCounts]);

  const counts = givenCounts || fetched || {};

  function go(key) {
    setMenuOpen(false);
    if (onNavigate) onNavigate(key);
    else router.push(key === "overview" ? "/vendor" : `/vendor?view=${key}`);
  }

  async function signOut() {
    await logout();
    router.push("/");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/vendor" className="flex items-center gap-2.5 px-2">
        {/* Sidebar is dark, so prefer the light-coloured logo. */}
        {logo_dark_url || logo_url ? (
          <img src={logo_dark_url || logo_url} alt={site_title} className="h-14 w-auto max-w-full object-contain" />
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-card">
              <Home size={19} />
            </span>
            <span className="min-w-0 truncate font-display text-lg text-white">{site_title}</span>
          </>
        )}
      </Link>

      <Link
        href="/vendor/new"
        onClick={() => setMenuOpen(false)}
        className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
          active === "new"
            ? "bg-white text-navy-900 shadow-card"
            : "bg-gradient-to-r from-teal-500 to-teal-400 text-white shadow-[0_12px_30px_-12px_rgba(20,184,172,0.8)]"
        }`}
      >
        <Plus size={17} /> Add property
      </Link>

      <nav className="mt-6 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Menu</div>
        {STUDIO_VIEWS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          const badge = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => go(key)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-400" />}
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-teal-500 text-white" : "bg-white/5 group-hover:bg-white/10"}`}>
                <Icon size={16} />
              </span>
              {label}
              {badge > 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${key === "leads" || key === "payments" ? "bg-coral-500 text-white" : "bg-white/10 text-white/70"}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <Lightbulb size={14} /> Seller tip
        </div>
        <p className="mt-1.5 text-sm leading-snug text-white/75">{TIPS[tip]}</p>
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/55 hover:bg-white/[0.06] hover:text-white">
          <ArrowUpRight size={16} /> Back to website
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <Initial name={user?.name} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="truncate text-xs text-white/45">{user?.email || user?.phone}</div>
          </div>
          <button type="button" onClick={signOut} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-coral-500" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f5f2]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto bg-gradient-to-b from-navy-900 to-navy-950 p-5 lg:block">
        {sidebar}
      </aside>

      <div className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 w-72 overflow-y-auto bg-gradient-to-b from-navy-900 to-navy-950 p-5 transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-white/60 hover:bg-white/10" aria-label="Close menu">
            <X size={18} />
          </button>
          {sidebar}
        </aside>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-navy-900/5 bg-[#f4f5f2]/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-4 md:px-8">
            <button type="button" onClick={() => setMenuOpen(true)} className="rounded-xl bg-white p-2.5 text-navy-900 shadow-soft ring-1 ring-navy-900/5 lg:hidden" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl text-navy-900 md:text-2xl">{title}</h2>
              {subtitle && <p className="hidden truncate text-xs text-navy-800/50 sm:block">{subtitle}</p>}
            </div>
            {actions}
            <button
              type="button"
              onClick={() => go("leads")}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy-900 shadow-soft ring-1 ring-navy-900/5 hover:text-teal-600"
              aria-label={`${counts.leads || 0} new leads`}
            >
              <Bell size={18} />
              {counts.leads > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#f4f5f2]">
                  {counts.leads}
                </span>
              )}
            </button>
            {active !== "new" && (
              <Link href="/vendor/new" className="hidden items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-navy-950 sm:flex">
                <Plus size={16} /> New listing
              </Link>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {[...STUDIO_VIEWS, { key: "new", label: "Add property", Icon: Plus }].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => (key === "new" ? router.push("/vendor/new") : go(key))}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ${
                  active === key ? "bg-navy-900 text-white" : "bg-white text-navy-800/65 ring-1 ring-navy-900/5"
                }`}
              >
                <Icon size={14} /> {label}
                {counts[key] > 0 && <span className={`rounded-full px-1.5 ${key === "leads" ? "bg-coral-500 text-white" : "bg-navy-900/10"}`}>{counts[key]}</span>}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 pb-16 pt-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
