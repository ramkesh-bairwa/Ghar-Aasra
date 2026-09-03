"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { amenitiesList } from "@/lib/data";

const propertyTypes = ["apartment", "villa", "house", "land", "commercial", "office"];
const amenities = amenitiesList;
const cities = ["Amsterdam", "Copenhagen", "London", "New York City", "Paris", "Munich"];
const budgets = [
  { label: "Any budget", min: "", max: "" },
  { label: "Under $100,000", min: "", max: "100000" },
  { label: "$100,000 – $400,000", min: "100000", max: "400000" },
  { label: "$400,000 – $900,000", min: "400000", max: "900000" },
  { label: "$900,000+", min: "900000", max: "" },
];

export default function PropertyFilters({ hideListingType = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleBudget(label) {
    const b = budgets.find((x) => x.label === label);
    const params = new URLSearchParams(searchParams.toString());
    if (b.min) params.set("minPrice", b.min); else params.delete("minPrice");
    if (b.max) params.set("maxPrice", b.max); else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentBudget =
    budgets.find((b) => b.min === currentMinPrice && b.max === currentMaxPrice)?.label || "Any budget";

  return (
    <div className="card-surface flex flex-wrap items-center gap-3 p-4">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        <SlidersHorizontal size={15} /> Filters
      </span>

      {!hideListingType && (
        <select
          value={searchParams.get("listingType") || ""}
          onChange={(e) => setParam("listingType", e.target.value)}
          className="rounded-full border border-navy-900/10 px-4 py-2 text-sm"
        >
          <option value="">Any listing type</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
          <option value="commercial">Commercial</option>
        </select>
      )}

      <select
        value={searchParams.get("propertyType") || ""}
        onChange={(e) => setParam("propertyType", e.target.value)}
        className="rounded-full border border-navy-900/10 px-4 py-2 text-sm capitalize"
      >
        <option value="">Any type</option>
        {propertyTypes.map((t) => (
          <option key={t} value={t} className="capitalize">
            {t}
          </option>
        ))}
      </select>

      <select value={searchParams.get("minBedrooms") || ""} onChange={(e) => setParam("minBedrooms", e.target.value)} className="rounded-full border border-navy-900/10 px-4 py-2 text-sm">
        <option value="">Any bedrooms</option><option value="1">1+ bedroom</option><option value="2">2+ bedrooms</option><option value="3">3+ bedrooms</option><option value="4">4+ bedrooms</option>
      </select>
      <select value={searchParams.get("minBathrooms") || ""} onChange={(e) => setParam("minBathrooms", e.target.value)} className="rounded-full border border-navy-900/10 px-4 py-2 text-sm">
        <option value="">Any bathrooms</option><option value="1">1+ bathroom</option><option value="2">2+ bathrooms</option><option value="3">3+ bathrooms</option>
      </select>
      <select value={searchParams.get("feature") || ""} onChange={(e) => setParam("feature", e.target.value)} className="rounded-full border border-navy-900/10 px-4 py-2 text-sm">
        <option value="">Any amenity</option>{amenities.map((amenity) => <option key={amenity} value={amenity}>{amenity}</option>)}
      </select>
      <select value={searchParams.get("furnishing") || ""} onChange={(e) => setParam("furnishing", e.target.value)} className="rounded-full border border-navy-900/10 px-4 py-2 text-sm capitalize">
        <option value="">Any furnishing</option>
        <option value="furnished">Furnished</option>
        <option value="semi_furnished">Semi-furnished</option>
        <option value="unfurnished">Unfurnished</option>
      </select>

      <select
        value={searchParams.get("city") || ""}
        onChange={(e) => setParam("city", e.target.value)}
        className="rounded-full border border-navy-900/10 px-4 py-2 text-sm"
      >
        <option value="">Any city</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={currentBudget}
        onChange={(e) => handleBudget(e.target.value)}
        className="rounded-full border border-navy-900/10 px-4 py-2 text-sm"
      >
        {budgets.map((b) => (
          <option key={b.label} value={b.label}>
            {b.label}
          </option>
        ))}
      </select>
    </div>
  );
}
