"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Home, Building, Building2, Briefcase, Store, LandPlot, Trees, Tag, KeyRound, Sparkles, BedDouble, Bath,
  Ruler, MapPin, Wallet, Image as ImageIcon, Video, ShieldCheck, ClipboardCheck, ArrowLeft, ArrowRight,
  Check, Loader2, Compass, Sofa, HardHat, Car, Layers, Youtube, Upload, Star, Trash2,
  FileText, Map as MapIcon, Rocket, Save, Search, CheckCircle2, Wand2, Eye, PartyPopper, Plus, Globe, Lightbulb, BadgePercent, AlertCircle,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { AMENITY_CATEGORIES, getAmenityIcon } from "@/lib/amenityIcons";
import {
  Section, Field, SuffixInput, ChipGroup, Stepper, Toggle, FileUpload, uploadFile, inputClass, humanize,
} from "@/components/vendor/listing/WizardUI";
import LocationPicker from "@/components/vendor/listing/LocationPicker";
import FloorPlansEditor from "@/components/vendor/listing/FloorPlansEditor";
import { useDialog } from "@/components/ConfirmDialog";

const STEPS = [
  { key: "basics", label: "Property type", Icon: Home },
  { key: "details", label: "Details", Icon: BedDouble },
  { key: "location", label: "Location", Icon: MapPin },
  { key: "pricing", label: "Price", Icon: Wallet },
  { key: "amenities", label: "Amenities", Icon: Sparkles },
  { key: "media", label: "Photos & video", Icon: ImageIcon },
  { key: "legal", label: "Legal & extras", Icon: ShieldCheck },
  { key: "review", label: "Review & publish", Icon: ClipboardCheck },
];

// One practical tip per step, shown beside the live preview.
const TIPS = {
  basics: "Titles that mention the type, size and area get the most clicks, e.g. \"Sunny 2 BHK near Metro, Andheri West\".",
  details: "Accurate areas build trust. Buyers compare carpet area across listings.",
  location: "Search your building or tap the map, and the address fills itself. The pin is optional, but pinned homes also show up in map search.",
  pricing: "Show the full cost up front. On rentals, \"No brokerage\" is one of the strongest reasons tenants enquire.",
  amenities: "Listings with 5 or more amenities get noticeably more enquiries.",
  media: "Use bright, landscape photos. The first one is your cover, and 5+ photos is the sweet spot.",
  legal: "A RERA number and clear ownership details make buyers far more comfortable booking a visit.",
  review: "You can edit anything later from My listings, so publishing now is fine.",
};

const BROKERAGE_TYPES = { none: "No brokerage", fixed: "Fixed amount", months: "Months of rent" };

// Server field names that the form shows under a differently named field.
const SERVER_FIELD_ALIAS = { cover_image_url: "photos", subcategory_id: "property_type", category_id: "property_type", latitude: "map", longitude: "map" };

// Which step each field lives on, so a server-side error can jump there.
const FIELD_STEP = {
  basics: ["listing_type", "property_type", "title", "description"],
  details: ["bedrooms", "bathrooms", "balconies", "floor_number", "total_floors", "property_age", "carpet_area_sqm", "built_up_area_sqm", "area_sqm", "facing", "furnishing", "construction_status", "possession_date", "parking_spaces", "bhk"],
  location: ["location_id", "locality", "address", "state", "zip_code", "nearby_landmarks", "map"],
  pricing: ["price", "price_period", "maintenance_charges", "maintenance_frequency", "security_deposit", "min_rental_period", "available_from", "brokerage", "brokerage_type", "registration_charges", "stamp_duty", "other_charges", "estimated_monthly_rent", "rental_yield_percent", "capital_appreciation"],
  media: ["photos", "video_url", "virtual_tour_url", "floor_plan_url", "site_plan_url", "brochure_url"],
  legal: ["owner_name", "ownership_type", "rera_number", "listing_condition", "property_tax_status", "builder_name", "tower_block", "unit_number", "parking_slot_number", "property_custom_id", "last_renovated_date", "tags"],
};
const stepOfField = (field) =>
  field.startsWith("floorPlans.") ? "media" : Object.keys(FIELD_STEP).find((k) => FIELD_STEP[k].includes(field)) || "basics";

// Subcategory slug → DB property_type + icon (falls back by category).
const TYPE_BY_SLUG = {
  apartment: ["apartment", Building], flat: ["apartment", Building], villa: ["villa", Home], house: ["house", Home],
  "independent-house": ["house", Home], office: ["office", Briefcase], "commercial-space": ["commercial", Store],
  shop: ["commercial", Store], warehouse: ["commercial", Building2], plot: ["land", LandPlot], land: ["land", Trees],
};
const TYPE_BY_CATEGORY = { residential: ["apartment", Home], commercial: ["commercial", Store], land: ["land", Trees] };

function typeFor(sub, category) {
  return TYPE_BY_SLUG[sub.slug] || TYPE_BY_CATEGORY[category.slug] || ["apartment", Home];
}

// Which detail questions each property type asks, and how they're worded.
// Fields a type doesn't ask about are cleared on save.
const PROFILES = {
  apartment: {
    noun: "flat", bedrooms: true, bathLabel: "Bathrooms", balconies: true, floorNumber: true,
    totalFloors: "Total floors in building", carpet: true, builtUp: true, plot: false,
    furnishing: { furnished: "Furnished", semi_furnished: "Semi-furnished", unfurnished: "Unfurnished" },
    construction: true, age: true, parking: true, unitDetails: true,
  },
  villa: {
    noun: "villa", bedrooms: true, bathLabel: "Bathrooms", balconies: true, floorNumber: false,
    totalFloors: "Number of storeys", carpet: true, builtUp: true, plot: "Plot area",
    furnishing: { furnished: "Furnished", semi_furnished: "Semi-furnished", unfurnished: "Unfurnished" },
    construction: true, age: true, parking: true, unitDetails: false,
  },
  house: {
    noun: "house", bedrooms: true, bathLabel: "Bathrooms", balconies: true, floorNumber: false,
    totalFloors: "Number of storeys", carpet: true, builtUp: true, plot: "Plot area",
    furnishing: { furnished: "Furnished", semi_furnished: "Semi-furnished", unfurnished: "Unfurnished" },
    construction: true, age: true, parking: true, unitDetails: false,
  },
  land: {
    noun: "plot", bedrooms: false, bathLabel: null, balconies: false, floorNumber: false,
    totalFloors: null, carpet: false, builtUp: false, plot: "Plot area",
    furnishing: null, construction: false, age: false, parking: false, unitDetails: false,
  },
  office: {
    noun: "office", bedrooms: false, bathLabel: "Washrooms", balconies: false, floorNumber: true,
    totalFloors: "Total floors in building", carpet: true, builtUp: true, plot: false,
    furnishing: { furnished: "Fully furnished", semi_furnished: "Warm shell", unfurnished: "Bare shell" },
    construction: true, age: true, parking: true, unitDetails: true,
  },
  commercial: {
    noun: "space", bedrooms: false, bathLabel: "Washrooms", balconies: false, floorNumber: true,
    totalFloors: "Total floors in building", carpet: true, builtUp: true, plot: false,
    furnishing: { furnished: "Fully furnished", semi_furnished: "Warm shell", unfurnished: "Bare shell" },
    construction: true, age: true, parking: true, unitDetails: true,
  },
};

// Resets the answers to questions this type doesn't ask.
function clearUnasked(body, profile) {
  if (!profile.bedrooms) Object.assign(body, { bedrooms: 0, bhk: "" });
  if (!profile.bathLabel) body.bathrooms = 0;
  if (!profile.balconies) body.balconies = 0;
  if (!profile.floorNumber) body.floor_number = "";
  if (!profile.totalFloors) body.total_floors = "";
  if (!profile.carpet) body.carpet_area_sqm = "";
  if (!profile.builtUp) body.built_up_area_sqm = "";
  if (!profile.furnishing) body.furnishing = "";
  if (!profile.construction) Object.assign(body, { construction_status: "", possession_date: "" });
  if (!profile.age) body.property_age = "";
  if (!profile.parking) Object.assign(body, { parking: false, parking_spaces: "", parking_slot_number: "" });
  if (!profile.unitDetails) Object.assign(body, { tower_block: "", unit_number: "" });
  return body;
}

const FACING = ["north", "north_east", "east", "south_east", "south", "south_west", "west", "north_west"];

