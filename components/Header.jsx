"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home, Menu, X, Plus, User, ChevronDown, CalendarClock, CalendarPlus, Heart, GitCompare, LogOut,
  LayoutGrid, KeyRound, Tag, Building2, Map as MapIcon, ArrowRight, BellRing, MapPinned, Clapperboard,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { useAuth } from "@/lib/useAuth";
import NotificationBell from "@/components/NotificationBell";
import AnnouncementBar from "@/components/ads/AnnouncementBar";

const accountLinks = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Seller dashboard", href: "/vendor", icon: Building2 },
  { label: "My Visits", href: "/bookings", icon: CalendarClock },
  { label: "My alerts", href: "/alerts", icon: BellRing },
  { label: "My favorites", href: "/favorites", icon: Heart },
  { label: "My compares", href: "/compare", icon: GitCompare },
];

const propertyLinks = [
  { label: "All properties", desc: "Browse every listing", href: "/properties", icon: LayoutGrid },
  { label: "Buy", desc: "Homes & plots for sale", href: "/buy", icon: Tag },
  { label: "Rent", desc: "Apartments & houses to rent", href: "/rent", icon: KeyRound },
  { label: "Commercial", desc: "Offices, shops & warehouses", href: "/commercial", icon: Building2, commercial: true },
  { label: "Map view", desc: "Search properties on the map", href: "/map", icon: MapIcon },
  { label: "Localities", desc: "Prices & guides by area", href: "/localities", icon: MapPinned, setting: "localities_enabled" },
  { label: "Property reels", desc: "Quick video tours", href: "/reels", icon: Clapperboard, setting: "reels_enabled" },
];

