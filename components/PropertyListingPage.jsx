import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyFilters from "@/components/PropertyFilters";
import ListingSort from "@/components/ListingSort";
import PropertyCard from "@/components/PropertyCard";
import { listProperties, listFilterAmenities, listLocations } from "@/lib/queries";
import { SearchX, BadgeCheck, MapPin, Building2, Sparkles, RotateCcw } from "lucide-react";
import { Fragment } from "react";
import SaveSearchButton from "@/components/SaveSearchButton";
import AdSlot from "@/components/ads/AdSlot";
import { AdCreative } from "@/components/ads/AdBanner";
import { getActiveAds } from "@/lib/ads";

export default async function PropertyListingPage({
  searchParams,
  fixedListingType,
  title,
  subtitle,
  eyebrow,
}) {
  const filters = {
    listingType: fixedListingType || searchParams.listingType || undefined,
    propertyType: searchParams.propertyType || undefined,
    city: searchParams.city || undefined,
    locality: searchParams.locality || undefined,
    minPrice: searchParams.minPrice || undefined,
    maxPrice: searchParams.maxPrice || undefined,
    minBedrooms: searchParams.minBedrooms || undefined,
    minBathrooms: searchParams.minBathrooms || undefined,
    furnishing: searchParams.furnishing || undefined,
    feature: searchParams.feature || undefined,
    sort: searchParams.sort || undefined,
    sponsoredFirst: true,
  };
  const [properties, amenities, locations, inlineAds] = await Promise.all([
    listProperties(filters),
    listFilterAmenities(),
    listLocations(),
    getActiveAds("listing_inline", { listingType: filters.listingType, city: filters.city, limit: 3 }),
  ]);

  const cityCount = new Set(properties.map((p) => p.city).filter(Boolean)).size;
  const verifiedCount = properties.filter((p) => p.verified).length;
  const featuredCount = properties.filter((p) => p.featured).length;
  const heroImage = properties[0]?.image;
  const resetHref = { sale: "/buy", rent: "/rent", commercial: "/commercial" }[fixedListingType] || "/properties";

  const heroStats = [
    { Icon: Building2, value: properties.length, label: properties.length === 1 ? "property" : "properties" },
    { Icon: MapPin, value: cityCount, label: cityCount === 1 ? "city" : "cities" },
    verifiedCount > 0 && { Icon: BadgeCheck, value: verifiedCount, label: "verified" },
    featuredCount > 0 && { Icon: Sparkles, value: featuredCount, label: "featured" },
  ].filter(Boolean);

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <section className="relative overflow-hidden bg-navy-900 pb-28 pt-14 md:pb-32 md:pt-16">
          {heroImage && (
            <img src={heroImage} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/85 to-navy-900/60" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-coral-500/10 blur-3xl" />

          <div className="container-page relative">
            {eyebrow && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 ring-1 ring-white/15 backdrop-blur">
                <Sparkles size={12} /> {eyebrow}
              </span>
            )}
            <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white md:text-5xl">{title}</h1>
            {subtitle && <p className="mt-3 max-w-xl text-[16px] text-white/65">{subtitle}</p>}

            <div className="mt-7 flex flex-wrap gap-3">
              {heroStats.map(({ Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10 backdrop-blur">
                  <Icon size={17} className="text-teal-300" />
                  <span className="font-display text-xl text-white">{value}</span>
                  <span className="text-sm text-white/60">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-20 pb-16">
          <div className="container-page">
            <Suspense fallback={<div className="h-48 rounded-[1.6rem] bg-white shadow-card" />}>
              <PropertyFilters
                fixedListingType={fixedListingType}
                amenities={amenities}
                cities={locations.map((l) => l.city)}
              />
            </Suspense>

            <AdSlot placement="listing_top" listingType={filters.listingType} city={filters.city} className="mt-8" />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-navy-900">
                  {properties.length} {properties.length === 1 ? "home" : "homes"} waiting for you
                </h2>
                <p className="mt-0.5 text-sm text-navy-800/55">Every listing can be visited in person or on a video call.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Suspense fallback={null}>
                  <SaveSearchButton fixedListingType={fixedListingType} />
                </Suspense>
                <Suspense fallback={null}>
                  <ListingSort />
                </Suspense>
              </div>
            </div>

            {properties.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-[1.6rem] bg-white px-6 py-20 text-center shadow-soft ring-1 ring-navy-900/5">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                  <SearchX size={28} />
                </span>
                <div>
                  <h3 className="font-display text-xl text-navy-900">No exact matches, yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-navy-800/60">
                    Try a wider budget, fewer filters, or a nearby city. New homes are added every week.
                  </p>
                </div>
                <Link href={resetHref} className="btn-primary">
                  <RotateCcw size={15} /> Clear all filters
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* An inline ad card after every 6th listing (Admin → Ads & Banners). */}
                {properties.map((p, i) => (
                  <Fragment key={p.slug}>
                    <PropertyCard property={p} />
                    {(i + 1) % 6 === 0 && inlineAds[Math.floor(i / 6) % Math.max(inlineAds.length, 1)] && (
                      <div className="overflow-hidden rounded-xl2 shadow-soft">
                        <AdCreative ad={inlineAds[Math.floor(i / 6) % inlineAds.length]} variant="card" />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
