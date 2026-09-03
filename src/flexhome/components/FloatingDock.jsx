"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompare, Map, Heart, Calculator, Sparkles, X } from "lucide-react";
import { useUserLists } from "@/lib/userLists";

const items = [
  { href: "/compare", label: "Compare", icon: GitCompare, countKey: "compare" },
  { href: "/map", label: "Map view", icon: Map },
  { href: "/favorites", label: "Favorites", icon: Heart, countKey: "favorites" },
  { href: "/loan-calculator", label: "Loan calculator", icon: Calculator },
];

export default function FloatingDock() {
  const { favorites, compare, hydrated } = useUserLists();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const counts = { favorites, compare };
  const totalCount = (favorites?.length || 0) + (compare?.length || 0);

  // Collapse back to the FAB on every navigation so it never sits expanded
  // over the next page's content.
  useEffect(() => setOpen(false), [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-5 right-3 z-50 md:bottom-auto md:right-5 md:top-1/2 md:-translate-y-1/2">
      {/* Desktop/tablet: always-visible vertical rail, plenty of side margin to not overlap content. */}
      <div className="hidden flex-col items-center gap-1 rounded-full border border-navy-900/8 bg-white/85 p-2 shadow-soft backdrop-blur-md md:flex">
        {items.map(({ href, label, icon: Icon, countKey }) => (
          <DockLink key={href} href={href} label={label} Icon={Icon} count={countKey ? counts[countKey]?.length : 0} hydrated={hydrated} active={pathname === href} />
        ))}
      </div>

      {/* Mobile: collapsed FAB by default so it only ever covers a small corner, expands on tap. */}
      <div className="md:hidden">
        {open && (
          <div className="mb-2 flex flex-col items-stretch gap-1 rounded-2xl border border-navy-900/8 bg-white/95 p-2 shadow-soft backdrop-blur-md">
            {items.map(({ href, label, icon: Icon, countKey }) => {
              const count = countKey ? counts[countKey]?.length : 0;
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
                    active ? "bg-navy-900 text-teal-400" : "text-navy-800/80"
                  }`}
                >
                  <Icon size={17} strokeWidth={2.2} />
                  {label}
                  {hydrated && count > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-600 px-1 text-[10px] font-semibold leading-none text-white">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        <button
          type="button"
          aria-label={open ? "Close quick menu" : "Open quick menu"}
          onClick={() => setOpen((v) => !v)}
          className="relative ml-auto flex h-12 w-12 items-center justify-center rounded-full border border-navy-900/8 bg-navy-900 text-teal-400 shadow-soft"
        >
          {open ? <X size={19} /> : <Sparkles size={19} />}
          {!open && hydrated && totalCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-600 px-1 text-[10px] font-semibold leading-none text-white">
              {totalCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function DockLink({ href, label, Icon, count, hydrated, active }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group/dock relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 ${
        active ? "bg-navy-900 text-teal-400" : "text-navy-800/70 hover:bg-sand-100 hover:text-teal-600"
      }`}
    >
      <Icon size={18} strokeWidth={2.2} />
      {hydrated && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-600 px-1 text-[10px] font-semibold leading-none text-white">
          {count}
        </span>
      )}
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/dock:opacity-100 md:block hidden">
        {label}
      </span>
    </Link>
  );
}
