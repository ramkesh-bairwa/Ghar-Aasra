"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { startNavProgress } from "@/components/NavigationProgress";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search, MapPin, Wallet, BedDouble, SlidersHorizontal, X, LayoutGrid, Tag, KeyRound,
  Building, Building2, Home, Trees, Store, Briefcase, Bath, Sofa, Sparkles, ChevronDown, RotateCcw,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const LISTING_TABS = [
  { key: "all", label: "All", href: "/properties", Icon: LayoutGrid },
  { key: "sale", label: "Buy", href: "/buy", Icon: Tag },
  { key: "rent", label: "Rent", href: "/rent", Icon: KeyRound },
  { key: "commercial", label: "Commercial", href: "/commercial", Icon: Building2, commercial: true },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", Icon: Building },
  { value: "villa", label: "Villa", Icon: Home },
  { value: "house", label: "House", Icon: Home },
  { value: "land", label: "Land / Plot", Icon: Trees },
  { value: "commercial", label: "Shop / Retail", Icon: Store, commercial: true },
  { value: "office", label: "Office", Icon: Briefcase, commercial: true },
];

const SALE_BUDGETS = [
  { min: "", max: "100000" },
  { min: "100000", max: "400000" },
  { min: "400000", max: "900000" },
  { min: "900000", max: "" },
];
const RENT_BUDGETS = [
  { min: "", max: "1000" },
  { min: "1000", max: "2000" },
  { min: "2000", max: "4000" },
  { min: "4000", max: "" },
];

