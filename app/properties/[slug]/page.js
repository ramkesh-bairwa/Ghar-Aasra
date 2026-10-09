import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryForm from "@/components/EnquiryForm";
import PropertyCard from "@/components/PropertyCard";
import { getPropertyBySlug, listProperties, getAgentBySlug, listAgents, getAmenities, getRecentVisitCount, getAllSiteSettings } from "@/lib/queries";
import { getFairPrice } from "@/lib/localities";
import FairPriceMeter from "@/components/FairPriceMeter";
import PriceWatchButton from "@/components/PriceWatchButton";
import AdSlot from "@/components/ads/AdSlot";
import { AMENITY_CATEGORIES } from "@/lib/amenityIcons";
import { propertyCoords } from "@/lib/geo";
import { whatsappUrl } from "@/lib/visitSlots";
import PropertyMiniMap from "@/components/PropertyMiniMap";
import PropertyShareActions from "@/components/PropertyShareActions";
import PropertyPageCompare from "@/components/PropertyPageCompare";
import VisitQuickBook from "@/components/VisitQuickBook";
import CallbackRequest from "@/components/CallbackRequest";
import StickyVisitBar from "@/components/StickyVisitBar";
import VisitPopup from "@/components/VisitPopup";
import PropertyGallery from "@/components/PropertyGallery";
import PropertySectionNav from "@/components/PropertySectionNav";
import ExpandableText from "@/components/ExpandableText";
import PropertyEmiCalculator from "@/components/PropertyEmiCalculator";
import AmenitiesShowcase from "@/components/AmenitiesShowcase";
import LoginGate from "@/components/LoginGate";
import SignedInOnly from "@/components/SignedInOnly";
import PropertyCostBreakdown from "@/components/PropertyCostBreakdown";
import PropertyQuestions from "@/components/PropertyQuestions";
import RecentlyViewed from "@/components/RecentlyViewed";
import CommuteCheck from "@/components/CommuteCheck";
import PrintBrochureButton from "@/components/PrintBrochureButton";
import { VideoTourSection, VirtualTourSection, DocumentsSection } from "@/components/property/PropertyMediaSections";
import FloorPlansSection from "@/components/property/FloorPlansSection";
import {
  BedDouble, Bath, Ruler, LandPlot, Layers, MapPin, DoorOpen, Building2,
  Compass, Armchair, HardHat, CalendarDays, Car, Clock, Sparkles, ShieldCheck, BadgeCheck, Landmark,
  Hash, TrendingUp, Calculator, Percent, Wallet, Receipt, CircleDollarSign, Eye, Clock3, Heart, Star,
  Phone, MessageCircle, BriefcaseBusiness, ArrowDownRight, ArrowUpRight, CheckCircle2, HelpCircle,
  HandCoins, KeyRound, CalendarCheck, Navigation, Tag,
} from "lucide-react";

export async function generateMetadata({ params }) {
  const property = await getPropertyBySlug(params.slug);
  return { title: property ? `${property.title}` : "Property" };
}