const links = [
  { label: "New Projects", href: "/projects" },
  { label: "Agents", href: "/agents" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header({ transparent = false }) {
  const settings = useSiteSettings();
  const { site_title, logo_url, logo_dark_url, commercial_enabled } = settings;
  const visiblePropertyLinks = propertyLinks.filter((l) => (!l.commercial || commercial_enabled !== "false") && (!l.setting || settings[l.setting] !== "false"));
  const [propsOpen, setPropsOpen] = useState(false);
  const propsRef = useRef(null);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!transparent);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!transparent) return;
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!propsOpen) return;
    function onClickOutside(e) {
      if (propsRef.current && !propsRef.current.contains(e.target)) setPropsOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [propsOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  const overlay = transparent && !scrolled;

  return (
    <>
    <AnnouncementBar />
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        overlay
          ? "border-transparent bg-transparent"
          : "border-navy-900/5 bg-sand-50/90 backdrop-blur"
      }`}
    >
      <div className="container-page flex h-[76px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label={site_title}>
          {/* The logo already contains the brand name, so the text title is
              only shown when no logo image is configured. */}
          {(overlay ? logo_dark_url || logo_url : logo_url) ? (
            <img src={overlay ? logo_dark_url || logo_url : logo_url} alt={site_title} className="h-12 w-auto max-w-[220px] object-contain sm:h-14 sm:max-w-[260px]" />
          ) : (
            <>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  overlay ? "bg-white/15 text-white backdrop-blur-sm" : "bg-navy-900 text-teal-400"
                }`}
              >
                <Home size={18} strokeWidth={2.4} />
              </span>
              <span className={`font-display text-xl font-semibold ${overlay ? "text-white" : "text-navy-900"}`}>
                {site_title}
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          <div
            className="relative"
            ref={propsRef}
            onMouseEnter={() => setPropsOpen(true)}
            onMouseLeave={() => setPropsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPropsOpen((v) => !v)}
              aria-expanded={propsOpen}
              className={`flex items-center gap-1 whitespace-nowrap text-[15px] font-medium transition-colors ${
                overlay ? "text-white/90 hover:text-white" : "text-navy-800/80 hover:text-teal-600"
              }`}
            >
              Properties
              <ChevronDown size={14} className={`transition-transform ${propsOpen ? "rotate-180" : ""}`} />
            </button>
            {propsOpen && (
              <div className="absolute left-1/2 top-full z-50 w-[380px] -translate-x-1/2 pt-3">
                <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-navy-900/5">
                  <div className="p-2">
                    {visiblePropertyLinks.map(({ label, desc, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setPropsOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-sand-100"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-navy-900">{label}</span>
                          <span className="block text-xs text-navy-800/55">{desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/vendor/new"
                    onClick={() => setPropsOpen(false)}
                    className="flex items-center justify-between bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-950"
                  >
                    Want to sell or rent out? List your property
                    <ArrowRight size={15} className="text-teal-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`whitespace-nowrap text-[15px] font-medium transition-colors ${
                overlay ? "text-white/90 hover:text-white" : "text-navy-800/80 hover:text-teal-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: [CTAs] [bell] [profile] on desktop, [bell] [menu] on
            mobile. One bell instance serves both so it only polls once. */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 xl:flex">
            <Link
              href="/schedule-visit"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-navy-900/15 bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 transition-colors hover:border-teal-500 hover:text-teal-600"
            >
              <CalendarPlus size={14} />
              Schedule Visit
            </Link>
            <Link
              href="/vendor/new"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
            >
              <Plus size={14} />
              Add Property
            </Link>
          </div>

          {!loading && user && <NotificationBell variant="user" storageKey={`fh_notif_seen_${user.id}`} dark={overlay} />}

          <div className="hidden items-center xl:flex">
            {!loading && user ? (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    overlay ? "text-white/90 hover:text-white" : "text-navy-800/80 hover:text-teal-600"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-teal-400 ring-2 ring-teal-500/30">
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </span>
                  {user.name?.split(" ")[0] || "Account"}
                  <ChevronDown size={14} className={`shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl2 bg-white p-1.5 shadow-card ring-1 ring-navy-900/5">
                    {accountLinks.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800 hover:bg-sand-100"
                      >
                        <Icon size={16} className="text-navy-800/50" /> {label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-navy-900/8 px-3 py-2.5 pt-3 text-sm font-medium text-coral-600 hover:bg-coral-500/10"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 pr-3 text-sm font-medium ${
                  overlay ? "text-white/90 hover:text-white" : "text-navy-800/80 hover:text-teal-600"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${overlay ? "bg-white/15" : "bg-navy-900/8"}`}>
                  <User size={16} />
                </span>
                Sign in
              </Link>
            )}
          </div>

          <button
            className={`rounded-lg p-2 xl:hidden ${overlay ? "text-white" : "text-navy-900"}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-navy-900/5 bg-white xl:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-navy-800/45">Properties</div>
            <div className="grid grid-cols-2 gap-1.5 pb-2">
              {visiblePropertyLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-sand-50 px-3 py-2.5 text-sm font-medium text-navy-800 ring-1 ring-navy-900/5 hover:bg-sand-100"
                >
                  <Icon size={16} className="text-teal-600" /> {label}
                </Link>
              ))}
            </div>
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-navy-800 hover:bg-sand-100"
              >
                {link.label}
              </Link>
            ))}

            <Link href="/schedule-visit" onClick={() => setOpen(false)} className="btn-outline mt-2 w-full">
              <CalendarPlus size={16} />
              Schedule Visit
            </Link>
            <Link href="/vendor/new" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
              <Plus size={16} />
              Add Property
            </Link>

            {/* Account section last, matching the desktop header. */}
            {!loading && user ? (
              <div className="mt-3 border-t border-navy-900/8 pt-3">
                <div className="flex items-center gap-3 px-2 pb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-teal-400">
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </span>
                  <span className="text-sm font-semibold text-navy-900">{user.name}</span>
                </div>
                {accountLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-[15px] font-medium text-navy-800 hover:bg-sand-100"
                  >
                    <Icon size={16} className="text-navy-800/50" /> {label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-[15px] font-medium text-coral-600 hover:bg-coral-500/10"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-3 flex items-center gap-2.5 border-t border-navy-900/8 px-2 pb-1 pt-4 text-[15px] font-medium text-navy-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900/8">
                  <User size={17} />
                </span>
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