const BEDROOMS = ["1", "2", "3", "4", "5"];
const BATHROOMS = ["1", "2", "3", "4"];
const FURNISHING = [
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

function money(symbol, value) {
  return `${symbol}${Number(value).toLocaleString("en-US")}`;
}

function budgetLabel(symbol, { min, max }) {
  if (!min && max) return `Under ${money(symbol, max)}`;
  if (min && !max) return `${money(symbol, min)}+`;
  return `${money(symbol, min)} – ${money(symbol, max)}`;
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-navy-900 text-white"
          : "bg-white text-navy-800/75 ring-1 ring-navy-900/10 hover:text-navy-900 hover:ring-navy-900/25"
      }`}
    >
      {children}
    </button>
  );
}

function SearchField({ icon: Icon, label, children }) {
  return (
    <label className="flex min-w-0 cursor-pointer flex-col justify-center px-5 py-3 transition-colors hover:bg-white/70 md:first:rounded-l-2xl">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-800/45">
        <Icon size={13} className="text-teal-600" /> {label}
      </span>
      <span className="mt-1 block min-w-0">{children}</span>
    </label>
  );
}

function TypeTile({ active, onClick, Icon, label, badge, ariaExpanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaExpanded === undefined ? active : undefined}
      aria-expanded={ariaExpanded}
      className={`relative flex min-w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
        active ? "bg-navy-900 text-white" : "text-navy-800/65 hover:bg-sand-50 hover:text-navy-900"
      }`}
    >
      <Icon size={19} strokeWidth={1.75} className={active ? "text-teal-400" : ""} />
      {label}
      {badge > 0 && (
        <span className="absolute right-2 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] text-white">{badge}</span>
      )}
    </button>
  );
}

const selectClass =
  "w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-[15px] font-semibold text-navy-900 focus:outline-none";

export default function PropertyFilters({ fixedListingType, amenities = [], cities = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currency_symbol: symbol = "$", commercial_enabled } = useSiteSettings();
  const commercialOn = commercial_enabled !== "false";

  const get = (key) => searchParams.get(key) || "";
  const activeListing = fixedListingType || get("listingType") || "all";
  const isRent = activeListing === "rent";
  const budgets = isRent ? RENT_BUDGETS : SALE_BUDGETS;

  const [city, setCity] = useState(get("city"));
  const [minPrice, setMinPrice] = useState(get("minPrice"));
  const [maxPrice, setMaxPrice] = useState(get("maxPrice"));
  const [moreOpen, setMoreOpen] = useState(false);

  // Keep the inputs in sync when filters change via chips / back button.
  useEffect(() => {
    setCity(get("city"));
    setMinPrice(get("minPrice"));
    setMaxPrice(get("maxPrice"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function push(params) {
    startNavProgress();
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    push(params);
  }

  function toggle(key, value) {
    setParams({ [key]: get(key) === value ? "" : value });
  }

  function onSearch(e) {
    e.preventDefault();
    setParams({ city: city.trim() });
  }

  function tabHref(tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("listingType");
    // Rent and sale budgets live on different scales — don't carry them across.
    params.delete("minPrice");
    params.delete("maxPrice");
    const qs = params.toString();
    return qs ? `${tab.href}?${qs}` : tab.href;
  }

  const currentBudgetIndex = budgets.findIndex((b) => b.min === get("minPrice") && b.max === get("maxPrice"));
  const hasCustomBudget = (get("minPrice") || get("maxPrice")) && currentBudgetIndex === -1;

  const visibleTypes = PROPERTY_TYPES.filter((t) => commercialOn || !t.commercial);
  const visibleTabs = LISTING_TABS.filter((t) => commercialOn || !t.commercial);

  // Active filter chips (everything except sort).
  const chips = [
    get("city") && { key: "city", label: get("city"), Icon: MapPin },
    get("propertyType") && { key: "propertyType", label: PROPERTY_TYPES.find((t) => t.value === get("propertyType"))?.label || get("propertyType"), Icon: Building },
    (get("minPrice") || get("maxPrice")) && { key: "price", label: budgetLabel(symbol, { min: get("minPrice"), max: get("maxPrice") }), Icon: Wallet },
    get("minBedrooms") && { key: "minBedrooms", label: `${get("minBedrooms")}+ beds`, Icon: BedDouble },
    get("minBathrooms") && { key: "minBathrooms", label: `${get("minBathrooms")}+ baths`, Icon: Bath },
    get("furnishing") && { key: "furnishing", label: FURNISHING.find((f) => f.value === get("furnishing"))?.label || get("furnishing"), Icon: Sofa },
    get("feature") && { key: "feature", label: get("feature"), Icon: Sparkles },
  ].filter(Boolean);

  const moreCount = ["minBathrooms", "furnishing", "feature"].filter((k) => get(k)).length + (hasCustomBudget ? 1 : 0);

  function removeChip(key) {
    if (key === "price") setParams({ minPrice: "", maxPrice: "" });
    else setParams({ [key]: "" });
  }

  function clearAll() {
    const params = new URLSearchParams();
    if (get("sort")) params.set("sort", get("sort"));
    if (!fixedListingType && get("listingType")) params.set("listingType", get("listingType"));
    push(params);
  }

  return (
    <div className="relative rounded-3xl bg-white shadow-[0_30px_60px_-30px_rgba(15,27,45,0.45)] ring-1 ring-navy-900/5">
      {/* Listing type — underline tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-navy-900/8 px-3 md:px-5">
        <nav className="-mb-px flex overflow-x-auto">
          {visibleTabs.map((tab) => {
            const active = activeListing === tab.key;
            return (
              <Link
                key={tab.key}
                href={tabHref(tab)}
                onClick={() => !active && startNavProgress()}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors md:px-4 ${
                  active ? "border-teal-500 text-navy-900" : "border-transparent text-navy-800/50 hover:text-navy-900"
                }`}
              >
                <tab.Icon size={15} className={active ? "text-teal-600" : ""} /> {tab.label}
              </Link>
            );
          })}
        </nav>
        {chips.length > 0 && (
          <button type="button" onClick={clearAll} className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-navy-800/55 hover:text-coral-600">
            <RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      <div className="p-3 md:p-5">
        {/* Main search bar */}
        <form
          onSubmit={onSearch}
          className="grid rounded-2xl bg-sand-50 ring-1 ring-navy-900/8 md:grid-cols-[1.6fr,1fr,1fr,auto] md:items-stretch md:divide-x md:divide-navy-900/10"
        >
          <SearchField icon={MapPin} label="Location">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              list="filter-cities"
              placeholder="City, area or address"
              className="w-full bg-transparent text-[15px] font-semibold text-navy-900 placeholder:font-normal placeholder:text-navy-800/40 focus:outline-none"
            />
            <datalist id="filter-cities">
              {cities.map((c) => <option key={c} value={c} />)}
            </datalist>
          </SearchField>

          <SearchField icon={Wallet} label={isRent ? "Monthly budget" : "Budget"}>
            <span className="relative block">
              <select
                value={currentBudgetIndex === -1 ? (hasCustomBudget ? "custom" : "") : String(currentBudgetIndex)}
                onChange={(e) => {
                  const b = budgets[Number(e.target.value)];
                  setParams({ minPrice: b?.min || "", maxPrice: b?.max || "" });
                }}
                className={selectClass}
              >
                <option value="">Any budget</option>
                {hasCustomBudget && <option value="custom">{budgetLabel(symbol, { min: get("minPrice"), max: get("maxPrice") })}</option>}
                {budgets.map((b, i) => (
                  <option key={i} value={String(i)}>{budgetLabel(symbol, b)}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-navy-800/40" />
            </span>
          </SearchField>

          <SearchField icon={BedDouble} label="Bedrooms">
            <span className="relative block">
              <select
                value={get("minBedrooms")}
                onChange={(e) => setParams({ minBedrooms: e.target.value })}
                className={selectClass}
              >
                <option value="">Any</option>
                {BEDROOMS.map((n) => <option key={n} value={n}>{n}+ bedrooms</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-navy-800/40" />
            </span>
          </SearchField>

          <div className="flex items-center p-2 md:!border-l-0">
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-teal-600 md:h-full md:min-h-[52px] md:w-auto"
            >
              <Search size={17} /> Search
            </button>
          </div>
        </form>

        {/* Property type tiles + filters */}
        <div className="mt-3 flex items-stretch gap-2">
          <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1">
            <TypeTile
              active={!get("propertyType")}
              onClick={() => setParams({ propertyType: "" })}
              Icon={LayoutGrid}
              label="All types"
            />
            {visibleTypes.map(({ value, label, Icon }) => (
              <TypeTile
                key={value}
                active={get("propertyType") === value}
                onClick={() => toggle("propertyType", value)}
                Icon={Icon}
                label={label}
              />
            ))}
          </div>
          <div className="my-2 w-px shrink-0 bg-navy-900/10" />
          <TypeTile
            active={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
            ariaExpanded={moreOpen}
            Icon={SlidersHorizontal}
            label="Filters"
            badge={moreCount}
          />
        </div>

        {/* Expanded filters drawer */}
        <div className={`grid transition-all duration-300 ease-out ${moreOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="grid gap-6 rounded-2xl bg-sand-50 p-5 ring-1 ring-navy-900/8 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-900"><Bath size={15} className="text-teal-600" /> Bathrooms</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill active={!get("minBathrooms")} onClick={() => setParams({ minBathrooms: "" })}>Any</Pill>
                  {BATHROOMS.map((n) => (
                    <Pill key={n} active={get("minBathrooms") === n} onClick={() => toggle("minBathrooms", n)}>{n}+</Pill>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-900"><Sofa size={15} className="text-teal-600" /> Furnishing</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill active={!get("furnishing")} onClick={() => setParams({ furnishing: "" })}>Any</Pill>
                  {FURNISHING.map((f) => (
                    <Pill key={f.value} active={get("furnishing") === f.value} onClick={() => toggle("furnishing", f.value)}>{f.label}</Pill>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-900"><Wallet size={15} className="text-teal-600" /> Custom price range</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-lg bg-white px-3 ring-1 ring-navy-900/10 focus-within:ring-teal-500">
                    <span className="text-sm text-navy-800/45">{symbol}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <span className="text-navy-800/40">–</span>
                  <div className="flex flex-1 items-center rounded-lg bg-white px-3 ring-1 ring-navy-900/10 focus-within:ring-teal-500">
                    <span className="text-sm text-navy-800/45">{symbol}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setParams({ minPrice, maxPrice })}
                    className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-950"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {amenities.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy-900"><Sparkles size={15} className="text-teal-600" /> Must-have amenity</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {amenities.map((a) => (
                      <Pill key={a} active={get("feature") === a} onClick={() => toggle("feature", a)}>{a}</Pill>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filters */}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-navy-900/8 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy-800/45">Active</span>
            {chips.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => removeChip(key)}
                className="group flex items-center gap-1.5 rounded-lg bg-teal-500/10 py-1.5 pl-2.5 pr-2 text-sm font-medium text-teal-600 transition-colors hover:bg-coral-500/10 hover:text-coral-600"
              >
                <Icon size={13} /> <span className="capitalize">{label}</span>
                <X size={14} className="opacity-60 group-hover:opacity-100" />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="ml-1 text-sm font-semibold text-navy-800/55 underline-offset-2 hover:text-coral-600 hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
