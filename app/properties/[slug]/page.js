import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryForm from "@/components/EnquiryForm";
import PropertyCard from "@/components/PropertyCard";
import Link from "next/link";
import { getPropertyBySlug, listProperties, getAgentBySlug, listAgents, getAmenities, getCarpetAreaPresets } from "@/lib/queries";
import { getAmenityIcon, AMENITY_CATEGORIES } from "@/lib/amenityIcons";
import { propertyCoords } from "@/lib/geo";
import PropertyMiniMap from "@/components/PropertyMiniMap";
import PropertyShareActions from "@/components/PropertyShareActions";
import PropertyConfigSelector from "@/components/PropertyConfigSelector";
import PropertyPageCompare from "@/components/PropertyPageCompare";
import {
  BedDouble, Bath, Ruler, LandPlot, Layers, MapPin, CalendarCheck, ArrowRight, DoorOpen, Building2,
  Compass, Armchair, HardHat, CalendarDays, Car, Clock, Sparkles, ShieldCheck, BadgeCheck, Landmark,
  Hash, TrendingUp, Calculator, Percent, Wallet, Receipt, CircleDollarSign,
} from "lucide-react";

export async function generateMetadata({ params }) {
  const property = await getPropertyBySlug(params.slug);
  return { title: property ? `${property.title} — Flex Home` : "Property — Flex Home" };
}

