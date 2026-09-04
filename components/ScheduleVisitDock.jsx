"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus } from "lucide-react";

// Mirrors FloatingDock's right-side rail styling/position, just anchored to
// the left edge and center, for the one "Schedule a visit" quick-access
// action — a single item doesn't need the mobile expand/collapse treatment
// the 4-item right dock uses.
export default function ScheduleVisitDock() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const active = pathname === "/schedule-visit";

  return (
    <div className="fixed left-3 top-1/2 z-50 -translate-y-1/2 md:left-5">
      <Link
        href="/schedule-visit"
        aria-label="Schedule a visit"
        className={`group/dock relative flex h-12 w-12 items-center justify-center rounded-full border border-navy-900/8 shadow-soft backdrop-blur-md transition-all duration-200 hover:scale-105 ${
          active ? "bg-navy-900 text-teal-400" : "bg-white/85 text-navy-800/70 hover:bg-sand-100 hover:text-teal-600"
        }`}
      >
        <CalendarPlus size={19} strokeWidth={2.2} />
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/dock:opacity-100">
          Schedule a visit
        </span>
      </Link>
    </div>
  );
}