export default async function PropertyDetailsPage({ params }) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) notFound();

  const [agents, amenities, recentVisits, priceInsight, settings] = await Promise.all([
    listAgents(),
    getAmenities(),
    getRecentVisitCount(property.id),
    getFairPrice(property),
    getAllSiteSettings(),
  ]);
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

  // With floor plans, headline rooms/areas are ranges across the plans
  // ("1–3", "52–112 m²") so they always agree with the Floor plans section.
  const plans = property.floorPlans || [];
  const planRange = (key, unit = "") => {
    const vals = plans.map((p) => p[key]).filter((v) => v != null && v > 0);
    if (!vals.length) return null;
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const f = (n) => Number(n.toFixed(2)).toString();
    return lo === hi ? `${f(lo)}${unit}` : `${f(lo)}–${f(hi)}${unit}`;
  };
  const shown = {
    bedrooms: planRange("bedrooms") ?? property.bedrooms,
    bathrooms: planRange("bathrooms") ?? property.bathrooms,
    balconies: planRange("balconies") ?? (property.balconies > 0 ? property.balconies : null),
    carpetArea: planRange("carpetAreaSqm", " m²") ?? property.carpetArea,
    builtUpArea: planRange("builtUpAreaSqm", " m²") ?? property.builtUpArea,
  };

  // Falls back to a deterministic per-city pin (same logic the /map page
  // uses) when this listing doesn't have admin-entered coordinates, so the
  // map section shows for every property instead of only geocoded ones.
  const mapCoords = propertyCoords(property);

  const stats = [
    { label: "Bedrooms", value: shown.bedrooms, Icon: BedDouble, show: shown.bedrooms != null },
    { label: "Bathrooms", value: shown.bathrooms, Icon: Bath, show: shown.bathrooms != null },
    { label: "Carpet area", value: shown.carpetArea, Icon: Ruler, show: !!shown.carpetArea },
    { label: "Built-up area", value: shown.builtUpArea, Icon: Layers, show: !!shown.builtUpArea },
    { label: "Plot area", value: property.area !== "—" ? property.area : null, Icon: LandPlot, show: property.area !== "—" },
    { label: "Balconies", value: shown.balconies, Icon: DoorOpen, show: !!shown.balconies },
    {
      label: "Floor",
      value: property.totalFloors ? `${property.floorNumber ?? "?"} of ${property.totalFloors}` : property.floorNumber,
      Icon: Building2,
      show: property.floorNumber != null,
    },
  ].filter((s) => s.show);

  const isRent = property.listingType === "rent";
  // "No brokerage" is worth shouting about on rentals; otherwise an amount or N months' rent.
  const brokerageLabel =
    property.brokerageType === "none" ? "No brokerage"
    : property.brokerageType === "months" && property.brokerage ? `${property.brokerage} month${property.brokerage === 1 ? "" : "s"}' rent`
    : property.brokerage ? `${settings.currency_symbol}${property.brokerage.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : null;
  const availableFromLabel = (() => {
    if (!property.availableFrom) return null;
    const d = new Date(property.availableFrom);
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime() <= Date.now() ? "Immediately" : d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  })();
  // Full address line: street address + locality, city, state and PIN/ZIP —
  // skipping parts that are missing or already contained in the street address.
  const fullAddress = (() => {
    const base = property.address || "";
    const lower = base.toLowerCase();
    const extras = [property.locality, base ? null : property.city, property.state, property.zipCode]
      .filter(Boolean)
      .filter((part) => !lower.includes(String(part).toLowerCase()));
    return [base, ...extras].filter(Boolean).join(", ") || property.city;
  })();
  const landmarks = (property.nearbyLandmarks || "")
    .split(/\r?\n|[,;•]/)
    .map((l) => l.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);

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
    { label: "Ownership", value: property.ownershipType?.replace(/_/g, " "), Icon: ShieldCheck, show: !!property.ownershipType, group: "legal" },
    { label: "Listing condition", value: property.listingCondition, Icon: Sparkles, show: !!property.listingCondition, group: "legal" },
    { label: "Builder / developer", value: property.builderName, Icon: Landmark, show: !!property.builderName, group: "legal" },
    {
      label: "Tower / Unit",
      value: [property.towerBlock, property.unitNumber].filter(Boolean).join(" · "),
      Icon: Hash,
      show: !!(property.towerBlock || property.unitNumber),
      group: "legal",
    },
    { label: "Property ID", value: property.propertyCustomId || `FH-${property.id}`, Icon: Hash, show: true, group: "legal" },
    { label: "RERA number", value: property.reraNumber, Icon: BadgeCheck, show: !!property.reraNumber, group: "legal" },
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
    { label: "Property tax", value: property.propertyTaxStatus?.replace(/_/g, " "), Icon: Receipt, show: !!property.propertyTaxStatus, group: "legal" },
    { label: "Configuration", value: property.bhk, Icon: BedDouble, show: !!property.bhk },
    // Rental terms — only meaningful (and only shown) on rent listings.
    { label: "Brokerage", value: brokerageLabel, Icon: Receipt, show: isRent && !!brokerageLabel },
    {
      label: "Security deposit",
      value: property.securityDeposit ? `${settings.currency_symbol}${property.securityDeposit.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : null,
      Icon: HandCoins,
      show: isRent && !!property.securityDeposit,
    },
    { label: "Minimum rental period", value: property.minRentalPeriod, Icon: KeyRound, show: isRent && !!property.minRentalPeriod },
    {
      label: "Available from",
      value: availableFromLabel,
      Icon: CalendarCheck,
      show: isRent && !!availableFromLabel,
    },
  ].filter((d) => d.show);
  const detailGroups = [
    { key: "home", title: "Home details", subtitle: "How the home is set up", items: details.filter((d) => d.group !== "legal") },
    { key: "legal", title: "Ownership & legal", subtitle: "Paperwork and identifiers", items: details.filter((d) => d.group === "legal") },
  ].filter((g) => g.items.length);

  // Trust badges — only the ones that are actually true/present for this listing.
  const trustBadges = [
    { label: "Verified property", Icon: BadgeCheck, show: property.verified },
    { label: property.reraNumber ? `RERA: ${property.reraNumber}` : "RERA registered", Icon: ShieldCheck, show: !!property.reraNumber },
    { label: "Bank approved", Icon: Landmark, show: property.approved },
    { label: "Loan available", Icon: CircleDollarSign, show: property.loanAvailable },
    { label: "Price negotiable", Icon: HandCoins, show: property.negotiable },
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
    { label: "Price per m²", value: pricePerSqft ? pricePerSqft.toLocaleString() : null, Icon: Calculator },
    { label: "Expected rental yield", value: property.rentalYieldPercent ? `${property.rentalYieldPercent}%` : null, Icon: Percent },
    { label: "Estimated monthly rent", value: property.estimatedMonthlyRent ? property.estimatedMonthlyRent.toLocaleString() : null, Icon: Wallet },
    { label: "Capital appreciation", value: property.capitalAppreciation, Icon: TrendingUp },
    { label: "Brokerage", value: !isRent && property.brokerage ? property.brokerage.toLocaleString() : null, Icon: Receipt },
    { label: "Registration cost", value: property.registrationCharges ? property.registrationCharges.toLocaleString() : null, Icon: Receipt },
    { label: "Stamp duty", value: property.stampDuty ? property.stampDuty.toLocaleString() : null, Icon: Receipt },
  ].filter((f) => f.value);


  // ---------- Extra page sections (all derived from this listing's own data) ----------
  const isSale = property.listingType !== "rent" && property.pricePeriod === "one_time" && property.priceValue > 0;
  const areaUnitLabel = "m²";

  const listedDays = property.listedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(String(property.listedAt).replace(" ", "T")).getTime()) / 86400000))
    : null;
  const listedLabel =
    listedDays === null ? null : listedDays === 0 ? "Listed today" : listedDays === 1 ? "Listed yesterday" : `Listed ${listedDays} days ago`;

  // "Why you'll love it" — only claims that are true for this listing.
  const highlights = [
    property.verified && "Verified listing",
    property.reraNumber && "RERA registered",
    property.constructionStatus === "ready_to_move" && "Ready to move in",
    property.loanAvailable && "Home loan available",
    property.furnishing && property.furnishing !== "unfurnished" && `${property.furnishing.replace(/_/g, " ")}`,
    property.facing && `${property.facing.replace(/_/g, " ")} facing`,
    property.parking && "Dedicated parking",
    property.features?.length >= 5 && `${property.features.length} amenities`,
    premiumFeatures.length > 0 && `${premiumFeatures.length} premium feature${premiumFeatures.length > 1 ? "s" : ""}`,
    property.negotiable && "Price negotiable",
    property.videoUrl && "Video tour available",
    property.virtualTourUrl && "360° virtual tour",
    (property.floorPlans?.length || property.floorPlanUrl) && (property.floorPlans?.length > 1 ? `${property.floorPlans.length} floor plans` : "Floor plan available"),
    priceInsight && priceInsight.diffPercent <= -5 && `${Math.abs(priceInsight.diffPercent)}% below ${priceInsight.scope === "locality" ? priceInsight.label : "area"} average`,
  ].filter(Boolean);

  const costItems = [
    { label: "Property price", value: property.priceValue },
    { label: "Stamp duty", value: property.stampDuty || 0 },
    { label: "Registration", value: property.registrationCharges || 0 },
    { label: "Brokerage", value: property.brokerage || 0 },
    { label: "Other charges", value: property.otherCharges || 0 },
  ];

  const yesNo = (v) => (v ? "Yes." : "No.");
  const faqs = [
    { q: "Is parking available?", a: property.parking ? `Yes, ${property.parkingSpaces || 1} parking space${property.parkingSpaces > 1 ? "s" : ""}${property.parkingSlotNumber ? ` (slot ${property.parkingSlotNumber})` : ""}.` : "No dedicated parking is listed for this property." },
    property.furnishing && { q: "Is it furnished?", a: `It's ${property.furnishing.replace(/_/g, " ")}.` },
    property.constructionStatus && {
      q: "When can I move in?",
      a: property.constructionStatus === "ready_to_move"
        ? "It's ready to move in."
        : `It's currently ${property.constructionStatus.replace(/_/g, " ")}${property.possessionDate ? `, with possession expected ${new Date(property.possessionDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : ""}.`,
    },
    property.maintenanceCharges && { q: "What are the maintenance charges?", a: `${settings.currency_symbol}${property.maintenanceCharges.toLocaleString()}${property.maintenanceFrequency ? ` per ${property.maintenanceFrequency.replace(/_/g, " ").replace(/ly$/, "")}` : ""}.` },
    { q: "Is it RERA registered?", a: property.reraNumber ? `Yes, RERA number ${property.reraNumber}.` : "No RERA number has been provided for this listing. Ask our team for the latest documents." },
    isSale && { q: "Can I get a home loan?", a: property.loanAvailable ? `Yes, loans are available${property.approved ? " and the property is bank approved" : ""}. Use the loan planner below for an estimate.` : "Loan availability hasn't been confirmed for this listing. Our team can check with partner banks for you." },
    property.ownershipType && { q: "What type of ownership is it?", a: `${property.ownershipType.replace(/_/g, " ")}.` },
    { q: "Can I see it before deciding?", a: "Absolutely. Book a free visit or a video-call tour from this page. No sign-up needed." },
  ].filter(Boolean);

  const sectionTabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "pricing", label: "Pricing" },
    { id: "amenities", label: "Amenities" },
    { id: "floor-plans", label: "Floor plans" },
    { id: "video-tour", label: "Video" },
    { id: "virtual-tour", label: "360° tour" },
    { id: "documents", label: "Documents" },
    { id: "location", label: "Location" },
    { id: "faq", label: "FAQ" },
    { id: "emi", label: "Loan planner" },
    { id: "similar", label: "Similar" },
  ];

  // Indicative "EMI from" on the price card: 20% down, 8.5% p.a., 20 years.
  const emiFrom = isSale
    ? (() => {
        const loan = property.priceValue * 0.8;
        const r = 8.5 / 12 / 100;
        const n = 240;
        return Math.round((loan * r * (1 + r) ** n) / ((1 + r) ** n - 1));
      })()
    : null;
  const keyFacts = [
    shown.bedrooms && shown.bedrooms !== 0 && { Icon: BedDouble, label: `${shown.bedrooms} Beds` },
    shown.bathrooms && shown.bathrooms !== 0 && { Icon: Bath, label: `${shown.bathrooms} Baths` },
    (shown.builtUpArea || shown.carpetArea || (property.area !== "—" && property.area)) && {
      Icon: Ruler,
      label: shown.builtUpArea || shown.carpetArea || property.area,
    },
    property.furnishing && { Icon: Armchair, label: property.furnishing.replace(/_/g, "-").replace(/^./, (c) => c.toUpperCase()) },
    property.constructionStatus === "ready_to_move" && { Icon: CheckCircle2, label: "Ready to move" },
  ].filter(Boolean);

  const agentWhatsapp = agent ? whatsappUrl(agent.whatsapp || agent.phone, `Hi ${agent.name}, I'm interested in "${property.title}".`) : null;
  const commuteOrigin = property.latitude != null && property.longitude != null
    ? `${property.latitude},${property.longitude}`
    : property.address || property.city;

  return (
    <>
      <Header />
      <main className="bg-sand-50">
        <PropertyGallery images={[property.image, ...(property.gallery || [])]} title={property.title} hasVideo={!!property.videoUrl} />

        <div className="container-page pt-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-pill bg-teal-500 text-white">{property.tag}</span>
                {(property.categoryName || property.subcategoryName) && (
                  <span className="badge-pill bg-navy-900/8 text-navy-800/75">
                    {[property.categoryName, property.subcategoryName].filter(Boolean).join(" · ")}
                  </span>
                )}
                {property.verified && (
                  <span className="badge-pill gap-1 bg-teal-500/10 text-teal-700"><BadgeCheck size={13} /> Verified</span>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl text-navy-900 md:text-4xl">{property.title}</h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-navy-800/65">
                <MapPin size={15} className="text-teal-600" /> {fullAddress}
              </p>
              {keyFacts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {keyFacts.map(({ Icon, label }) => (
                    <span key={label} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-navy-900 shadow-soft ring-1 ring-navy-900/5">
                      <Icon size={15} className="text-teal-600" /> {label}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-800/50">
                {listedLabel && <span className="flex items-center gap-1"><Clock3 size={13} /> {listedLabel}</span>}
                {property.viewsCount > 0 && (
                  <span className="flex items-center gap-1"><Eye size={13} /> {property.viewsCount.toLocaleString()} view{property.viewsCount === 1 ? "" : "s"}</span>
                )}
                {recentVisits > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-coral-600">
                    <CalendarDays size={13} /> {recentVisits} visit{recentVisits === 1 ? "" : "s"} booked this month
                  </span>
                )}
              </div>
            </div>
            <SignedInOnly>
            <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 p-5 text-white shadow-card sm:w-auto sm:min-w-[290px]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-500/25 blur-2xl" />
              <div className="relative text-xs font-semibold uppercase tracking-wider text-teal-300">
                {property.listingType === "rent" ? (property.pricePeriod === "yearly" ? "Yearly rent" : "Monthly rent") : "Asking price"}
              </div>
              <div className="relative mt-1 font-display text-4xl">{property.price}</div>
              {isRent && (brokerageLabel || property.securityDeposit) && (
                <div className="relative mt-2 flex flex-wrap gap-1.5 text-xs">
                  {brokerageLabel && (
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${property.brokerageType === "none" ? "bg-teal-500 text-white" : "bg-white/10 text-white/80 ring-1 ring-white/15"}`}>
                      {property.brokerageType === "none" ? brokerageLabel : `Brokerage: ${brokerageLabel}`}
                    </span>
                  )}
                  {property.securityDeposit ? (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/80 ring-1 ring-white/15">
                      Deposit: {settings.currency_symbol}{property.securityDeposit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  ) : null}
                </div>
              )}
              <div className="relative mt-1 flex flex-wrap gap-x-3 text-xs text-white/60">
                {pricePerSqft && <span>{settings.currency_symbol}{pricePerSqft.toLocaleString()} / {areaUnitLabel}</span>}
                {emiFrom && (
                  <a href="#emi" className="font-semibold text-teal-300 hover:text-teal-200">
                    EMI from {settings.currency_symbol}{emiFrom.toLocaleString()}/mo
                  </a>
                )}
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2">
                <a href={`/properties/${property.slug}/visit`} className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
                  <CalendarDays size={15} /> Book visit
                </a>
                <a href="#enquire" className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15">
                  <MessageCircle size={15} /> Enquire
                </a>
              </div>
            </div>
            </SignedInOnly>
          </div>

          {highlights.length > 0 && (
            <SignedInOnly>
            <div className="mt-6 rounded-xl2 bg-gradient-to-r from-navy-900 to-navy-950 p-5 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                <Heart size={15} /> Why you&apos;ll love it
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <span key={h} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm capitalize ring-1 ring-white/10">
                    <CheckCircle2 size={14} className="text-teal-300" /> {h}
                  </span>
                ))}
              </div>
            </div>
            </SignedInOnly>
          )}
        </div>

        <LoginGate unlockedExtras={<VisitPopup property={property} />}>
        <div className="mt-6">
          <PropertySectionNav sections={sectionTabs} />
        </div>

        <section className="container-page grid gap-8 py-10 lg:grid-cols-[1.6fr,1fr]">
          <div className="min-w-0">
            <div id="overview">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <PropertyShareActions slug={property.slug} title={property.title} />
              </div>
              <PrintBrochureButton />
            </div>

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

            {property.tags?.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {property.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-navy-800/75 ring-1 ring-navy-900/8">
                    <Tag size={12} className="text-teal-600" /> {t}
                  </span>
                ))}
              </div>
            )}

            {stats.length > 0 && (
              <div className="card-surface grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-sand-50 to-white p-3.5 ring-1 ring-navy-900/5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                      <s.Icon size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="whitespace-nowrap font-display text-lg leading-tight text-navy-900">{s.value}</div>
                      <div className="text-[11px] uppercase tracking-wide text-navy-800/50">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card-surface mt-6 p-6">
              <h2 className="font-display text-xl text-navy-900">About this property</h2>
              <div className="mt-3">
                <ExpandableText text={property.description} />
              </div>
            </div>
            </div>

            {detailGroups.length > 0 && (
              <div id="details" className="card-surface mt-6 scroll-mt-40 p-6">
                <h2 className="font-display text-xl text-navy-900">Property details</h2>
                <p className="mt-1 text-sm text-navy-800/55">The facts you&apos;d ask about on a visit, all in one place.</p>
                <div className="mt-5 space-y-6">
                  {detailGroups.map((g) => (
                    <div key={g.key}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-navy-800/50">{g.title}</span>
                        <span className="h-px flex-1 bg-navy-900/8" />
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {g.items.map((d) => (
                          <div
                            key={d.label}
                            className="group flex items-center gap-3 rounded-2xl bg-sand-50 p-3 ring-1 ring-navy-900/5 transition-all hover:bg-white hover:shadow-card hover:ring-teal-500/30"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-navy-900/5 transition-colors group-hover:bg-teal-500 group-hover:text-white">
                              <d.Icon size={18} />
                            </span>
                            <div className="min-w-0">
                              <div className="text-[11px] uppercase tracking-wide text-navy-800/50">{d.label}</div>
                              <div className="break-words text-sm font-semibold capitalize leading-snug text-navy-900">{d.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isSale || financials.length > 0 || SCORES.length > 0 || priceInsight) && (
              <div id="pricing" className="card-surface mt-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl text-navy-900">{isSale ? "Price & costs" : "Investment & financials"}</h2>
                  {isSale && (
                    <a href="#emi" className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700">
                      <Calculator size={15} /> Calculate your EMI
                    </a>
                  )}
                </div>

                <FairPriceMeter insight={priceInsight} symbol={settings.currency_symbol} unit={areaUnitLabel} />

                {financials.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                  <div className="mt-5 grid gap-x-8 gap-y-3 border-t border-navy-900/8 pt-5 sm:grid-cols-2">
                    {SCORES.map((s) => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-xs text-navy-800/60">
                          <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {s.label}</span>
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

                {isSale && costItems.filter((c) => c.value > 0).length > 1 && (
                  <div className="mt-6 border-t border-navy-900/8 pt-5">
                    <h3 className="text-sm font-semibold text-navy-900">What you&apos;ll actually pay</h3>
                    <div className="mt-3">
                      <PropertyCostBreakdown items={costItems} />
                    </div>
                  </div>
                )}

              </div>
            )}

            {property.features?.length > 0 && (
              <div id="amenities" className="card-surface mt-6 scroll-mt-40 p-6">
                <AmenitiesShowcase
                  premium={premiumFeatures}
                  sections={amenitySections.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji, items: amenitiesByCategory[c.key] }))}
                />
              </div>
            )}

            <FloorPlansSection
              plans={property.floorPlans}
              floorPlanUrl={property.floorPlanUrl}
              sitePlanUrl={property.sitePlanUrl}
              symbol={settings.currency_symbol}
              slug={property.slug}
              isRent={isRent}
            />
            <VideoTourSection videoUrl={property.videoUrl} poster={property.image} title={property.title} />
            <VirtualTourSection url={property.virtualTourUrl} title={property.title} />
            {/* Plans live in Floor plans above; this keeps the brochure. */}
            <DocumentsSection brochureUrl={property.brochureUrl} />

            {(mapCoords || commuteOrigin) && (
              <div id="location" className="card-surface mt-6 overflow-hidden p-0">
                <div className="p-6 pb-4">
                  <h2 className="font-display text-xl text-navy-900">Location</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-800/60">
                    <MapPin size={14} className="text-teal-600" /> {fullAddress}
                  </p>
                  {landmarks.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-navy-800/50">Nearby landmarks</div>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {landmarks.map((l) => (
                          <li key={l} className="flex items-center gap-1.5 rounded-full bg-sand-50 px-3 py-1.5 text-sm text-navy-900 ring-1 ring-navy-900/5">
                            <Navigation size={13} className="text-teal-600" /> {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {mapCoords && (
                  <div className="h-80 w-full ring-1 ring-navy-900/5">
                    <PropertyMiniMap
                      coords={mapCoords}
                      title={property.title}
                      image={property.image}
                      price={property.price}
                      slug={property.slug}
                    />
                  </div>
                )}
                {commuteOrigin && (
                  <div className="p-6 print:hidden">
                    <CommuteCheck origin={commuteOrigin} />
                  </div>
                )}
              </div>
            )}

            <div id="faq" className="card-surface mt-6 p-6">
              <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
                <HelpCircle size={20} className="text-teal-600" /> Questions about this property
              </h2>
              <div className="mt-4">
                <PropertyQuestions faqs={faqs} propertyTitle={property.title} />
              </div>
            </div>
          </div>

          <div className="space-y-6 print:hidden">
            <VisitQuickBook property={property} recentVisits={recentVisits} />
            <PriceWatchButton propertyId={property.id} />

            {agent && (
              <div className="card-surface p-5">
                <a href={`/agents/${agent.slug}`} className="flex items-center gap-4">
                  <img src={agent.image} alt={agent.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-teal-500/30" />
                  <div className="min-w-0">
                    <div className="text-xs text-navy-800/50">Listed by</div>
                    <div className="font-display text-[16px] text-navy-900">{agent.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-navy-800/55">
                      {Number(agent.rating) > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={12} className="fill-amber-500 text-amber-500" /> {Number(agent.rating).toFixed(1)}
                          {agent.reviewCount > 0 && ` (${agent.reviewCount})`}
                        </span>
                      )}
                      {agent.yearsExperience > 0 && (
                        <span className="flex items-center gap-1"><BriefcaseBusiness size={12} /> {agent.yearsExperience} yrs</span>
                      )}
                      {agent.propertiesCount > 0 && <span>{agent.propertiesCount} listings</span>}
                    </div>
                  </div>
                </a>
                {(agent.phone || agentWhatsapp) && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {agent.phone && (
                      <a href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`} className="btn-outline justify-center px-3 py-2.5">
                        <Phone size={15} /> Call
                      </a>
                    )}
                    {agentWhatsapp && (
                      <a
                        href={agentWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            <CallbackRequest propertyId={property.id} propertyTitle={property.title} />
            <div id="enquire" className="scroll-mt-36">
              <EnquiryForm propertyId={property.id} agentId={agent?.id} propertySlug={property.slug} />
            </div>
            <AdSlot placement="property_sidebar" variant="sidebar" listingType={property.listingType} city={property.city} />
          </div>
        </section>

        <AdSlot placement="property_bottom" listingType={property.listingType} city={property.city} wrap />

        {isSale && (
          <section id="emi" className="scroll-mt-32 border-t border-navy-900/8 bg-gradient-to-b from-sand-100 to-sand-50 py-14 print:hidden">
            <div className="container-page">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                    <Calculator size={13} /> Loan planner
                  </span>
                  <h2 className="mt-3 font-display text-3xl text-navy-900">Plan your home loan</h2>
                  <p className="mt-1 max-w-xl text-[15px] text-navy-800/60">
                    Play with the numbers for {property.title}: down payment, rate, tenure, fees and prepayments.
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <PropertyEmiCalculator
                  price={property.priceValue}
                  slug={property.slug}
                  upfrontCharges={(property.stampDuty || 0) + (property.registrationCharges || 0) + (property.brokerage || 0) + (property.otherCharges || 0)}
                />
              </div>
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section id="similar" className="border-t border-navy-900/8 bg-white py-12 print:hidden">
            <div className="container-page">
              <h2 className="font-display text-2xl text-navy-900">Similar properties</h2>
              <p className="mt-1 text-sm text-navy-800/55">Other {property.listingType === "rent" ? "rentals" : "listings"} you might like. Each one can be visited too.</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((p) => (
                  <PropertyCard key={p.slug} property={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        <RecentlyViewed property={property} />
        <div className="print:hidden">
          <PropertyPageCompare />
        </div>
        </LoginGate>
        <StickyVisitBar property={property} />
      </main>
      <Footer />
    </>
  );
}
