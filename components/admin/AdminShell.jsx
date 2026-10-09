"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Layers, Users, Briefcase,
  Newspaper, HelpCircle, MapPin, Inbox, FileText, LogOut, Home, Settings,
  Tags, ListTree, Sparkles, ChevronDown, CalendarClock, ShieldCheck, CalendarCheck,
  Quote, BarChart3, LayoutGrid, LayoutPanelTop, Store, Wallet, PencilRuler, Megaphone, Clapperboard, MapPinned, TrendingUp,
} from "lucide-react";
import { clearAdminSessionCache } from "./adminSessionCache";
import NotificationBell from "@/components/NotificationBell";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/properties",
        label: "Property Management",
        icon: Building2,
        children: [
          { href: "/admin/properties", label: "Properties", icon: Building2 },
          { href: "/admin/categories", label: "Categories", icon: Tags },
          { href: "/admin/subcategories", label: "Subcategories", icon: ListTree },
          { href: "/admin/amenities", label: "Amenities", icon: Sparkles },
          { href: "/admin/floor-plans", label: "Floor Plans & Sizes", icon: LayoutPanelTop },
          { href: "/admin/seller-sizes", label: "Seller-added Sizes", icon: PencilRuler },
        ],
      },
      { href: "/admin/projects", label: "New Projects", icon: Layers },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/sellers", label: "Sellers", icon: Store },
      { href: "/admin/commissions", label: "Seller Commissions", icon: Wallet },
      { href: "/admin/agents", label: "Agents", icon: Users },
      { href: "/admin/developers", label: "Developers", icon: Briefcase },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/ads", label: "Ads & Banners", icon: Megaphone },
      { href: "/admin/reels", label: "Property Reels", icon: Clapperboard },
      { href: "/admin/localities", label: "Localities", icon: MapPinned },
      { href: "/admin/demand", label: "Buyer Demand", icon: TrendingUp },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog / News", icon: Newspaper },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/pages", label: "Static Pages", icon: FileText },
      { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
      { href: "/admin/stats", label: "Homepage Stats", icon: BarChart3 },
      { href: "/admin/home-categories", label: "Property Type Tiles", icon: LayoutGrid },
      { href: "/admin/settings", label: "Site Settings", icon: Settings },
    ],
  },
  {
    label: "Activity",
    items: [
      { href: "/admin/bookings", label: "Visit Bookings", icon: CalendarCheck },
      { href: "/admin/inquiries", label: "Enquiries & Callbacks", icon: Inbox },
      { href: "/admin/schedule", label: "Schedule Requests", icon: CalendarClock },
    ],
  },
  {
    label: "Admin",
    // Only ever shown to full admins (sections === null) — see filterGroups.
    items: [{ href: "/admin/staff", label: "Staff", icon: ShieldCheck }],
  },
];

// "/admin/properties" -> "properties", "/admin" -> "dashboard"
function sectionOf(href) {
  if (href === "/admin") return "dashboard";
  return href.split("/")[2] || "dashboard";
}

// sections === null means every section is allowed (full admin / legacy admins).
function filterGroups(groups, sections) {
  if (sections === null) return groups;
  const allowed = (href) => sections.includes(sectionOf(href));
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => allowed(item.href) || item.children?.some((c) => allowed(c.href)))
        .map((item) => {
          if (!item.children) return item;
          const children = item.children.filter((c) => allowed(c.href));
          return children.length ? { ...item, children } : { href: item.href, label: item.label, icon: item.icon };
        }),
    }))
    .filter((group) => group.items.length > 0);
}

function NavLink({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      className={`group flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "border-teal-400 bg-gradient-to-r from-teal-500/20 to-teal-500/0 text-teal-300 shadow-[inset_0_0_0_1px_rgba(20,184,172,0.12)]"
          : "border-transparent text-white/55 hover:border-white/15 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={16} /> {item.label}
    </Link>
  );
}

function NavGroupHeader({ item, open, onToggle }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Collapse" : "Expand"}
      className="group flex w-full items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-left text-sm font-medium text-white/55 transition-all hover:border-white/15 hover:bg-white/5 hover:text-white"
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{item.label}</span>
      <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function NavItem({ item, pathname }) {
  const childActive = item.children?.some((c) => pathname === c.href) ?? false;
  const active = pathname === item.href;
  const [open, setOpen] = useState(active || childActive);

  useEffect(() => {
    if (active || childActive) setOpen(true);
  }, [active, childActive]);

  if (!item.children) return <NavLink item={item} active={active} />;

  return (
    <div>
      <NavGroupHeader item={item} open={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-teal-500/20 pl-2.5">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} active={pathname === child.href} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminShell({ children, adminName, adminEmail, adminRole, sections = null }) {
  const pathname = usePathname();
  const { site_title, icon_url } = useSiteSettings();
  const router = useRouter();
  const visibleGroups = filterGroups(navGroups, sections);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    clearAdminSessionCache();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sand-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950 px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2 px-2">
          {icon_url ? (
            <img src={icon_url} alt="" className="h-8 w-8 rounded-lg object-contain shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-navy-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              <Home size={16} strokeWidth={2.4} />
            </span>
          )}
          <span className="truncate font-display text-lg text-white">{site_title}</span>
        </Link>
        <span className="mt-1 px-2 text-xs tracking-wide text-white/35">Admin panel</span>

        {/* Only this nav scrolls when it overflows — logo and sign-out
            above/below it stay put, and it never drags the main content
            area's scroll along with it (each side scrolls independently,
            following wherever the cursor/wheel actually is). */}
        <nav className="admin-scroll mt-8 flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 text-[10px] font-semibold uppercase tracking-widest text-teal-400/50">{group.label}</div>
              <div className="mt-1.5 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-4 flex items-center gap-2.5 rounded-lg border-t border-white/[0.06] px-3 pt-4 text-sm font-medium text-white/50 transition-colors hover:text-coral-500"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-navy-900/8 bg-white px-6 lg:px-8">
          <span className="flex items-center gap-2 text-sm text-navy-800/60">
            Signed in as <span className="font-medium text-navy-900">{adminName}</span>
            {sections !== null && (
              <span className="badge-pill bg-navy-900/8 text-navy-800/60 capitalize">{adminRole}</span>
            )}
          </span>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              View site →
            </Link>
            <NotificationBell variant="admin" storageKey={`fh_admin_notif_seen_${adminEmail || adminName}`} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
