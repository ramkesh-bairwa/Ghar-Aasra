"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, KeyRound, Building2, Wallet, BedDouble, Bath, Sofa, X } from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import LocationAutocomplete from "@/components/LocationAutocomplete";

const tabs = [
  { label: "Buy", Icon: Home },
  { label: "Rent", Icon: KeyRound },
  { label: "Commercial", Icon: Building2 },
];
const propertyTypes = [
  { label: "Any type", value: "" },
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "House", value: "house" },
  { label: "Land", value: "land" },
  { label: "Office", value: "office" },
];
const budgets = ["Any budget", "Under $100,000", "$100,000 – $400,000", "$400,000 – $900,000", "$900,000+"];
const bedroomOptions = [
  { label: "Any beds", value: "" },
  { label: "1+ bed", value: "1" },
  { label: "2+ beds", value: "2" },
  { label: "3+ beds", value: "3" },
  { label: "4+ beds", value: "4" },
];
const bathroomOptions = [
  { label: "Any baths", value: "" },
  { label: "1+ bath", value: "1" },
  { label: "2+ baths", value: "2" },
  { label: "3+ baths", value: "3" },
];
const furnishingOptions = [
  { label: "Any furnishing", value: "" },
  { label: "Furnished", value: "furnished" },
  { label: "Semi-furnished", value: "semi_furnished" },
  { label: "Unfurnished", value: "unfurnished" },
];

const fieldWrap = "flex items-center gap-2 rounded-xl border border-navy-900/10 bg-white px-4 py-3 transition-colors focus-within:border-teal-500";
const fieldSelect = "w-full appearance-none bg-transparent text-sm text-navy-900 focus:outline-none";

export default function Hero() {
  const { hero_video_url, hero_banner_image_url, hero_heading, hero_subheading, hero_overlay_opacity } =
    useSiteSettings();
  // Preserves the original gradient's shape (top/mid/bottom stops at
  // roughly 89%/67%/100% of the darkest point) while scaling the whole
  // thing by the admin's chosen strength.
  const overlayMax = Number(hero_overlay_opacity) / 100;
  const [tab, setTab] = useState("Buy");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const router = useRouter();

  const moreFiltersCount = [bedrooms, bathrooms, furnishing].filter(Boolean).length;

  function resetMoreFilters() {
    setBedrooms("");
    setBathrooms("");
    setFurnishing("");
  }

  function searchProperties() {
    const params = new URLSearchParams({ listingType: tab === "Buy" ? "sale" : tab === "Rent" ? "rent" : "commercial" });
    if (city) params.set("city", city);
    if (propertyType) params.set("propertyType", propertyType);
    if (budget === "under") params.set("maxPrice", "100000");
    if (budget === "mid") { params.set("minPrice", "100000"); params.set("maxPrice", "400000"); }
    if (budget === "high") { params.set("minPrice", "400000"); params.set("maxPrice", "900000"); }
    if (budget === "luxury") params.set("minPrice", "900000");
    if (bedrooms) params.set("minBedrooms", bedrooms);
    if (bathrooms) params.set("minBathrooms", bathrooms);
    if (furnishing) params.set("furnishing", furnishing);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <section className="relative -mt-[76px] min-h-[640px] bg-navy-900 md:min-h-[760px] lg:min-h-[860px]">
      {/* Full-bleed video/image background — pulled up under the sticky header via -mt so the
          nav visually overlays this same section instead of sitting in a bar above it. */}
      <div className="absolute inset-0">
        {hero_video_url ? (
          <video
            src={hero_video_url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={hero_banner_image_url || "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop"}
            alt="Modern villa with pool"
            className="h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              color-mix(in srgb, var(--color-navy-950) ${overlayMax * 89}%, transparent),
              color-mix(in srgb, var(--color-navy-950) ${overlayMax * 67}%, transparent),
              color-mix(in srgb, var(--color-navy-950) ${overlayMax * 100}%, transparent))`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(20,184,172,0.22),transparent_45%)]" />
      </div>

      <div className="container-page relative pt-32 pb-[124px] md:pt-36 md:pb-[140px] lg:pt-40 lg:pb-[156px]">
        <div className="flex max-w-2xl flex-col justify-center">
          <span className="badge-pill w-fit bg-teal-500/15 text-teal-300">
            12,400+ verified listings across 48 cities
          </span>
          <h1 className="mt-5 max-w-xl font-display text-4xl leading-[1.1] text-white md:text-5xl">
            {hero_heading}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">{hero_subheading}</p>
        </div>
      </div>

      {/* Search widget, overlapping into the section below */}
      <div className="container-page relative pb-14 md:pb-16">
        <div className="card-surface -mb-24 p-3 shadow-[0_20px_60px_-15px_rgba(11,27,51,0.35)] md:-mb-28 md:p-4">
          <div className="flex gap-1 border-b border-navy-900/8 px-2 pb-2 md:px-3">
            {tabs.map(({ label, Icon }) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === label
                    ? "bg-teal-500/10 text-teal-600"
                    : "text-navy-800/60 hover:text-navy-900"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-[1.3fr,1fr,1fr,auto] md:p-3">
            <LocationAutocomplete
              value={city}
              onChange={setCity}
              onSelect={(suggestion) => setCity(suggestion.cityLabel)}
              placeholder="City, neighborhood, or address"
            />

            <label className={fieldWrap}>
              <Home size={17} className="shrink-0 text-teal-600" />
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={fieldSelect}>
                {propertyTypes.map((t) => (
                  <option key={t.label} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className={fieldWrap}>
              <Wallet size={17} className="shrink-0 text-teal-600" />
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className={fieldSelect}>
                <option value="">Any budget</option>
                {budgets.slice(1).map((b, index) => (
                  <option key={b} value={["under", "mid", "high", "luxury"][index]}>{b}</option>
                ))}
              </select>
            </label>

            <button onClick={searchProperties} className="btn-primary w-full md:w-auto">
              <Search size={16} />
              Search
            </button>
          </div>

          <div className="grid gap-3 border-t border-navy-900/8 px-3 pb-3 pt-3 sm:grid-cols-3 md:px-3">
            <label className={fieldWrap}>
              <BedDouble size={17} className="shrink-0 text-teal-600" />
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={fieldSelect}>
                {bedroomOptions.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className={fieldWrap}>
              <Bath size={17} className="shrink-0 text-teal-600" />
              <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={fieldSelect}>
                {bathroomOptions.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <label className={`${fieldWrap} flex-1`}>
                <Sofa size={17} className="shrink-0 text-teal-600" />
                <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className={fieldSelect}>
                  {furnishingOptions.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              {moreFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetMoreFilters}
                  aria-label="Clear filters"
                  title="Clear filters"
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-navy-900/10 text-navy-800/45 transition-colors hover:border-coral-500/40 hover:text-coral-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