const EMPTY = {
  listing_type: "sale", property_type: "", category_id: "", subcategory_id: "", title: "", description: "",
  bedrooms: 0, bathrooms: 0, balconies: 0, bhk: "", floor_number: "", total_floors: "",
  carpet_area_sqm: "", built_up_area_sqm: "", area_sqm: "",
  facing: "", furnishing: "", construction_status: "", possession_date: "", property_age: "",
  parking: false, parking_spaces: "",
  location_id: "", city_name: "", country: "", locality: "", address: "", state: "", zip_code: "", nearby_landmarks: "", latitude: "", longitude: "",
  price: "", price_period: "monthly", negotiable: false, loan_available: false,
  maintenance_charges: "", maintenance_frequency: "", security_deposit: "", min_rental_period: "", available_from: "",
  brokerage: "", brokerage_type: "", registration_charges: "", stamp_duty: "", other_charges: "",
  estimated_monthly_rent: "", rental_yield_percent: "", capital_appreciation: "",
  cover_image_url: "", video_url: "", virtual_tour_url: "", floor_plan_url: "", site_plan_url: "", brochure_url: "",
  owner_name: "", ownership_type: "", rera_number: "", listing_condition: "", builder_name: "", tower_block: "",
  unit_number: "", parking_slot_number: "", property_custom_id: "", last_renovated_date: "", property_tax_status: "",
  tags: "",
};

function videoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: "file", src: url };
}

function money(symbol, n) {
  return `${symbol}${Number(n || 0).toLocaleString("en-US")}`;
}

// Completeness checklist shared by the review step and the live preview.
function checklist(f, gallery, features, floorPlans = []) {
  return [
    { label: "Property type & title", done: !!(f.property_type && f.title) },
    { label: "Price", done: Number(f.price) > 0 },
    { label: "Cover photo", done: !!f.cover_image_url },
    { label: "5+ photos", done: gallery.length + (f.cover_image_url ? 1 : 0) >= 5 },
    { label: "Video tour", done: !!f.video_url },
    { label: "Description (150+ characters)", done: (f.description || "").length >= 150 },
    { label: "5+ amenities", done: features.length >= 5 },
    { label: "City & address", done: !!(f.location_id && f.address) },
    { label: "Map pin", done: !!(f.latitude && f.longitude) },
    { label: "Area", done: !!(f.carpet_area_sqm || f.built_up_area_sqm || f.area_sqm) },
    { label: "Floor plan", done: !!f.floor_plan_url || floorPlans.length > 0 },
  ];
}

