"use client";

import { ArrowUpDown } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { startNavProgress } from "@/components/NavigationProgress";

const SORTS = [
  { value: "", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "area_desc", label: "Largest first" },
  { value: "popular", label: "Most viewed" },
];

export default function ListingSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    startNavProgress();
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-2 text-sm shadow-soft ring-1 ring-navy-900/8">
      <ArrowUpDown size={14} className="text-teal-600" />
      <span className="text-navy-800/50">Sort</span>
      <select
        value={searchParams.get("sort") || ""}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-full bg-transparent py-1 pr-1 font-semibold text-navy-900 focus:outline-none"
      >
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </label>
  );
}