export default async function PropertyDetailsPage({ params }) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) notFound();

  const [agents, amenities] = await Promise.all([listAgents(), getAmenities()]);
  const agent = property.agentId ? agents.find((a) => a.id === property.agentId) : null;
  const amenityMetaByName = Object.fromEntries(
    amenities.map((a) => [a.name.toLowerCase(), { iconKey: a.icon_key, category: a.category || "other" }])
  );

  // Group this property's features by category so the amenities section
  // reads as a scannable, labeled feature set rather than one long list —
  // matches the categories amenities are managed under in the admin panel.
  const amenitiesByCategory = {};
  for (const name of property.features || []) {
    const meta = amenityMetaByName[name.toLowerCase()];
    const key = meta?.category || "other";
    (amenitiesByCategory[key] ||= []).push({ name, iconKey: meta?.iconKey });
  }
  const amenitySections = AMENITY_CATEGORIES.filter((c) => c.key !== "premium_advanced" && amenitiesByCategory[c.key]?.length);
  const premiumFeatures = amenitiesByCategory.premium_advanced || [];

  const similar = (await listProperties({ listingType: property.listingType }))
    .filter((p) => p.slug !== property.slug)
    .slice(0, 3);

  const carpetAreaPresets = await getCarpetAreaPresets(property.subcategoryId);

  // Falls back to a deterministic per-city pin (same logic the /map page
  // uses) when this listing doesn't have admin-entered coordinates, so the
  // map section shows for every property instead of only geocoded ones.
  const mapCoords = propertyCoords(property);

  const stats = [
    { label: "Bedrooms", value: property.bedrooms, Icon: BedDouble, show: property.bedrooms != null },
    { label: "Bathrooms", value: property.bathrooms, Icon: Bath, show: property.bathrooms != null },
    { label: "Carpet area", value: property.carpetArea, Icon: Ruler, show: !!property.carpetArea },
    { label: "Built-up area", value: property.builtUpArea, Icon: Layers, show: !!property.builtUpArea },
    { label: "Plot area", value: property.area !== "—" ? property.area : null, Icon: LandPlot, show: property.area !== "—" },
    { label: "Balconies", value: property.balconies, Icon: DoorOpen, show: property.balconies > 0 },
    {
      label: "Floor",
      value: property.totalFloors ? `${property.floorNumber ?? "?"} of ${property.totalFloors}` : property.floorNumber,
      Icon: Building2,
      show: property.floorNumber != null,
    },
  ].filter((s) => s.show);

  const details = [
    { label: "Facing", value: property.facing?.replace(/_/g, " "), Icon: Compass, show: !!property.facing },
    { label: "Furnishing", value: property.furnishing?.replace(/_/g, " "), Icon: Armchair, show: !!property.furnishing },
    {
      label: "Construction status",
      value: property.constructionStatus?.replace(/_/g, " "),
      Icon: HardHat,
      show: !!property.constructionStatus,
    },
    {
      label: "Possession",
      value: property.possessionDate
        ? new Date(property.possessionDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })
        : null,
      Icon: CalendarDays,
      show: !!property.possessionDate,
    },
    { label: "Property age", value: property.propertyAge, Icon: Clock, show: !!property.propertyAge },
    {
      label: "Parking",
      value: property.parking
        ? `Yes (${property.parkingSpaces || 1} space${property.parkingSpaces > 1 ? "s" : ""})${property.parkingSlotNumber ? ` — ${property.parkingSlotNumber}` : ""}`
        : "No",
      Icon: Car,
      show: true,
    },
    { label: "Ownership", value: property.ownershipType?.replace(/_/g, " "), Icon: ShieldCheck, show: !!property.ownershipType },
    { label: "Listing condition", value: property.listingCondition, Icon: Sparkles, show: !!property.listingCondition },
    { label: "Builder / developer", value: property.builderName, Icon: Landmark, show: !!property.builderName },
    {
      label: "Tower / Unit",
      value: [property.towerBlock, property.unitNumber].filter(Boolean).join(" · "),
      Icon: Hash,
      show: !!(property.towerBlock || property.unitNumber),
    },
    { label: "Property ID", value: property.propertyCustomId || `FH-${property.id}`, Icon: Hash, show: true },
    {
      label: "Last renovated",
      value: property.lastRenovatedDate
        ? new Date(property.lastRenovatedDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })
        : null,
      Icon: CalendarDays,
      show: !!property.lastRenovatedDate,
    },
    {
      label: "Maintenance",
      value: property.maintenanceCharges
        ? `${property.maintenanceCharges.toLocaleString()}${property.maintenanceFrequency ? ` / ${property.maintenanceFrequency.replace(/_/g, " ")}` : ""}`
        : null,
      Icon: Wallet,
      show: !!property.maintenanceCharges,
    },
    { label: "Property tax", value: property.propertyTaxStatus?.replace(/_/g, " "), Icon: Receipt, show: !!property.propertyTaxStatus },
  ].filter((d) => d.show);

  // Trust badges — only the ones that are actually true/present for this listing.
  const trustBadges = [
    { label: "Verified property", Icon: BadgeCheck, show: property.verified },
    { label: property.reraNumber ? `RERA: ${property.reraNumber}` : "RERA registered", Icon: ShieldCheck, show: !!property.reraNumber },
    { label: "Bank approved", Icon: Landmark, show: property.approved },
    { label: "Loan available", Icon: CircleDollarSign, show: property.loanAvailable },
  ].filter((b) => b.show);

  const SCORES = [
    { label: "Investment score", value: property.investmentScore },
    { label: "Rental demand", value: property.rentalDemandScore },
    { label: "Location growth", value: property.locationGrowthScore },
    { label: "Future development", value: property.futureDevelopmentScore },
  ].filter((s) => s.value != null);

  const pricingArea = property.builtUpAreaSqm || property.carpetAreaSqm || property.areaSqm;
  const pricePerSqft = property.priceValue && pricingArea ? Math.round(property.priceValue / pricingArea) : null;

  const financials = [
    { label: "Price per sq.ft.", value: pricePerSqft ? pricePerSqft.toLocaleString() : null, Icon: Calculator },
    { label: "Expected rental yield", value: property.rentalYieldPercent ? `${property.rentalYieldPercent}%` : null, Icon: Percent },
    { label: "Estimated monthly rent", value: property.estimatedMonthlyRent ? property.estimatedMonthlyRent.toLocaleString() : null, Icon: Wallet },
    { label: "Capital appreciation", value: property.capitalAppreciation, Icon: TrendingUp },
    { label: "Brokerage", value: property.brokerage ? property.brokerage.toLocaleString() : null, Icon: Receipt },
    { label: "Registration cost", value: property.registrationCharges ? property.registrationCharges.toLocaleString() : null, Icon: Receipt },
    { label: "Stamp duty", value: property.stampDuty ? property.stampDuty.toLocaleString() : null, Icon: Receipt },
  ].filter((f) => f.value);

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <div className="relative h-[420px] w-full">
          <img src={property.image} alt={property.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" />
          <div className="container-page absolute inset-x-0 bottom-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="badge-pill bg-teal-500 text-white">{property.tag}</span>
              {(property.categoryName || property.subcategoryName) && (
                <span className="ml-2 badge-pill bg-white/15 text-white/90">
                  {[property.categoryName, property.subcategoryName].filter(Boolean).join(" · ")}
                </span>
              )}
              <h1 className="mt-3 font-display text-3xl text-white md:text-4xl">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-white/75">
                <MapPin size={15} /> {property.address || property.city}
              </p>
            </div>
            <div className="rounded-xl2 bg-white px-5 py-3 shadow-card">
              <div className="text-xs text-navy-800/50">Price</div>
              <div className="font-display text-2xl text-navy-900">{property.price}</div>
            </div>
          </div>
        </div>

        <section className="container-page grid gap-8 py-12 lg:grid-cols-[1.6fr,1fr]">
          <div>
            <PropertyShareActions slug={property.slug} title={property.title} />

            {trustBadges.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {trustBadges.map(({ label, Icon }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-500/20"
                  >
                    <Icon size={14} /> {label}
                  </span>
                ))}
              </div>
            )}

            {stats.length > 0 && (
              <div className="card-surface grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 md:grid-cols-5">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-sand-50 py-4 text-center">
                    <s.Icon size={20} className="text-teal-600" />
                    <div className="font-display text-base text-navy-900">{s.value}</div>
                    <div className="text-[11px] text-navy-800/50">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="card-surface mt-6 p-6">
              <h2 className="font-display text-xl text-navy-900">About this property</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-800/70">{property.description}</p>
            </div>

            {details.length > 0 && (
              <div className="card-surface mt-6 p-6">
                <h2 className="font-display text-xl text-navy-900">Property details</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {details.map((d) => (
                    <div key={d.label} className="flex items-start gap-2.5">
                      <d.Icon size={17} className="mt-0.5 shrink-0 text-teal-600" />
                      <div>
                        <div className="text-[11px] text-navy-800/50">{d.label}</div>
                        <div className="text-sm font-medium capitalize text-navy-900">{d.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PropertyConfigSelector presets={carpetAreaPresets} image={property.image} title={property.title} />

            {(financials.length > 0 || SCORES.length > 0) && (
              <div className="card-surface mt-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl text-navy-900">Investment &amp; financials</h2>
                  <Link href="/loan-calculator" className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700">
                    <Calculator size={15} /> Calculate EMI
                  </Link>
                </div>

                {financials.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {financials.map((f) => (
                      <div key={f.label} className="flex items-start gap-2.5">
                        <f.Icon size={17} className="mt-0.5 shrink-0 text-teal-600" />
                        <div>
                          <div className="text-[11px] text-navy-800/50">{f.label}</div>
                          <div className="text-sm font-medium capitalize text-navy-900">{f.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {SCORES.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-navy-900/8 pt-5">
                    {SCORES.map((s) => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-xs text-navy-800/60">
                          <span>{s.label}</span>
                          <span className="font-semibold text-navy-900">{s.value}/5</span>
                        </div>
                        <div className="mt-1.5 flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= s.value ? "bg-teal-500" : "bg-navy-900/8"}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {property.videoUrl && (
              <div className="card-surface mt-6 p-6">
                <h2 className="font-display text-xl text-navy-900">Video tour</h2>
                <video src={property.videoUrl} controls className="mt-4 w-full rounded-xl2" />
              </div>
            )}

            {property.gallery?.length > 0 && (
              <div className="card-surface mt-6 p-6">
                <h2 className="font-display text-xl text-navy-900">Gallery</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.gallery.map((url) => (
                    <img key={url} src={url} alt={property.title} className="h-32 w-full rounded-xl object-cover" />
                  ))}
                </div>
              </div>
            )}

            {property.features?.length > 0 && (
              <div className="card-surface mt-6 overflow-hidden p-0">
                <div className="p-6 pb-1">
                  <h2 className="font-display text-xl text-navy-900">Amenities &amp; features</h2>
                  <p className="mt-1 text-sm text-navy-800/50">
                    {property.features.length} feature{property.features.length === 1 ? "" : "s"} at this property
                  </p>
                </div>

                {premiumFeatures.length > 0 && (
                  <div className="mx-6 mt-4 overflow-hidden rounded-xl2 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 p-5 ring-1 ring-teal-400/20">
                    <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                      <Sparkles size={16} /> Premium &amp; advanced features
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {premiumFeatures.map(({ name, iconKey }) => {
                        const Icon = getAmenityIcon(iconKey);
                        return (
                          <span
                            key={name}
                            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/10"
                          >
                            <Icon size={14} className="text-teal-300" /> {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
                  {amenitySections.map((section) => (
                    <div key={section.key}>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                        <span aria-hidden>{section.emoji}</span> {section.label}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {amenitiesByCategory[section.key].map(({ name, iconKey }) => {
                          const Icon = getAmenityIcon(iconKey);
                          return (
                            <div key={name} className="flex items-center gap-2 text-sm text-navy-800/70">
                              <Icon size={15} className="shrink-0 text-teal-600" /> {name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mapCoords && (
              <div className="card-surface mt-6 overflow-hidden p-0">
                <div className="p-6 pb-4">
                  <h2 className="font-display text-xl text-navy-900">Location</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-800/60">
                    <MapPin size={14} className="text-teal-600" /> {property.address || property.city}
                  </p>
                </div>
                <div className="h-80 w-full ring-1 ring-navy-900/5">
                  <PropertyMiniMap
                    coords={mapCoords}
                    title={property.title}
                    image={property.image}
                    price={property.price}
                    slug={property.slug}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Link
              href={`/properties/${property.slug}/visit`}
              className="flex items-center gap-4 rounded-xl2 bg-navy-900 p-5 text-white shadow-soft ring-1 ring-navy-900/5 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
                <CalendarCheck size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[17px]">Book a visit</div>
                <div className="text-xs text-white/55">Pick a day & time to tour this property</div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-white/50" />
            </Link>

            {agent && (
              <a href={`/agents/${agent.slug}`} className="card-surface flex items-center gap-4 p-5">
                <img src={agent.image} alt={agent.name} className="h-16 w-16 rounded-full object-cover" />
                <div>
                  <div className="text-xs text-navy-800/50">Listed by</div>
                  <div className="font-display text-[16px] text-navy-900">{agent.name}</div>
                  <div className="text-xs text-teal-600">View profile</div>
                </div>
              </a>
            )}
            <EnquiryForm propertyId={property.id} agentId={agent?.id} />
          </div>
        </section>

        {similar.length > 0 && (
          <section className="border-t border-navy-900/8 bg-white py-12">
            <div className="container-page">
              <h2 className="font-display text-2xl text-navy-900">Similar properties</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((p) => (
                  <PropertyCard key={p.slug} property={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        <PropertyPageCompare />
      </main>
      <Footer />
    </>
  );
}