export default function ListingWizard({ data, initial = null, propertyId = null }) {
  const { currency_symbol: symbol = "$" } = useSiteSettings();
  const { locations, amenities, categories, presets, commercialEnabled, floorPlanTypes = [] } = data;
  const isEdit = !!propertyId;

  const [f, setF] = useState(() => {
    const base = { ...EMPTY };
    if (!initial) return base;
    const merged = { ...base };
    for (const k of Object.keys(EMPTY)) if (initial[k] !== undefined && initial[k] !== null) merged[k] = initial[k];
    const loc = locations.find((l) => String(l.id) === String(merged.location_id));
    if (loc) Object.assign(merged, { city_name: loc.city, country: loc.country || "" });
    merged.parking = !!Number(initial.parking);
    merged.negotiable = !!Number(initial.negotiable);
    merged.loan_available = !!Number(initial.loan_available);
    if (merged.price_period === "one_time") merged.price_period = "monthly";
    return merged;
  });
  const [gallery, setGallery] = useState(() => [...new Set(initial?.gallery || [])].filter((u) => u !== initial?.cover_image_url));
  const [features, setFeatures] = useState(initial?.features || []);
  // MySQL DECIMALs arrive as "52.00"; show them as 52.
  const [floorPlans, setFloorPlans] = useState(() =>
    (initial?.floorPlans || []).map((p) => Object.fromEntries(Object.entries(p).map(([k, x]) => [k, x == null ? "" : /^\d+\.\d+$/.test(String(x)) ? String(Number(x)) : x])))
  );
  const { confirm: ask, dialog } = useDialog();
  const confirmFileRemove = () => ask({ title: "Remove this file?", message: "It will be removed from your listing when you save.", confirmLabel: "Remove" });
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(() => new Set(isEdit ? STEPS.map((_, i) => i) : [0]));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null); // "draft" | "published" | null
  const [done, setDone] = useState(null);
  const [videoMode, setVideoMode] = useState(initial?.video_url && !/^\/uploads\//.test(initial.video_url) ? "link" : "upload");
  const [amenitySearch, setAmenitySearch] = useState("");
  const [photoProgress, setPhotoProgress] = useState(null);
  const photoInput = useRef(null);
  const topRef = useRef(null);

  // Field errors sent back by the server on save, shown under each field
  // until the seller edits it.
  const [serverErrors, setServerErrors] = useState({});
  const set = (key, value) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setServerErrors((e) => {
      const alias = Object.entries(SERVER_FIELD_ALIAS).filter(([, v]) => v === key).map(([k]) => k);
      if (!e[key] && !alias.some((a) => e[a])) return e;
      const next = { ...e };
      delete next[key];
      alias.forEach((a) => delete next[a]);
      return next;
    });
  };

  // ?step=media (etc.) opens the form on that step — used by dashboard tips.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("step");
    const i = STEPS.findIndex((s) => s.key === wanted);
    if (i > 0) setStep(i);
  }, []);
  const isLand = f.property_type === "land";
  const profile = PROFILES[f.property_type] || PROFILES.apartment;
  const isRent = f.listing_type === "rent";
  const city = f.city_name.trim() || locations.find((l) => String(l.id) === String(f.location_id))?.city;
  // Typed or map-picked city: link it to a city we already list when the
  // name matches, otherwise it's saved as a new city.
  const matchCity = (name) => locations.find((l) => l.city.toLowerCase() === String(name || "").trim().toLowerCase());
  const isNewCity = !!f.city_name.trim() && !matchCity(f.city_name);
  const subPresets = presets.filter((p) => String(p.subcategory_id) === String(f.subcategory_id));
  const subName = categories.flatMap((c) => c.subcategories).find((s) => String(s.id) === String(f.subcategory_id))?.name;
  const checks = checklist(f, gallery, features, floorPlans);
  const strength = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const embed = videoEmbed(f.video_url);

  function goTo(i) {
    setStep(i);
    setVisited((v) => new Set(v).add(i));
    setError("");
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseType(sub, category) {
    const [propertyType] = typeFor(sub, category);
    setF((prev) => ({ ...prev, subcategory_id: sub.id, category_id: category.id, property_type: propertyType }));
  }

  function applyPreset(p) {
    // Plot presets describe land area; room presets describe the unit.
    if (isLand) return setF((prev) => ({ ...prev, bhk: p.label, area_sqm: p.carpet_area_sqm ?? prev.area_sqm }));
    setF((prev) => ({
      ...prev,
      bhk: p.label,
      bedrooms: p.bedrooms ?? prev.bedrooms,
      carpet_area_sqm: p.carpet_area_sqm ?? prev.carpet_area_sqm,
      built_up_area_sqm: p.built_up_area_sqm ?? prev.built_up_area_sqm,
    }));
  }

  function suggestTitle() {
    const beds = profile.bedrooms && f.bedrooms ? `${f.bedrooms} BHK ` : "";
    const area = f.built_up_area_sqm || f.carpet_area_sqm || f.area_sqm;
    const furnished = f.furnishing === "furnished" ? "Furnished " : "";
    const where = f.locality || city;
    set("title", `${furnished}${beds}${subName || humanize(f.property_type) || "Property"}${area ? ` · ${area} m²` : ""}${where ? ` in ${where}` : ""}`.trim());
  }

  // A place picked on the map fills address fields the seller left blank
  // (never overwrites what they typed), and switches the city if it's one we list.
  function fillFromPlace(parts) {
    setF((prev) => {
      const next = { ...prev };
      if (!prev.address.trim() && parts.street) next.address = parts.street;
      if (!prev.locality.trim() && parts.locality) next.locality = parts.locality;
      if (!prev.state.trim() && parts.state) next.state = parts.state;
      if (!prev.zip_code.trim() && parts.zip) next.zip_code = parts.zip;
      // The city always follows the spot picked on the map.
      if (parts.city) {
        const match = matchCity(parts.city);
        next.city_name = match ? match.city : parts.city;
        next.location_id = match ? match.id : "";
        next.country = match?.country || parts.country || prev.country;
      }
      return next;
    });
  }

  async function addPhotos(e) {
    const files = Array.from(e.target.files || []).slice(0, 20 - gallery.length - (f.cover_image_url ? 0 : 1));
    if (!files.length) return;
    setError("");
    // The first photo becomes the cover if there isn't one yet. Tracked
    // here rather than inside a state updater: updaters must stay pure
    // (React may run them twice), which used to add each photo twice.
    let hasCover = !!f.cover_image_url;
    try {
      for (const [i, file] of files.entries()) {
        setPhotoProgress(`${i + 1}/${files.length}`);
        const url = await uploadFile(file);
        if (!hasCover) {
          hasCover = true;
          setF((prev) => ({ ...prev, cover_image_url: prev.cover_image_url || url }));
        } else {
          setGallery((g) => (g.includes(url) ? g : [...g, url]));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoProgress(null);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  function makeCover(url) {
    setGallery((g) => [...g.filter((u) => u !== url), ...(f.cover_image_url ? [f.cover_image_url] : [])]);
    set("cover_image_url", url);
  }

  function removePhoto(url) {
    if (url === f.cover_image_url) {
      const [next, ...rest] = gallery;
      set("cover_image_url", next || "");
      setGallery(rest);
    } else {
      setGallery((g) => g.filter((u) => u !== url));
    }
  }

  function toggleFeature(name) {
    setFeatures((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  }

  // Required-field rules per step → { field: message }. Only questions the
  // chosen property type actually asks are checked.
  function validate(key) {
    const e = {};
    const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
    const isUrl = (v) => /^https?:\/\/\S+$/i.test(String(v || "").trim());
    if (key === "basics") {
      if (!f.listing_type) e.listing_type = "Choose whether you want to sell or rent out.";
      if (!f.subcategory_id) e.property_type = "Choose a property type.";
      if (!f.title.trim()) e.title = "Add a title for your listing.";
      else if (f.title.trim().length < 10) e.title = "Make the title a little longer (at least 10 characters).";
      if (!f.description.trim()) e.description = "Describe the property.";
      else if (f.description.trim().length < 30) e.description = "Write at least 30 characters so buyers know what to expect.";
    }
    if (key === "details") {
      if (!f.subcategory_id) e.property_type = "Choose a property type first.";
      if (profile.bedrooms && f.property_type !== "apartment" && !(Number(f.bedrooms) >= 1)) e.bedrooms = "Add at least 1 bedroom.";
      if (profile.bathLabel && !(Number(f.bathrooms) >= 1)) e.bathrooms = `Add at least 1 ${profile.bathLabel.toLowerCase().replace(/s$/, "")}.`;
      if (profile.floorNumber && num(f.floor_number) === null) e.floor_number = "Enter the floor (0 for ground).";
      if (profile.totalFloors && !(num(f.total_floors) >= 1)) e.total_floors = "Enter the number of floors.";
      if (profile.floorNumber && num(f.floor_number) !== null && num(f.total_floors) !== null && num(f.floor_number) > num(f.total_floors)) {
        e.floor_number = "The floor can't be higher than the total floors.";
      }
      if (profile.carpet && !(num(f.carpet_area_sqm) > 0)) e.carpet_area_sqm = "Enter the carpet area.";
      if (profile.builtUp && num(f.built_up_area_sqm) !== null && num(f.carpet_area_sqm) > num(f.built_up_area_sqm)) {
        e.built_up_area_sqm = "Built-up area is usually larger than carpet area.";
      }
      if (isLand && !(num(f.area_sqm) > 0)) e.area_sqm = "Enter the plot area.";
      if (profile.furnishing && !f.furnishing) e.furnishing = "Choose the furnishing.";
      if (profile.construction && !f.construction_status) e.construction_status = "Choose the construction status.";
      if (profile.construction && ["under_construction", "new_launch"].includes(f.construction_status) && !f.possession_date) {
        e.possession_date = "Add the expected possession date.";
      }
    }
    if (key === "location") {
      if (!f.location_id && !f.city_name.trim()) e.location_id = "Enter the city, or pick the spot on the map and it fills in.";
      else if (f.city_name.trim().length < 2) e.location_id = "Enter the full city name.";
      if (!f.locality.trim()) e.locality = "Enter the locality or area.";
      if (!f.address.trim()) e.address = "Enter the street address.";
      if ((f.latitude === "") !== (f.longitude === "")) e.map = "The map pin looks incomplete. Drop it again or remove it.";
    }
    if (key === "pricing") {
      if (!(num(f.price) > 0)) e.price = isRent ? "Enter the rent amount." : "Enter the asking price.";
      if (num(f.maintenance_charges) > 0 && !f.maintenance_frequency) e.maintenance_frequency = "How often is maintenance charged?";
      if (isRent && !(num(f.security_deposit) >= 0 && f.security_deposit !== "")) e.security_deposit = "Enter the security deposit (0 if none).";
      if (isRent && !f.available_from) e.available_from = "When can a tenant move in?";
      if (isRent && f.brokerage_type === "fixed" && !(num(f.brokerage) > 0)) e.brokerage = "Enter the brokerage amount.";
      if (isRent && f.brokerage_type === "months" && !(num(f.brokerage) > 0 && num(f.brokerage) <= 12)) e.brokerage = "Enter between 0.5 and 12 months.";
      if (num(f.rental_yield_percent) > 100) e.rental_yield_percent = "Yield should be a percentage under 100.";
    }
    if (key === "media") {
      if (!f.cover_image_url) e.photos = "Add at least one photo. The first one becomes your cover.";
      if (f.video_url && !/^\/uploads\//.test(f.video_url) && videoEmbed(f.video_url)?.kind === "file") {
        e.video_url = "Paste a valid YouTube or Vimeo link.";
      }
      if (f.virtual_tour_url && !isUrl(f.virtual_tour_url)) e.virtual_tour_url = "Paste a full link starting with https://";
      if (profile.bedrooms) {
        floorPlans.forEach((p, i) => {
          const name = String(p.label || "").trim() || `Floor plan ${i + 1}`;
          if (!String(p.label || "").trim()) e[`floorPlans.${i}.label`] = `Give floor plan ${i + 1} a name, e.g. "2 BHK".`;
          if (!(num(p.carpet_area_sqm) > 0)) e[`floorPlans.${i}.carpet_area_sqm`] = `${name}: enter the carpet area.`;
          if (num(p.built_up_area_sqm) !== null && num(p.built_up_area_sqm) < num(p.carpet_area_sqm)) e[`floorPlans.${i}.built_up_area_sqm`] = `${name}: built-up area can't be smaller than carpet area.`;
          if (num(p.super_area_sqm) !== null && num(p.super_area_sqm) < (num(p.built_up_area_sqm) ?? num(p.carpet_area_sqm))) e[`floorPlans.${i}.super_area_sqm`] = `${name}: super built-up can't be smaller than built-up area.`;
        });
      }
    }
    if (key === "legal") {
      if (!f.ownership_type) e.ownership_type = "Choose the ownership type.";
      if (!f.listing_condition) e.listing_condition = "Is it new or resale?";
      if (f.last_renovated_date && f.last_renovated_date > new Date().toISOString().slice(0, 10)) e.last_renovated_date = "This date is in the future.";
    }
    return e;
  }

  // Errors are only shown for steps the seller has tried to leave or publish.
  const [checked, setChecked] = useState(() => new Set());
  const stepServerErrors = Object.fromEntries(
    Object.entries(serverErrors)
      .map(([k, v]) => [SERVER_FIELD_ALIAS[k] || k, v])
      .filter(([k]) => stepOfField(k) === STEPS[step].key)
  );
  const errs = { ...stepServerErrors, ...(checked.has(STEPS[step].key) ? validate(STEPS[step].key) : {}) };
  const E = (field) => errs[field];
  const stepHasErrors = (i) =>
    Object.keys(validate(STEPS[i].key)).length > 0 ||
    Object.keys(serverErrors).some((k) => stepOfField(SERVER_FIELD_ALIAS[k] || k) === STEPS[i].key);

  function flagErrors(key) {
    setChecked((c) => new Set(c).add(key));
    setTimeout(() => document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  function next() {
    const key = STEPS[step].key;
    if (Object.keys(validate(key)).length) return flagErrors(key);
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  async function save(status) {
    setError("");
    // Anything that ends up live must be complete; drafts only need the basics.
    const goesLive = status === "published" || (status === "keep" && ["published", "under_offer"].includes(initial?.status));
    if (goesLive) {
      const bad = STEPS.findIndex((s) => Object.keys(validate(s.key)).length > 0);
      if (bad !== -1) {
        setChecked((c) => new Set(c).add(STEPS[bad].key));
        goTo(bad);
        setError(`Please complete "${STEPS[bad].label}" before ${status === "published" ? "publishing" : "saving"}.`);
        setTimeout(() => document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
        return;
      }
    } else if (!f.subcategory_id || !f.title.trim()) {
      setChecked((c) => new Set(c).add("basics"));
      goTo(0);
      return setError("Add at least the property type and a title to save a draft.");
    }

    setSaving(status);
    try {
      // Unit-type floor plans only apply to homes (BHK); other types keep the single plan upload.
      const body = { ...clearUnasked({ ...f }, profile), gallery: [...new Set(gallery)].filter((u) => u !== f.cover_image_url), features, floorPlans: profile.bedrooms ? floorPlans.filter((p) => String(p.label).trim()) : [] };
      // Sale listings only take a brokerage amount; "months of rent" is a rental idea.
      if (!isRent) body.brokerage_type = Number(f.brokerage) > 0 ? "fixed" : "";
      else if (f.brokerage_type === "none" || !f.brokerage_type) body.brokerage = "";
      // On edit, "Save changes" keeps the listing's current status (e.g. sold).
      if (!(isEdit && status === "keep")) body.status = status;
      const res = await fetch(isEdit ? `/api/vendor/properties/${propertyId}` : "/api/properties/submit", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fieldErrors && Object.keys(json.fieldErrors).length) {
          setServerErrors(json.fieldErrors);
          const firstStep = stepOfField(SERVER_FIELD_ALIAS[Object.keys(json.fieldErrors)[0]] || Object.keys(json.fieldErrors)[0]);
          const i = STEPS.findIndex((st) => st.key === firstStep);
          if (i >= 0) goTo(i);
          setTimeout(() => document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
        }
        throw new Error(json.error || "Could not save your listing.");
      }
      setDone({ slug: json.slug, status: json.status });
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  const filteredAmenities = useMemo(() => {
    const q = amenitySearch.trim().toLowerCase();
    return q ? amenities.filter((a) => a.name.toLowerCase().includes(q)) : amenities;
  }, [amenities, amenitySearch]);

  if (done) {
    const live = ["published", "under_offer"].includes(done.status);
    return (
      <div ref={topRef} className="mx-auto max-w-2xl overflow-hidden rounded-[1.6rem] bg-white text-center shadow-card ring-1 ring-navy-900/5">
        <div className="relative bg-gradient-to-br from-navy-900 to-navy-950 px-8 pb-10 pt-12 text-white">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-teal-500/25 blur-3xl" />
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500">
            {live ? <PartyPopper size={30} /> : <Save size={28} />}
          </span>
          <h2 className="relative mt-5 font-display text-3xl">
            {isEdit ? "Changes saved" : live ? "Your property is live! 🎉" : "Draft saved"}
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-white/65">
            {live
              ? "Buyers can find it, save it and book visits right away. Enquiries land in your dashboard, and visit requests reach you once our team approves them."
              : "It's hidden from buyers until you publish it from your dashboard."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 p-8">
          {live && (
            <Link href={`/properties/${done.slug}`} className="btn-primary">
              <Eye size={16} /> View listing
            </Link>
          )}
          <Link href="/vendor" className="btn-outline">Go to my dashboard</Link>
          {!isEdit && (
            <button type="button" onClick={() => window.location.assign("/vendor/new")} className="btn-outline">
              <Plus size={16} /> Add another
            </button>
          )}
        </div>
      </div>
    );
  }

  const current = STEPS[step].key;
  const allPhotos = [f.cover_image_url, ...gallery].filter(Boolean);

  const nextUp = checks.filter((c) => !c.done).slice(0, 3);
  const previewPrice = Number(f.price) > 0 ? `${money(symbol, f.price)}${isRent ? (f.price_period === "yearly" ? "/yr" : "/mo") : ""}` : null;
  const previewSpecs = [
    profile.bedrooms && Number(f.bedrooms) > 0 && { I: BedDouble, t: `${f.bedrooms} bed` },
    profile.bathLabel && Number(f.bathrooms) > 0 && { I: Bath, t: `${f.bathrooms} bath` },
    (f.built_up_area_sqm || f.carpet_area_sqm || f.area_sqm) && { I: Ruler, t: `${f.built_up_area_sqm || f.carpet_area_sqm || f.area_sqm} m²` },
  ].filter(Boolean);

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Progress stepper */}
      <nav aria-label="Listing steps" className="mb-6 rounded-[1.4rem] bg-white p-4 shadow-soft ring-1 ring-navy-900/5 md:p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">Step {step + 1} of {STEPS.length}</div>
            <h2 className="mt-0.5 truncate font-display text-2xl text-navy-900">{STEPS[step].label}</h2>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs text-navy-800/50">Listing strength</div>
            <div className={`font-display text-2xl ${strength >= 80 ? "text-teal-600" : strength >= 50 ? "text-amber-600" : "text-navy-900"}`}>{strength}%</div>
          </div>
        </div>
        <ol className="-mx-1 mt-4 flex gap-1 overflow-x-auto px-1 pb-1">
          {STEPS.map((s, i) => {
            const active = i === step;
            const hasErr = stepHasErrors(i);
            const complete = visited.has(i) && i !== step && !hasErr;
            const flagged = (checked.has(s.key) || Object.keys(serverErrors).some((k) => stepOfField(SERVER_FIELD_ALIAS[k] || k) === s.key)) && hasErr && i !== step;
            return (
              <li key={s.key} className="min-w-[78px] flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className="group flex w-full flex-col gap-2 rounded-lg pt-1 text-left"
                >
                  <span className={`h-1.5 w-full rounded-full transition-colors ${
                    flagged ? "bg-coral-500" : active ? "bg-teal-500" : complete ? "bg-teal-500/45" : "bg-navy-900/10 group-hover:bg-navy-900/20"
                  }`} />
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${active ? "text-navy-900" : complete ? "text-teal-600" : "text-navy-800/45 group-hover:text-navy-800/70"}`}>
                    {complete ? <Check size={13} className="shrink-0" /> : <s.Icon size={13} className="shrink-0" />}
                    <span className="truncate">{s.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
        {/* Step content */}
        <div className="min-w-0 space-y-5">
          {current === "basics" && (
            <>
              {!isEdit && (
                <div className="rounded-[1.4rem] bg-teal-500/[0.07] p-5 ring-1 ring-teal-500/15 md:p-6">
                  <div className="flex items-center gap-2 font-display text-lg text-navy-900">
                    <ClipboardCheck size={19} className="text-teal-600" /> Before you start
                  </div>
                  <p className="mt-1 text-sm text-navy-800/60">
                    Adding a property takes about 10 minutes, in {STEPS.length - 1} short steps. Fields marked <span className="font-semibold text-coral-500">*</span> are required. You can save a draft at any time and finish later.
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {[
                      "Property type, title and a short description",
                      "Carpet area (and built-up area if you know it)",
                      "Full address, and a map pin if you can",
                      "Price or rent, plus deposit and maintenance",
                      "At least 1 photo (5+ recommended)",
                      "Ownership type and RERA number, if registered",
                    ].map((t) => (
                      <div key={t} className="flex items-start gap-2 text-sm text-navy-800/75">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-600" /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Section icon={Tag} title="What do you want to do?" subtitle="This decides where buyers find your listing." error={E("listing_type")}>
                <div className={`grid gap-3 ${commercialEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  {[
                    { v: "sale", t: "Sell", d: "Find a buyer", I: Tag },
                    { v: "rent", t: "Rent out", d: "Find a tenant", I: KeyRound },
                    ...(commercialEnabled ? [{ v: "commercial", t: "Commercial", d: "Lease or sell business space", I: Building2 }] : []),
                  ].map(({ v, t, d, I }) => {
                    const active = f.listing_type === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set("listing_type", v)}
                        className={`relative flex items-center gap-3 rounded-2xl p-4 text-left transition-all ${
                          active ? "bg-navy-900 text-white shadow-card" : "bg-sand-50 ring-1 ring-navy-900/10 hover:ring-teal-500/50"
                        }`}
                      >
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-teal-500" : "bg-white text-teal-600 ring-1 ring-navy-900/5"}`}>
                          <I size={20} />
                        </span>
                        <span>
                          <span className="block font-semibold">{t}</span>
                          <span className={`block text-xs ${active ? "text-white/60" : "text-navy-800/50"}`}>{d}</span>
                        </span>
                        {active && <CheckCircle2 size={18} className="absolute right-3 top-3 text-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section icon={Building} title="Property type *" subtitle="Flat, villa, plot, office… pick the closest match. Property types are set by our team; can't find yours? Contact us." error={E("property_type")}>
                <div className="space-y-5">
                  {categories.map((c) => (
                    <div key={c.id}>
                      <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-navy-800/45">{c.name}</div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {c.subcategories.map((s) => {
                          const [, Icon] = typeFor(s, c);
                          const active = String(f.subcategory_id) === String(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => chooseType(s, c)}
                              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                                active
                                  ? "bg-teal-500 text-white shadow-soft"
                                  : "bg-sand-50 text-navy-900 ring-1 ring-navy-900/10 hover:bg-white hover:ring-teal-500/40"
                              }`}
                            >
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-white text-teal-600 ring-1 ring-navy-900/5"}`}>
                                <Icon size={16} />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={s.name}>{s.name}</span>
                              {active && <Check size={15} className="shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                icon={FileText}
                title="Title & description"
                subtitle="A clear title and a warm description get far more clicks."
                aside={
                  <button type="button" onClick={suggestTitle} className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-500/20">
                    <Wand2 size={13} /> Suggest a title
                  </button>
                }
              >
                <div className="space-y-4">
                  <Field label="Listing title" required error={E("title")}>
                    <input value={f.title} maxLength={200} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sunlit 3 BHK villa with private garden" className={inputClass} />
                  </Field>
                  <Field label="Description" required error={E("description")} hint={`${(f.description || "").length} characters · 150+ recommended`}>
                    <textarea
                      rows={6}
                      value={f.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="What makes this place special? Light, views, neighbourhood, recent upgrades, nearby schools and transport…"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {current === "details" && (
            !f.property_type ? (
              <Section icon={BedDouble} title="Pick a property type first" subtitle="The questions here depend on whether it's a flat, villa, plot, office…">
                <button type="button" onClick={() => goTo(0)} className="btn-primary">
                  <ArrowLeft size={16} /> Choose property type
                </button>
              </Section>
            ) : (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-navy-900 px-5 py-4 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500">
                  {(() => {
                    const cat = categories.find((c) => c.subcategories.some((x) => String(x.id) === String(f.subcategory_id)));
                    const sub = cat?.subcategories.find((x) => String(x.id) === String(f.subcategory_id));
                    const Icon = sub ? typeFor(sub, cat)[1] : Home;
                    return <Icon size={19} />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Questions for your {subName || profile.noun}</div>
                  <div className="text-xs text-white/60">We only ask what matters for this type of property.</div>
                </div>
                <button type="button" onClick={() => goTo(0)} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15 hover:bg-white/15">
                  Change type
                </button>
              </div>

              {subPresets.length > 0 && (
                <Section icon={Wand2} title={isLand ? "Plot size presets" : "Quick configuration"} subtitle={isLand ? "Tap one to fill the plot area." : "Tap one to fill rooms and area in one go."}>
                  <div className="flex flex-wrap gap-2">
                    {subPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          f.bhk === p.label ? "bg-teal-500 text-white shadow-soft" : "bg-teal-500/10 text-teal-700 hover:bg-teal-500/20"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {(profile.bedrooms || profile.bathLabel || profile.floorNumber || profile.totalFloors || profile.age) && (
                <Section icon={profile.bedrooms ? BedDouble : Building2} title={profile.bedrooms ? "Rooms & floors" : "Layout & floors"}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {profile.bedrooms && <Field label="Bedrooms" required={f.property_type !== "apartment"} error={E("bedrooms")}><Stepper value={f.bedrooms} onChange={(v) => set("bedrooms", v)} /></Field>}
                    {profile.bathLabel && <Field label={profile.bathLabel} required error={E("bathrooms")}><Stepper value={f.bathrooms} onChange={(v) => set("bathrooms", v)} /></Field>}
                    {profile.balconies && <Field label="Balconies"><Stepper value={f.balconies} onChange={(v) => set("balconies", v)} /></Field>}
                    {profile.floorNumber && <Field label={`Which floor is the ${profile.noun} on?`} required error={E("floor_number")}><SuffixInput type="number" min="0" value={f.floor_number} onChange={(e) => set("floor_number", e.target.value)} placeholder="0 = ground" /></Field>}
                    {profile.totalFloors && <Field label={profile.totalFloors} required error={E("total_floors")}><SuffixInput type="number" min="0" value={f.total_floors} onChange={(e) => set("total_floors", e.target.value)} placeholder="e.g. 3" /></Field>}
                    {profile.age && <Field label="Property age"><input value={f.property_age} maxLength={60} onChange={(e) => set("property_age", e.target.value)} placeholder="e.g. 5 years" className={inputClass} /></Field>}
                  </div>
                </Section>
              )}

              <Section icon={Ruler} title="Size">
                <div className="grid gap-4 sm:grid-cols-3">
                  {profile.carpet && <Field label="Carpet area" hint="Usable floor area" required error={E("carpet_area_sqm")}><SuffixInput suffix="m²" type="number" min="0" value={f.carpet_area_sqm} onChange={(e) => set("carpet_area_sqm", e.target.value)} /></Field>}
                  {profile.builtUp && <Field label="Built-up area" hint="Including walls" error={E("built_up_area_sqm")}><SuffixInput suffix="m²" type="number" min="0" value={f.built_up_area_sqm} onChange={(e) => set("built_up_area_sqm", e.target.value)} /></Field>}
                  {profile.plot && <Field label={profile.plot} required={isLand} error={E("area_sqm")}><SuffixInput suffix="m²" type="number" min="0" value={f.area_sqm} onChange={(e) => set("area_sqm", e.target.value)} /></Field>}
                </div>
              </Section>

              <Section icon={Compass} title="Characteristics">
                <div className="space-y-5">
                  <Field label={isLand ? "Plot facing" : "Facing"}><ChipGroup options={FACING} value={f.facing} onChange={(v) => set("facing", v)} /></Field>
                  {profile.furnishing && (
                    <Field label="Furnishing" required error={E("furnishing")}>
                      <ChipGroup options={Object.keys(profile.furnishing)} labels={profile.furnishing} value={f.furnishing} onChange={(v) => set("furnishing", v)} icons={{ furnished: Sofa, semi_furnished: Sofa, unfurnished: Sofa }} />
                    </Field>
                  )}
                  {profile.construction && (
                    <Field label="Construction status" required error={E("construction_status")}>
                      <ChipGroup options={["ready_to_move", "under_construction", "new_launch"]} value={f.construction_status} onChange={(v) => set("construction_status", v)} icons={{ ready_to_move: CheckCircle2, under_construction: HardHat, new_launch: Rocket }} />
                    </Field>
                  )}
                  {profile.construction && f.construction_status && f.construction_status !== "ready_to_move" && (
                    <Field label="Expected possession" required error={E("possession_date")} className="sm:max-w-xs"><input type="date" value={f.possession_date} onChange={(e) => set("possession_date", e.target.value)} className={inputClass} /></Field>
                  )}
                  {profile.parking && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Toggle checked={f.parking} onChange={(v) => set("parking", v)} label="Parking available" hint="Covered or open parking" />
                      {f.parking && <Field label="Parking spaces"><Stepper value={f.parking_spaces || 1} min={1} onChange={(v) => set("parking_spaces", v)} /></Field>}
                    </div>
                  )}
                </div>
              </Section>
            </>
            )
          )}

          {current === "location" && (
            <>
              <Section
                icon={MapIcon}
                title="Find it on the map"
                subtitle="Search the building or street, or tap the map. We'll fill in the address for you."
                error={E("map")}
              >
                <LocationPicker
                  latitude={f.latitude}
                  longitude={f.longitude}
                  city={city}
                  onChange={({ latitude, longitude }) => setF((prev) => ({ ...prev, latitude, longitude }))}
                  onPlace={fillFromPlace}
                />
              </Section>

              <Section icon={MapPin} title="Address" subtitle="Check what the map filled in, and add anything that's missing.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="City"
                    required
                    error={E("location_id")}
                    hint={isNewCity ? `"${f.city_name.trim()}" will be added as a new city.` : "Start typing, or pick the spot on the map above."}
                  >
                    <input
                      list="seller-city-options"
                      value={f.city_name}
                      maxLength={120}
                      autoComplete="off"
                      onChange={(e) => {
                        const match = matchCity(e.target.value);
                        set("city_name", e.target.value);
                        setF((prev) => ({ ...prev, location_id: match ? match.id : "", country: match ? match.country || "" : prev.country }));
                      }}
                      placeholder="e.g. Jaipur"
                      className={inputClass}
                    />
                    <datalist id="seller-city-options">
                      {locations.map((l) => <option key={l.id} value={l.city}>{l.region || l.country || ""}</option>)}
                    </datalist>
                  </Field>
                  <Field label="Locality / area" required error={E("locality")}><input value={f.locality} maxLength={160} onChange={(e) => set("locality", e.target.value)} placeholder="e.g. Bandra West" className={inputClass} /></Field>
                  <Field label="Street address" required error={E("address")} className="sm:col-span-2"><input value={f.address} maxLength={255} onChange={(e) => set("address", e.target.value)} placeholder="Building, street" className={inputClass} /></Field>
                  <Field label="State / region"><input value={f.state} maxLength={120} onChange={(e) => set("state", e.target.value)} className={inputClass} /></Field>
                  <Field label="ZIP / PIN code" error={E("zip_code")}><input value={f.zip_code} maxLength={20} onChange={(e) => set("zip_code", e.target.value)} className={inputClass} /></Field>
                  <Field label="Nearby landmarks" hint="e.g. Metro 500 m, school 1 km, hospital 2 km" className="sm:col-span-2">
                    <textarea rows={2} value={f.nearby_landmarks} onChange={(e) => set("nearby_landmarks", e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {current === "pricing" && (
            <>
              <Section icon={Wallet} title={isRent ? "Rent" : "Price"}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={isRent ? "Rent amount" : "Asking price"} required error={E("price")} hint={Number(f.price) > 0 ? `Shown as ${money(symbol, f.price)}${isRent ? (f.price_period === "yearly" ? "/yr" : "/mo") : ""}` : undefined}>
                    <SuffixInput prefix={symbol} type="number" min="0" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
                  </Field>
                  {isRent && (
                    <Field label="Billed"><ChipGroup options={["monthly", "yearly"]} value={f.price_period} onChange={(v) => set("price_period", v)} required labels={{ monthly: "Per month", yearly: "Per year" }} /></Field>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Toggle checked={f.negotiable} onChange={(v) => set("negotiable", v)} label="Price negotiable" hint="Shows a 'Negotiable' badge" />
                  {!isRent && <Toggle checked={f.loan_available} onChange={(v) => set("loan_available", v)} label="Home loan available" hint="Bank-approved / loan eligible" />}
                </div>
              </Section>

              <Section icon={Layers} title="Maintenance">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Maintenance charges"><SuffixInput prefix={symbol} type="number" min="0" value={f.maintenance_charges} onChange={(e) => set("maintenance_charges", e.target.value)} /></Field>
                  <Field label="Charged" required={Number(f.maintenance_charges) > 0} error={E("maintenance_frequency")}><ChipGroup options={["monthly", "quarterly", "half_yearly", "yearly"]} value={f.maintenance_frequency} onChange={(v) => set("maintenance_frequency", v)} /></Field>
                </div>
              </Section>

              {isRent && (
                <Section icon={KeyRound} title="Rental terms">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Security deposit" required error={E("security_deposit")}><SuffixInput prefix={symbol} type="number" min="0" value={f.security_deposit} onChange={(e) => set("security_deposit", e.target.value)} /></Field>
                    <Field label="Minimum rental period"><input value={f.min_rental_period} maxLength={60} onChange={(e) => set("min_rental_period", e.target.value)} placeholder="e.g. 11 months" className={inputClass} /></Field>
                    <Field label="Available from" required error={E("available_from")}><input type="date" value={f.available_from} onChange={(e) => set("available_from", e.target.value)} className={inputClass} /></Field>
                  </div>
                </Section>
              )}

              {isRent && (
                <Section icon={BadgePercent} title="Brokerage" subtitle="Does the tenant pay a brokerage fee? Optional, but tenants filter for it.">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.entries(BROKERAGE_TYPES).map(([k, label]) => {
                      const active = f.brokerage_type === k;
                      const hint = { none: "Big plus for tenants", fixed: `e.g. ${symbol}25,000`, months: "e.g. 1 month's rent" }[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setF((prev) => ({ ...prev, brokerage_type: active ? "" : k, brokerage: active || k === "none" || prev.brokerage_type !== k ? "" : prev.brokerage }))}
                          className={`relative rounded-xl p-3.5 text-left transition-all ${active ? "bg-navy-900 text-white shadow-soft" : "bg-sand-50 ring-1 ring-navy-900/10 hover:ring-teal-500/50"}`}
                        >
                          <span className="block text-sm font-semibold">{label}</span>
                          <span className={`block text-xs ${active ? "text-white/60" : "text-navy-800/50"}`}>{hint}</span>
                          {active && <CheckCircle2 size={16} className="absolute right-3 top-3 text-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                  {f.brokerage_type === "fixed" && (
                    <Field label="Brokerage amount" required error={E("brokerage")} className="mt-4 sm:max-w-xs">
                      <SuffixInput prefix={symbol} type="number" min="0" value={f.brokerage} onChange={(e) => set("brokerage", e.target.value)} />
                    </Field>
                  )}
                  {f.brokerage_type === "months" && (
                    <Field
                      label="How many months' rent?"
                      required
                      error={E("brokerage")}
                      hint={Number(f.brokerage) > 0 && Number(f.price) > 0 ? `About ${money(symbol, Math.round(Number(f.brokerage) * Number(f.price) / (f.price_period === "yearly" ? 12 : 1)))}` : undefined}
                      className="mt-4 sm:max-w-xs"
                    >
                      <SuffixInput suffix="months" type="number" min="0.5" max="12" step="0.5" value={f.brokerage} onChange={(e) => set("brokerage", e.target.value)} placeholder="1" />
                    </Field>
                  )}
                </Section>
              )}

              {!isRent && (
                <Section icon={FileText} title="Buying costs" subtitle="Optional — shown to buyers as a 'what you'll actually pay' breakdown.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Stamp duty"><SuffixInput prefix={symbol} type="number" min="0" value={f.stamp_duty} onChange={(e) => set("stamp_duty", e.target.value)} /></Field>
                    <Field label="Registration charges"><SuffixInput prefix={symbol} type="number" min="0" value={f.registration_charges} onChange={(e) => set("registration_charges", e.target.value)} /></Field>
                    <Field label="Brokerage"><SuffixInput prefix={symbol} type="number" min="0" value={f.brokerage} onChange={(e) => set("brokerage", e.target.value)} /></Field>
                    <Field label="Other charges"><SuffixInput prefix={symbol} type="number" min="0" value={f.other_charges} onChange={(e) => set("other_charges", e.target.value)} /></Field>
                  </div>
                </Section>
              )}

              {!isRent && (
                <Section icon={Star} title="Investment highlights" subtitle="Optional — helps investors compare.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Estimated monthly rent"><SuffixInput prefix={symbol} type="number" min="0" value={f.estimated_monthly_rent} onChange={(e) => set("estimated_monthly_rent", e.target.value)} /></Field>
                    <Field label="Expected rental yield" error={E("rental_yield_percent")}><SuffixInput suffix="%" type="number" min="0" step="0.1" value={f.rental_yield_percent} onChange={(e) => set("rental_yield_percent", e.target.value)} /></Field>
                    <Field label="Capital appreciation potential" className="sm:col-span-2"><ChipGroup options={["low", "medium", "high"]} value={f.capital_appreciation} onChange={(v) => set("capital_appreciation", v)} /></Field>
                  </div>
                </Section>
              )}
            </>
          )}

          {current === "amenities" && (
            <Section
              icon={Sparkles}
              title="Amenities"
              subtitle="Tick everything the property offers — 5+ makes a big difference."
              aside={<span className="rounded-full bg-teal-500/10 px-3 py-1.5 text-sm font-semibold text-teal-700">{features.length} selected</span>}
            >
              <div className="relative mb-5">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-800/40" />
                <input value={amenitySearch} onChange={(e) => setAmenitySearch(e.target.value)} placeholder="Search amenities (pool, gym, lift…)" className={`${inputClass} pl-11`} />
              </div>
              <div className="space-y-6">
                {AMENITY_CATEGORIES.map((cat) => {
                  const items = filteredAmenities.filter((a) => (a.category || "other") === cat.key);
                  if (!items.length) return null;
                  return (
                    <div key={cat.key}>
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-800/50">
                        <span className="text-sm">{cat.emoji}</span> {cat.label}
                        <span className="h-px flex-1 bg-navy-900/8" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {items.map((a) => {
                          const Icon = getAmenityIcon(a.icon_key);
                          const active = features.includes(a.name);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => toggleFeature(a.name)}
                              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-all ${
                                active ? "bg-teal-500 text-white shadow-soft" : "bg-sand-50 text-navy-800/80 ring-1 ring-navy-900/8 hover:bg-white hover:ring-teal-500/40"
                              }`}
                            >
                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-white text-teal-600 ring-1 ring-navy-900/5"}`}>
                                {active ? <Check size={14} /> : <Icon size={14} />}
                              </span>
                              <span className="leading-tight">{a.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {current === "media" && (
            <>
              <Section
                icon={ImageIcon}
                title="Photos *"
                subtitle="The first photo is your cover. Bright, landscape photos work best."
                error={E("photos")}
                aside={<span className="text-sm font-semibold text-navy-800/50">{allPhotos.length}/20</span>}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {allPhotos.map((url, i) => (
                    <div key={url} className={`group relative overflow-hidden rounded-2xl ring-1 ring-navy-900/10 ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                      <img src={url} alt="" className="aspect-[4/3] h-full w-full object-cover" />
                      {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-teal-500 px-2.5 py-1 text-[11px] font-semibold text-white">Cover</span>}
                      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-navy-950/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {i !== 0 && (
                          <button type="button" onClick={() => makeCover(url)} className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-navy-900">
                            Make cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await ask({ title: "Remove this photo?", message: i === 0 ? "It's your cover photo; the next photo becomes the cover." : "It will be removed from your listing when you save.", confirmLabel: "Remove photo" });
                            if (ok) removePhoto(url);
                          }}
                          className="rounded-lg bg-white/90 p-1.5 text-coral-600"
                          aria-label="Remove photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {allPhotos.length < 20 && (
                    <button
                      type="button"
                      onClick={() => photoInput.current?.click()}
                      disabled={!!photoProgress}
                      className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-900/15 bg-sand-50/60 text-sm font-semibold text-navy-800/60 transition-colors hover:border-teal-500 hover:bg-teal-500/5 hover:text-teal-600 ${
                        allPhotos.length === 0 ? "col-span-2 row-span-2" : ""
                      }`}
                    >
                      {photoProgress ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                      {photoProgress ? `Uploading ${photoProgress}` : allPhotos.length ? "Add photos" : "Upload photos"}
                    </button>
                  )}
                </div>
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} className="hidden" />
              </Section>

              <Section icon={Video} title="Video tour" subtitle="Listings with a video get noticeably more enquiries.">
                <div className="mb-4 inline-flex rounded-full bg-sand-100 p-1">
                  {[
                    { k: "upload", l: "Upload video", I: Upload },
                    { k: "link", l: "YouTube / Vimeo link", I: Youtube },
                  ].map(({ k, l, I }) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setVideoMode(k)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${videoMode === k ? "bg-white text-navy-900 shadow-soft" : "text-navy-800/55"}`}
                    >
                      <I size={15} /> {l}
                    </button>
                  ))}
                </div>
                {videoMode === "upload" ? (
                  <FileUpload
                    value={/^\/uploads\//.test(f.video_url) ? f.video_url : ""}
                    onChange={(v) => set("video_url", v)}
                    accept="video/mp4,video/webm,video/quicktime"
                    label="Video"
                    hint="MP4, WebM or MOV · up to 100 MB"
                    icon={Video}
                    beforeRemove={confirmFileRemove}
                  />
                ) : (
                  <Field label="Video link" hint="Paste a YouTube (incl. Shorts) or Vimeo link." error={E("video_url")}>
                    <SuffixInput value={/^\/uploads\//.test(f.video_url) ? "" : f.video_url} onChange={(e) => set("video_url", e.target.value.trim())} placeholder="https://www.youtube.com/watch?v=…" />
                  </Field>
                )}
                {embed && (
                  <div className="mt-4 overflow-hidden rounded-2xl bg-navy-950 ring-1 ring-navy-900/10">
                    {embed.kind === "file" ? (
                      <video src={embed.src} controls className="aspect-video w-full" poster={f.cover_image_url || undefined} />
                    ) : (
                      <iframe title="Video preview" src={embed.src} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    )}
                  </div>
                )}
              </Section>

              <Section icon={Globe} title="360° virtual tour" subtitle="Optional — paste an embed link from Matterport, Kuula, etc." error={E("virtual_tour_url")}>
                <SuffixInput value={f.virtual_tour_url} onChange={(e) => set("virtual_tour_url", e.target.value.trim())} placeholder="https://my.matterport.com/show/?m=…" />
              </Section>

              {profile.bedrooms && (
                <Section
                  icon={MapIcon}
                  title="Floor plans"
                  subtitle="Selling or renting several unit types? Add each one with its size, price and plan drawing."
                  aside={floorPlans.length > 0 && <span className="rounded-full bg-teal-500/10 px-3 py-1.5 text-sm font-semibold text-teal-700">{floorPlans.length} added</span>}
                >
                  <FloorPlansEditor
                    plans={floorPlans}
                    setPlans={setFloorPlans}
                    types={floorPlanTypes}
                    subName={subName}
                    symbol={symbol}
                    isRent={isRent}
                    ask={ask}
                    errors={Object.fromEntries(Object.entries(errs).filter(([k]) => k.startsWith("floorPlans.")))}
                  />
                </Section>
              )}

              <Section icon={FileText} title={profile.bedrooms ? "Site plan & brochure" : "Plans & brochure"}>
                <div className="grid gap-4 md:grid-cols-3">
                  {!(profile.bedrooms && floorPlans.length) && (
                    <Field label={profile.bedrooms ? "Overall floor plan" : "Floor plan"}><FileUpload value={f.floor_plan_url} onChange={(v) => set("floor_plan_url", v)} beforeRemove={confirmFileRemove} accept="image/*,application/pdf" label="Floor plan" hint="Image or PDF" /></Field>
                  )}
                  <Field label="Site / plot plan"><FileUpload value={f.site_plan_url} onChange={(v) => set("site_plan_url", v)} beforeRemove={confirmFileRemove} accept="image/*,application/pdf" label="Site plan" hint="Image or PDF" /></Field>
                  <Field label="Brochure"><FileUpload value={f.brochure_url} onChange={(v) => set("brochure_url", v)} beforeRemove={confirmFileRemove} accept="application/pdf,image/*" label="Brochure" hint="PDF · up to 20 MB" /></Field>
                </div>
              </Section>
            </>
          )}

          {current === "legal" && (
            <>
              <Section icon={ShieldCheck} title="Ownership & legal" subtitle="Builds trust — buyers filter for RERA-registered homes.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Owner name" hint="Not shown publicly."><input value={f.owner_name} maxLength={160} onChange={(e) => set("owner_name", e.target.value)} className={inputClass} /></Field>
                  <Field label="RERA number"><input value={f.rera_number} maxLength={100} onChange={(e) => set("rera_number", e.target.value)} placeholder="Leave blank if not registered" className={inputClass} /></Field>
                  <Field label="Ownership type" required error={E("ownership_type")} className="sm:col-span-2"><ChipGroup options={["freehold", "leasehold", "cooperative", "power_of_attorney"]} value={f.ownership_type} onChange={(v) => set("ownership_type", v)} /></Field>
                  <Field label="Listing condition" required error={E("listing_condition")}><ChipGroup options={["new", "resale"]} value={f.listing_condition} onChange={(v) => set("listing_condition", v)} /></Field>
                  <Field label="Property tax"><ChipGroup options={["paid", "pending", "included_in_maintenance"]} value={f.property_tax_status} onChange={(v) => set("property_tax_status", v)} /></Field>
                </div>
              </Section>

              <Section icon={Building2} title="Building & unit" subtitle="Optional, but it answers questions before buyers ask.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Builder / developer"><input value={f.builder_name} maxLength={160} onChange={(e) => set("builder_name", e.target.value)} className={inputClass} /></Field>
                  {profile.unitDetails && <Field label="Tower / block"><input value={f.tower_block} maxLength={80} onChange={(e) => set("tower_block", e.target.value)} className={inputClass} /></Field>}
                  {profile.unitDetails && <Field label="Unit number"><input value={f.unit_number} maxLength={40} onChange={(e) => set("unit_number", e.target.value)} className={inputClass} /></Field>}
                  {profile.parking && <Field label="Parking slot no."><input value={f.parking_slot_number} maxLength={40} onChange={(e) => set("parking_slot_number", e.target.value)} className={inputClass} /></Field>}
                  <Field label="Your property ID"><input value={f.property_custom_id} maxLength={60} onChange={(e) => set("property_custom_id", e.target.value)} placeholder="e.g. FH-2024-001" className={inputClass} /></Field>
                  <Field label="Last renovated" error={E("last_renovated_date")}><input type="date" value={f.last_renovated_date} onChange={(e) => set("last_renovated_date", e.target.value)} className={inputClass} /></Field>
                  <Field label="Tags" hint="Comma separated, e.g. sea view, corner unit" className="sm:col-span-3"><input value={f.tags} maxLength={500} onChange={(e) => set("tags", e.target.value)} className={inputClass} /></Field>
                </div>
              </Section>
            </>
          )}

          {current === "review" && (
            <>
              <Section icon={ClipboardCheck} title="Listing strength" subtitle="Complete listings rank higher and get more visits.">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" className="stroke-navy-900/8" />
                      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(strength / 100) * 326.7} 326.7`} className="stroke-teal-500 transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-2xl text-navy-900">{strength}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-navy-800/50">complete</span>
                    </div>
                  </div>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    {checks.map((c) => (
                      <div key={c.label} className={`flex items-center gap-2 text-sm ${c.done ? "text-navy-900" : "text-navy-800/45"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${c.done ? "bg-teal-500 text-white" : "ring-1 ring-navy-900/20"}`}>
                          {c.done && <Check size={12} />}
                        </span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              <Section icon={Eye} title="Summary">
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    ["Listing", humanize(f.listing_type)],
                    ["Type", subName || humanize(f.property_type)],
                    ["Price", Number(f.price) > 0 ? `${money(symbol, f.price)}${isRent ? (f.price_period === "yearly" ? "/yr" : "/mo") : ""}${f.negotiable ? " · negotiable" : ""}` : "—"],
                    ["Location", [f.locality, city].filter(Boolean).join(", ") || "—"],
                    ...(isRent ? [["Brokerage", f.brokerage_type === "none" ? "No brokerage" : f.brokerage_type === "months" && f.brokerage ? `${f.brokerage} months' rent` : f.brokerage_type === "fixed" && f.brokerage ? money(symbol, f.brokerage) : "—"]] : []),
                    ["Map pin", f.latitude && f.longitude ? "Placed" : "—"],
                    ["Layout", [profile.bedrooms && `${f.bedrooms} bed`, profile.bathLabel && `${f.bathrooms} ${profile.bathLabel.toLowerCase()}`, profile.balconies && `${f.balconies} balcony`, profile.totalFloors && f.total_floors && `${f.total_floors} floors`].filter(Boolean).join(" · ") || "—"],
                    ["Area", [f.carpet_area_sqm && `${f.carpet_area_sqm} m² carpet`, f.built_up_area_sqm && `${f.built_up_area_sqm} m² built-up`, f.area_sqm && `${f.area_sqm} m² plot`].filter(Boolean).join(" · ") || "—"],
                    ["Photos", `${allPhotos.length}`],
                    ["Video", f.video_url ? "Added" : "—"],
                    ["Amenities", `${features.length}`],
                    ["RERA", f.rera_number || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-navy-900/5 pb-2">
                      <dt className="text-navy-800/50">{k}</dt>
                      <dd className="text-right font-medium text-navy-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Section>

              <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-white md:p-7">
                <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal-500/25 blur-3xl" />
                <h3 className="relative font-display text-2xl">{isEdit ? "Save your changes" : "Ready to go live?"}</h3>
                <p className="relative mt-1 text-sm text-white/65">
                  {isEdit ? "Updates show on your public listing immediately." : "Publish now and buyers can book visits today, or save a draft and finish later."}
                </p>
                <div className="relative mt-5 flex flex-wrap gap-3">
                  {isEdit ? (
                    <>
                      <button type="button" onClick={() => save("keep")} disabled={!!saving} className="btn-primary">
                        {saving === "keep" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
                      </button>
                      <button type="button" onClick={() => save("published")} disabled={!!saving} className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/15">
                        {saving === "published" ? "Publishing…" : "Save & make live"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => save("published")} disabled={!!saving} className="btn-primary">
                        {saving === "published" ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />} Publish listing
                      </button>
                      <button type="button" onClick={() => save("draft")} disabled={!!saving} className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/15">
                        {saving === "draft" ? "Saving…" : "Save as draft"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {Object.keys(errs).length > 0 && (
            <div className="rounded-2xl bg-coral-500/10 px-4 py-3 text-sm text-coral-600" role="alert">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                {Object.keys(errs).length === 1 ? "Fix this to continue:" : `Fix these ${Object.keys(errs).length} things to continue:`}
              </div>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-9">
                {Object.entries(errs).map(([k, msg]) => (
                  <li key={k}>
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => document.querySelectorAll("[data-field-error]")[Object.keys(errs).indexOf(k)]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    >
                      {msg}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && Object.keys(errs).length === 0 && <p className="rounded-xl bg-coral-500/10 px-4 py-3 text-sm font-medium text-coral-600">{error}</p>}

          {/* Step navigation — stays in reach at the bottom of the screen */}
          <div className="sticky bottom-3 z-20 flex items-center gap-2 rounded-2xl bg-white/95 p-2.5 shadow-[0_10px_40px_-12px_rgba(15,27,45,0.35)] ring-1 ring-navy-900/8 backdrop-blur">
            <button
              type="button"
              onClick={() => goTo(Math.max(step - 1, 0))}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-800/70 hover:bg-sand-50 hover:text-navy-900 disabled:invisible"
            >
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
            </button>
            <span className="hidden flex-1 text-center text-xs text-navy-800/45 sm:block">
              {step < STEPS.length - 1 ? `Next: ${STEPS[step + 1].label}` : "Last step"}
            </span>
            <span className="flex-1 sm:hidden" />
            <button
              type="button"
              onClick={() => save(isEdit ? "keep" : "draft")}
              disabled={!!saving}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900 ring-1 ring-navy-900/15 hover:ring-teal-500"
            >
              {saving === "draft" || saving === "keep" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isEdit ? "Save" : "Save draft"}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={() => save("published")} disabled={!!saving} className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
                {saving === "published" ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {isEdit ? "Save & go live" : "Publish"}
              </button>
            )}
          </div>
        </div>

        {/* Live preview: what buyers will see, filling in as the seller types */}
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-navy-800/45">
              <Eye size={13} /> How buyers will see it
            </div>
            <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-card ring-1 ring-navy-900/5">
              <div className="relative aspect-[4/3] bg-sand-100">
                {f.cover_image_url ? (
                  <img src={f.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-navy-800/35">
                    <ImageIcon size={30} strokeWidth={1.5} />
                    <span className="text-xs font-medium">Your cover photo</span>
                  </div>
                )}
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isRent ? "bg-navy-900 text-white" : "bg-teal-500 text-white"}`}>
                  {isRent ? "For rent" : f.listing_type === "commercial" ? "Commercial" : "For sale"}
                </span>
                {previewPrice && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-navy-950/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{previewPrice}</span>
                )}
              </div>
              <div className="p-4">
                <div className={`line-clamp-2 font-display text-lg leading-snug ${f.title ? "text-navy-900" : "text-navy-800/30"}`}>
                  {f.title || "Your listing title"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-navy-800/55">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{[f.locality, city].filter(Boolean).join(", ") || "Locality, city"}</span>
                </div>
                {previewSpecs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-navy-900/8 pt-3 text-sm text-navy-800/70">
                    {previewSpecs.map(({ I, t }) => <span key={t} className="flex items-center gap-1"><I size={14} className="text-teal-600" /> {t}</span>)}
                  </div>
                )}
                {(f.negotiable || (isRent && f.brokerage_type === "none")) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {isRent && f.brokerage_type === "none" && <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-600">No brokerage</span>}
                    {f.negotiable && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Negotiable</span>}
                  </div>
                )}
              </div>
            </div>

            {nextUp.length > 0 && (
              <div className="rounded-[1.4rem] bg-white p-4 shadow-soft ring-1 ring-navy-900/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy-900">Make it stronger</span>
                  <span className="text-navy-800/50">{strength}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-900/8">
                  <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${strength}%` }} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {nextUp.map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-sm text-navy-800/65">
                      <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-navy-900/20" /> {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 rounded-[1.4rem] bg-navy-900 p-4 text-white">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-sm leading-relaxed text-white/75">{TIPS[current]}</p>
            </div>
          </div>
        </aside>
      </div>
      {dialog}
    </div>
  );
}
