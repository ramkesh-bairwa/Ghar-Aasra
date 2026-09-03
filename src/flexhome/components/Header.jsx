"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Menu, X, Plus, User, ChevronDown, CalendarClock, CalendarPlus, Heart, GitCompare, LogOut } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { useAuth } from "@/lib/useAuth";

const accountLinks = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "My Visits", href: "/bookings", icon: CalendarClock },
  { label: "My favorites", href: "/favorites", icon: Heart },
  { label: "My compares", href: "/compare", icon: GitCompare },
];

const links = [
  { label: "Buy", href: "/buy" },
  { label: "Rent", href: "/rent" },
  { label: "Commercial", href: "/commercial" },
  { label: "New Projects", href: "/projects" },
  { label: "Agents", href: "/agents" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header({ transparent = false }) {
  const { site_title, logo_url } = useSiteSettings();
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

  async function handleLogout() {
    setMenuOpen(false);
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  const overlay = transparent && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        overlay
          ? "border-transparent bg-transparent"
          : "border-navy-900/5 bg-sand-50/90 backdrop-blur"
      }`}
    >
      <div className="container-page flex h-[76px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {logo_url ? (
            <img src={logo_url} alt={site_title} className="h-9 w-auto object-contain" />
          ) : (
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                overlay ? "bg-white/15 text-white backdrop-blur-sm" : "bg-navy-900 text-teal-400"
              }`}
            >
              <Home size={18} strokeWidth={2.4} />
            </span>
          )}
          <span className={`font-display text-xl font-semibold ${overlay ? "text-white" : "text-navy-900"}`}>
            {site_title}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
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

        <div className="hidden items-center gap-2 xl:flex">
          {!loading && user ? (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  overlay ? "text-white/90 hover:text-white" : "text-navy-800/80 hover:text-teal-600"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-teal-400">
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
              className={`whitespace-nowrap text-sm font-medium ${overlay ? "text-white/90 hover:text-white" : "text-navy-800/80 hover:text-teal-600"}`}
            >
              Sign in
            </Link>
          )}
          <Link
            href="/schedule-visit"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-navy-900/15 bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 transition-colors hover:border-teal-500 hover:text-teal-600"
          >
            <CalendarPlus size={14} />
            Schedule Visit
          </Link>
          <Link
            href="/properties/new"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            <Plus size={14} />
            Add Property
          </Link>
        </div>

        <button
          className={`rounded-lg p-2 xl:hidden ${overlay ? "text-white" : "text-navy-900"}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-900/5 bg-white xl:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-navy-800 hover:bg-sand-100"
              >
                {link.label}
              </Link>
            ))}

            {!loading && user ? (
              <>
                <div className="mt-2 border-t border-navy-900/8 pt-2">
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
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-navy-800 hover:bg-sand-100"
              >
                Sign in
              </Link>
            )}

            <Link href="/schedule-visit" onClick={() => setOpen(false)} className="btn-outline mt-2 w-full">
              <CalendarPlus size={16} />
              Schedule Visit
            </Link>
            <Link href="/properties/new" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
              <Plus size={16} />
              Add Property
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
