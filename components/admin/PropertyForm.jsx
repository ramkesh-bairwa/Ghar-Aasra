"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, MapPinned, Loader2, Save, Check,
  Info, DollarSign, MapPin, Sparkles, Image as ImageIcon,
  ClipboardCheck, ChevronRight, ChevronLeft, Upload, X, FileText, Shield, TrendingUp,
  LayoutPanelTop, ArrowUp, ArrowDown, Copy,
} from "lucide-react";
import { getAmenityIcon, AMENITY_CATEGORIES } from "@/lib/amenityIcons";
import { useDialog } from "@/components/ConfirmDialog";

const LISTING_TYPES = ["sale", "rent", "pg", "lease"];
const PROPERTY_TYPES = ["apartment", "villa", "house", "plot", "office", "shop", "commercial", "land"];
const PRICE_PERIODS = ["one_time", "monthly", "yearly"];
const STATUSES = ["draft", "published", "under_offer", "sold", "rented"];
const CONSTRUCTION_STATUSES = ["ready_to_move", "under_construction", "new_launch"];
const FACING_OPTIONS = ["east", "west", "north", "south", "north_east", "north_west", "south_east", "south_west"];
const FURNISHING_OPTIONS = ["furnished", "semi_furnished", "unfurnished"];
const OWNERSHIP_TYPES = ["freehold", "leasehold", "cooperative", "power_of_attorney"];
const LISTING_CONDITIONS = ["new", "resale"];
const MAINTENANCE_FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly"];
const PROPERTY_TAX_STATUSES = ["paid", "pending", "included_in_maintenance"];
const APPRECIATION_LEVELS = ["low", "medium", "high"];

const ic = "w-full rounded-xl border border-navy-900/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30";

const STEPS = [
  { key: "basic",     label: "Basic Info",    Icon: Info },
  { key: "details",   label: "Details",       Icon: ImageIcon },
  { key: "location",  label: "Location",      Icon: MapPin },
  { key: "pricing",   label: "Pricing",       Icon: DollarSign },
  { key: "amenities", label: "Amenities",     Icon: Sparkles },
  { key: "media",     label: "Media",         Icon: Upload },
  { key: "floorplans", label: "Floor Plans",  Icon: LayoutPanelTop },
  { key: "legal",     label: "Legal & Owner", Icon: Shield },
  { key: "intelligence", label: "Intelligence", Icon: TrendingUp },
  { key: "review",    label: "Review",        Icon: ClipboardCheck },
];

const emptyForm = {
  title: "", slug: "", listing_type: "sale", property_type: "apartment",
  category_id: "", subcategory_id: "", status: "draft", agent_id: "",
  featured: false, negotiable: false, description: "",
  bedrooms: "", bathrooms: "", balconies: "", floor_number: "", total_floors: "",
  area_sqm: "", carpet_area_sqm: "", built_up_area_sqm: "",
  property_age: "", facing: "", furnishing: "", parking: false, parking_spaces: "",
  construction_status: "", possession_date: "",
  address: "", locality: "", location_id: "", state: "", zip_code: "",
  latitude: "", longitude: "", nearby_landmarks: "",
  price: "", price_period: "one_time", maintenance_charges: "",
  security_deposit: "", min_rental_period: "", available_from: "",
  cover_image_url: "", video_url: "", virtual_tour_url: "", floor_plan_url: "", brochure_url: "",
  owner_name: "", ownership_type: "", rera_number: "",
  verified: false, approved: false, property_custom_id: "",
  listing_condition: "", builder_name: "", tower_block: "", unit_number: "", parking_slot_number: "",
  last_renovated_date: "", maintenance_frequency: "", property_tax_status: "", loan_available: false,
  rental_yield_percent: "", estimated_monthly_rent: "", capital_appreciation: "",
  investment_score: "", rental_demand_score: "", location_growth_score: "", future_development_score: "",
  brokerage: "", registration_charges: "", stamp_duty: "", other_charges: "",
};

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data.url;
}

const emptyPlan = {
  floor_plan_type_id: "", floor_plan_size_id: "", label: "", bedrooms: "", bathrooms: "", balconies: "", carpet_area_sqm: "", built_up_area_sqm: "",
  super_area_sqm: "", price: "", image_url: "",
};

export default function PropertyForm({ propertyId }) {
  const router = useRouter();
  const isNew = !propertyId;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [features, setFeatures] = useState([]);
  const [images, setImages] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [planTypes, setPlanTypes] = useState([]);
  const [presetId, setPresetId] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState("");
  const [uploadingKey, setUploadingKey] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/locations").then((r) => r.ok ? r.json() : { rows: [] }),
      fetch("/api/admin/categories").then((r) => r.ok ? r.json() : { rows: [] }),
      fetch("/api/admin/subcategories").then((r) => r.ok ? r.json() : { rows: [] }),
      fetch("/api/admin/agents").then((r) => r.ok ? r.json() : { rows: [] }),
      fetch("/api/admin/amenities").then((r) => r.ok ? r.json() : { rows: [] }),
      fetch("/api/admin/floor-plan-types").then((r) => r.ok ? r.json() : { types: [] }),
    ]).then(([loc, cat, sub, ag, am, fpt]) => {
      setLocations(loc.rows || []);
      setCategories(cat.rows || []);
      setSubcategories(sub.rows || []);
      setAgents(ag.rows || []);
      setAmenities(am.rows || []);
      setPlanTypes(fpt.types || []);
    });
  }, []);

  useEffect(() => {
    if (isNew) return;
    Promise.all([
      fetch(`/api/admin/properties/${propertyId}`).then((r) => r.json()),
      fetch(`/api/admin/properties/${propertyId}/features`).then((r) => r.json()),
      fetch(`/api/admin/properties/${propertyId}/images`).then((r) => r.json()),
      fetch(`/api/admin/properties/${propertyId}/floor-plans`).then((r) => r.json()).catch(() => ({})),
    ]).then(([propData, featData, imgData, planData]) => {
      if (propData.row) {
        const row = propData.row;
        setForm({
          ...emptyForm,
          ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "" : v])),
          featured: !!row.featured, negotiable: !!row.negotiable, parking: !!row.parking,
          verified: !!row.verified, approved: !!row.approved, loan_available: !!row.loan_available,
        });
      } else {
        setError(propData.error || "Could not load this property.");
      }
      setFeatures(featData.features || []);
      setImages((imgData.images || []).map((url) => ({ url, uploading: false })));
      // MySQL DECIMALs arrive as "52.00"; show them as 52.
      setFloorPlans((planData.floorPlans || []).map((p) => ({
        ...emptyPlan,
        ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v === null ? "" : /^\d+\.\d+$/.test(String(v)) ? String(Number(v)) : v])),
      })));
    }).finally(() => setLoading(false));
  }, [propertyId, isNew]);

  const filteredSubs = useMemo(
    () => subcategories.filter((s) => String(s.category_id) === String(form.category_id)),
    [subcategories, form.category_id]
  );
  const selectedSubName = subcategories.find((s) => String(s.id) === String(form.subcategory_id))?.name || "";
  // Quick presets come from the same Floor Plans & Sizes master list as the
  // Floor Plans step, so a size is defined once and used everywhere. Sizes
  // labelled like this property's subcategory (e.g. "Apartment") come first.
  const filteredPresets = useMemo(() => {
    const all = planTypes.flatMap((t) =>
      (t.sizes || []).map((sz) => ({
        id: `${t.id}:${sz.id}`,
        label: sz.label ? `${t.name} · ${sz.label}` : t.name,
        carpet_area_sqm: sz.carpet_area_sqm,
        built_up_area_sqm: sz.built_up_area_sqm,
        bedrooms: t.bedrooms,
        bathrooms: t.bathrooms,
        balconies: t.balconies,
        matches: !!selectedSubName && String(sz.label || "").toLowerCase() === selectedSubName.toLowerCase(),
      }))
    );
    return [...all.filter((p) => p.matches), ...all.filter((p) => !p.matches)];
  }, [planTypes, selectedSubName]);

  const selectedCity = locations.find((l) => String(l.id) === String(form.location_id));
  const selectedAgent = agents.find((a) => String(a.id) === String(form.agent_id));
  const selectedCategory = categories.find((c) => String(c.id) === String(form.category_id));
  const selectedSub = subcategories.find((s) => String(s.id) === String(form.subcategory_id));

  function upd(name, value) { setForm((f) => ({ ...f, [name]: value })); }

  function applyPreset(id) {
    setPresetId(id);
    const p = filteredPresets.find((p) => String(p.id) === String(id));
    if (!p) return;
    setForm((f) => ({
      ...f,
      carpet_area_sqm: p.carpet_area_sqm,
      built_up_area_sqm: p.built_up_area_sqm ?? f.built_up_area_sqm,
      bedrooms: p.bedrooms ?? f.bedrooms,
      bathrooms: p.bathrooms ?? f.bathrooms,
      balconies: p.balconies ?? f.balconies,
    }));
  }

  function toggleFeature(name) {
    setFeatures((list) => list.includes(name) ? list.filter((x) => x !== name) : [...list, name]);
  }

  function slugify(t) {
    return t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleUpload(key, file, onDone) {
    setUploadingKey(key); setError("");
    try { const url = await uploadFile(file); onDone(url); }
    catch (err) { setError(err.message); }
    finally { setUploadingKey(""); }
  }

  async function addGalleryImages(files) {
    const startIdx = images.length;
    const newSlots = Array.from(files).map(() => ({ url: "", uploading: true }));
    setImages((prev) => [...prev, ...newSlots]);
    await Promise.all(Array.from(files).map(async (file, i) => {
      try {
        const url = await uploadFile(file);
        setImages((prev) => prev.map((img, idx) => idx === startIdx + i ? { url, uploading: false } : img));
      } catch {
        setImages((prev) => prev.map((img, idx) => idx === startIdx + i ? { url: "", uploading: false } : img));
      }
    }));
  }

  async function lookupCoordinates() {
    const q = [form.address, form.locality, selectedCity?.city].filter(Boolean).join(", ");
    if (!q) { setGeocodeMsg("Enter an address or pick a city first."); return; }
    setGeocoding(true); setGeocodeMsg("");
    try {
      const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setGeocodeMsg(data.error || "Lookup failed."); return; }
      upd("latitude", data.latitude); upd("longitude", data.longitude);
      setGeocodeMsg(`Matched: ${data.displayName}`);
    } catch { setGeocodeMsg("Lookup failed."); }
    finally { setGeocoding(false); }
  }

  function validateStep(i) {
    if (i === 0 && !form.title.trim()) return "Give the property a title before continuing.";
    if (i === 3 && (!form.price || Number(form.price) <= 0)) return "Enter a price before continuing.";
    return null;
  }

  function goNext() {
    const msg = validateStep(step);
    if (msg) { setError(msg); return; }
    setError(""); setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() { setError(""); setStep((s) => Math.max(s - 1, 0)); }
  function goToStep(i) {
    if (i <= step) { setStep(i); return; }
    for (let s = step; s < i; s++) {
      const msg = validateStep(s);
      if (msg) { setStep(s); setError(msg); return; }
    }
    setError(""); setStep(i);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    for (let s = 0; s < STEPS.length; s++) {
      const msg = validateStep(s);
      if (msg) { setStep(s); setError(msg); return; }
    }
    setSaving(true); setError("");
    const payload = { ...form };
    if (!payload.slug && payload.title) payload.slug = slugify(payload.title);
    try {
      const res = await fetch(`/api/admin/properties${isNew ? "" : `/${propertyId}`}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed."); setSaving(false); return; }
      const id = isNew ? data.id : propertyId;
      await Promise.all([
        fetch(`/api/admin/properties/${id}/features`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ features }),
        }),
        fetch(`/api/admin/properties/${id}/images`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: images.map((i) => i.url).filter(Boolean) }),
        }),
        fetch(`/api/admin/properties/${id}/floor-plans`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ floorPlans: floorPlans.filter((p) => p.label.trim()) }),
        }),
      ]);
      router.push("/admin/properties"); router.refresh();
    } catch { setError("Save failed."); setSaving(false); }
  }

  if (loading) return <div className="py-16 text-center text-sm text-navy-800/40">Loading property...</div>;

  const isLast = step === STEPS.length - 1;

  return (
    <form onSubmit={handleSubmit} className="pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-navy-900">{isNew ? "Add property" : "Edit property"}</h1>
          <p className="mt-1 text-sm text-navy-800/55">Step {step + 1} of {STEPS.length}</p>
        </div>
        <button type="button" onClick={() => router.push("/admin/properties")} className="btn-outline">Cancel</button>
      </div>

      <Stepper steps={STEPS} current={step} onSelect={goToStep} />

      {error && <div className="mt-4 rounded-xl2 border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-700">{error}</div>}

      <div className="mt-6 space-y-4">
        {step === 0 && <StepBasic form={form} upd={upd} slugify={slugify} categories={categories} filteredSubs={filteredSubs} agents={agents} setPresetId={setPresetId} ic={ic} />}
        {step === 1 && <StepDetails form={form} upd={upd} setForm={setForm} floorPlans={floorPlans} goToFloorPlans={() => setStep(6)} filteredPresets={filteredPresets} presetId={presetId} applyPreset={applyPreset} setPresetId={setPresetId} ic={ic} />}
        {step === 2 && <StepLocation form={form} upd={upd} locations={locations} selectedCity={selectedCity} geocoding={geocoding} geocodeMsg={geocodeMsg} lookupCoordinates={lookupCoordinates} ic={ic} />}
        {step === 3 && <StepPricing form={form} upd={upd} ic={ic} />}
        {step === 4 && <StepAmenities amenities={amenities} features={features} toggleFeature={toggleFeature} />}
        {step === 5 && <StepMedia form={form} upd={upd} images={images} setImages={setImages} addGalleryImages={addGalleryImages} uploadingKey={uploadingKey} handleUpload={handleUpload} ic={ic} />}
        {step === 6 && <StepFloorPlans form={form} upd={upd} floorPlans={floorPlans} setFloorPlans={setFloorPlans} planTypes={planTypes} subName={selectedSub?.name} uploadingKey={uploadingKey} handleUpload={handleUpload} ic={ic} />}
        {step === 7 && <StepLegal form={form} upd={upd} ic={ic} />}
        {step === 8 && <StepIntelligence form={form} upd={upd} ic={ic} />}
        {step === 9 && <StepReview form={form} features={features} images={images} floorPlans={floorPlans} selectedCity={selectedCity} selectedAgent={selectedAgent} selectedCategory={selectedCategory} selectedSub={selectedSub} />}
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between rounded-xl2 border border-navy-900/8 bg-white/95 p-4 shadow-card backdrop-blur">
        <button type="button" onClick={goBack} disabled={step === 0} className="btn-outline disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={16} /> Back
        </button>
        {isLast ? (
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save property"}
          </button>
        ) : (
          <button type="button" onClick={goNext} className="btn-primary">
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </form>
  );
}

// ── Step 1: Basic Info ───────────────────────────────────────────────────────
function StepBasic({ form, upd, slugify, categories, filteredSubs, agents, setPresetId, ic }) {
  return (
    <>
      <Section title="Basic Property Information">
        <Field label="Property title" required>
          <input required value={form.title} onChange={(e) => upd("title", e.target.value)} className={ic} placeholder="e.g. Spacious 3BHK in Bandra West" />
        </Field>
        <Field label="Slug" hint="Auto-generated from title if left blank.">
          <input value={form.slug} onChange={(e) => upd("slug", e.target.value)} className={ic} placeholder={form.title ? slugify(form.title) : "spacious-3bhk-bandra"} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Listing type" required>
            <select required value={form.listing_type} onChange={(e) => upd("listing_type", e.target.value)} className={`${ic} capitalize`}>
              {LISTING_TYPES.map((t) => <option key={t} value={t}>{t === "pg" ? "PG" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Property type" required>
            <select required value={form.property_type} onChange={(e) => upd("property_type", e.target.value)} className={`${ic} capitalize`}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => { upd("category_id", e.target.value); upd("subcategory_id", ""); setPresetId(""); }} className={ic}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subcategory">
            <select value={form.subcategory_id} onChange={(e) => { upd("subcategory_id", e.target.value); setPresetId(""); }} disabled={!form.category_id} className={`${ic} disabled:opacity-50`}>
              <option value="">None</option>
              {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Property status">
            <select value={form.status} onChange={(e) => upd("status", e.target.value)} className={`${ic} capitalize`}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Assigned agent">
            <select value={form.agent_id} onChange={(e) => upd("agent_id", e.target.value)} className={ic}>
              <option value="">Unassigned</option>
              {agents.map((a) => <option key={a.id} value={a.id}>#{a.id}{a.agency_name ? ` — ${a.agency_name}` : ""}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-800/70">
            <input type="checkbox" checked={form.featured} onChange={(e) => upd("featured", e.target.checked)} className="h-4 w-4 accent-teal-500" />
            Featured on homepage
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-800/70">
            <input type="checkbox" checked={form.negotiable} onChange={(e) => upd("negotiable", e.target.checked)} className="h-4 w-4 accent-teal-500" />
            Price is negotiable
          </label>
        </div>
        <Field label="Description">
          <textarea rows={5} value={form.description} onChange={(e) => upd("description", e.target.value)} className={ic} placeholder="Describe the property..." />
        </Field>
      </Section>
    </>
  );
}

// ── Step 2: Details ──────────────────────────────────────────────────────────
// The smallest floor plan ("starts from") — what the headline areas and
// bedroom count on cards, search filters and the property header should show
// for a listing with several configurations.
function smallestPlan(plans) {
  const withArea = plans.filter((p) => Number(p.carpet_area_sqm) > 0);
  if (!withArea.length) return null;
  return withArea.reduce((a, b) => (Number(b.carpet_area_sqm) < Number(a.carpet_area_sqm) ? b : a));
}

function headlineFromPlan(plan) {
  const v = (x) => (x === "" || x == null ? undefined : String(x));
  return Object.fromEntries(
    Object.entries({
      carpet_area_sqm: v(plan.carpet_area_sqm),
      built_up_area_sqm: v(plan.built_up_area_sqm),
      bedrooms: v(plan.bedrooms),
      bathrooms: v(plan.bathrooms),
      balconies: v(plan.balconies),
    }).filter(([, val]) => val !== undefined)
  );
}

// Headline numbers vs. the property's floor plans. Saving syncs them anyway
// (lib/propertyFloorPlans.js); this shows it up front, with a button to
// apply the smallest plan's figures right away.
function FloorPlanSync({ form, setForm, floorPlans, goToFloorPlans }) {
  const plans = floorPlans.filter((p) => String(p.label || "").trim());
  if (!plans.length) return null;
  const smallest = smallestPlan(plans);
  const areas = plans.map((p) => Number(p.carpet_area_sqm)).filter((n) => n > 0);
  const beds = plans.filter((p) => p.bedrooms !== "" && p.bedrooms != null).map((p) => Number(p.bedrooms));
  const range = (list, unit = "") =>
    !list.length ? "—" : Math.min(...list) === Math.max(...list) ? `${Math.min(...list)}${unit}` : `${Math.min(...list)}–${Math.max(...list)}${unit}`;
  const target = smallest ? headlineFromPlan(smallest) : {};
  const inSync = Object.entries(target).every(([k, val]) => Number(form[k]) === Number(val));

  return (
    <div className={`rounded-xl p-3 text-sm ring-1 ${inSync ? "bg-teal-500/5 ring-teal-500/20" : "bg-amber-500/10 ring-amber-500/30"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-semibold ${inSync ? "text-teal-700" : "text-amber-800"}`}>
            {inSync ? "In sync with floor plans" : "Will be updated to match the floor plans when you save"}
          </div>
          <div className="text-xs text-navy-800/60">
            {plans.length} floor plan{plans.length > 1 ? "s" : ""}: {range(areas, " m²")} carpet · {range(beds)} bed.
            {!inSync && smallest && ` Headline should start from ${smallest.label} (${Number(smallest.carpet_area_sqm)} m²).`}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={goToFloorPlans} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-navy-800/70 ring-1 ring-navy-900/10 hover:bg-white">
            Edit floor plans
          </button>
          {!inSync && smallest && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, ...target }))}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Match floor plans
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDetails({ form, upd, setForm, floorPlans, goToFloorPlans, filteredPresets, presetId, applyPreset, setPresetId, ic }) {
  return (
    <>
      <FloorPlanSync form={form} setForm={setForm} floorPlans={floorPlans} goToFloorPlans={goToFloorPlans} />
      <Section title="Room Configuration">
        {filteredPresets.length > 0 && (
          <Field label="Quick preset (from Floor Plans & Sizes)" hint="Auto-fills rooms and areas below.">
            <select value={presetId} onChange={(e) => applyPreset(e.target.value)} className={ic}>
              <option value="">Custom — enter manually</option>
              {filteredPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.label} — {Number(p.carpet_area_sqm)} m²{p.bedrooms ? ` · ${p.bedrooms} bed` : ""}</option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bedrooms">
            <input type="number" min="0" value={form.bedrooms} onChange={(e) => { upd("bedrooms", e.target.value); setPresetId(""); }} className={ic} />
          </Field>
          <Field label="Bathrooms">
            <input type="number" min="0" value={form.bathrooms} onChange={(e) => upd("bathrooms", e.target.value)} className={ic} />
          </Field>
          <Field label="Balconies">
            <input type="number" min="0" value={form.balconies} onChange={(e) => upd("balconies", e.target.value)} className={ic} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Floor number">
            <input type="number" value={form.floor_number} onChange={(e) => upd("floor_number", e.target.value)} className={ic} />
          </Field>
          <Field label="Total floors in building">
            <input type="number" value={form.total_floors} onChange={(e) => upd("total_floors", e.target.value)} className={ic} />
          </Field>
        </div>
      </Section>
      <Section title="Area">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Carpet area (m²)">
            <input type="number" step="0.01" value={form.carpet_area_sqm} onChange={(e) => { upd("carpet_area_sqm", e.target.value); setPresetId(""); }} className={ic} />
          </Field>
          <Field label="Built-up area (m²)">
            <input type="number" step="0.01" value={form.built_up_area_sqm} onChange={(e) => upd("built_up_area_sqm", e.target.value)} className={ic} />
          </Field>
          <Field label="Plot / land area (m²)">
            <input type="number" step="0.01" value={form.area_sqm} onChange={(e) => upd("area_sqm", e.target.value)} className={ic} />
          </Field>
        </div>
      </Section>
      <Section title="Property Characteristics">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Facing">
            <select value={form.facing} onChange={(e) => upd("facing", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {FACING_OPTIONS.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Furnishing">
            <select value={form.furnishing} onChange={(e) => upd("furnishing", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {FURNISHING_OPTIONS.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Construction status">
            <select value={form.construction_status} onChange={(e) => upd("construction_status", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {CONSTRUCTION_STATUSES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Possession date">
            <input type="date" value={form.possession_date} onChange={(e) => upd("possession_date", e.target.value)} className={ic} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Property age">
            <input value={form.property_age} onChange={(e) => upd("property_age", e.target.value)} className={ic} placeholder="e.g. 2 years, New" />
          </Field>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800/60">Parking</label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-navy-800/70">
              <input type="checkbox" checked={form.parking} onChange={(e) => upd("parking", e.target.checked)} className="h-4 w-4 accent-teal-500" />
              Parking available
            </label>
            {form.parking && (
              <input type="number" min="1" value={form.parking_spaces} onChange={(e) => upd("parking_spaces", e.target.value)} className={`${ic} mt-2`} placeholder="No. of spaces" />
            )}
          </div>
        </div>
      </Section>
    </>
  );
}

// ── Step 3: Location ─────────────────────────────────────────────────────────
function StepLocation({ form, upd, locations, selectedCity, geocoding, geocodeMsg, lookupCoordinates, ic }) {
  return (
    <>
      <Section title="Address">
        <Field label="Full address">
          <input value={form.address} onChange={(e) => upd("address", e.target.value)} className={ic} placeholder="148 Riverside Drive" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Locality / Area">
            <input value={form.locality} onChange={(e) => upd("locality", e.target.value)} className={ic} placeholder="e.g. Bandra West" />
          </Field>
          <Field label="City">
            <select value={form.location_id} onChange={(e) => upd("location_id", e.target.value)} className={ic}>
              <option value="">Select a city</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.city}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="State / Region">
            <input value={form.state} onChange={(e) => upd("state", e.target.value)} className={ic} placeholder="e.g. Maharashtra" />
          </Field>
          <Field label="ZIP / PIN code">
            <input value={form.zip_code} onChange={(e) => upd("zip_code", e.target.value)} className={ic} placeholder="400050" />
          </Field>
        </div>
        <Field label="Nearby landmarks" hint="e.g. Metro station 500m, School 1km, Hospital 2km">
          <textarea rows={2} value={form.nearby_landmarks} onChange={(e) => upd("nearby_landmarks", e.target.value)} className={ic} placeholder="Metro station 500m, School 1km..." />
        </Field>
      </Section>
      <Section title="Map Coordinates">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input type="number" step="0.0000001" value={form.latitude} onChange={(e) => upd("latitude", e.target.value)} className={ic} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="0.0000001" value={form.longitude} onChange={(e) => upd("longitude", e.target.value)} className={ic} />
          </Field>
        </div>
        <button type="button" onClick={lookupCoordinates} disabled={geocoding} className="btn-outline w-fit text-xs">
          {geocoding ? <Loader2 size={14} className="animate-spin" /> : <MapPinned size={14} />}
          {geocoding ? "Looking up..." : "Auto-detect from address"}
        </button>
        {geocodeMsg && <p className="text-xs text-navy-800/50">{geocodeMsg}</p>}
        {form.latitude && form.longitude ? (
          <div className="overflow-hidden rounded-xl border border-navy-900/10">
            <iframe
              key={`${form.latitude},${form.longitude}`}
              title="Map preview" className="h-64 w-full"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude)-0.01}%2C${Number(form.latitude)-0.01}%2C${Number(form.longitude)+0.01}%2C${Number(form.latitude)+0.01}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-navy-900/15 text-xs text-navy-800/40">
            Enter address and click auto-detect to preview map
          </div>
        )}
      </Section>
    </>
  );
}

// ── Step 4: Pricing ──────────────────────────────────────────────────────────
function StepPricing({ form, upd, ic }) {
  const isRental = ["rent", "pg", "lease"].includes(form.listing_type);
  return (
    <>
      <Section title="Price">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price" required>
            <input required type="number" step="0.01" value={form.price} onChange={(e) => upd("price", e.target.value)} className={ic} placeholder="0.00" />
          </Field>
          <Field label="Price period">
            <select value={form.price_period} onChange={(e) => upd("price_period", e.target.value)} className={ic}>
              {PRICE_PERIODS.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Maintenance charges (monthly)">
          <input type="number" step="0.01" value={form.maintenance_charges} onChange={(e) => upd("maintenance_charges", e.target.value)} className={ic} placeholder="0.00" />
        </Field>
      </Section>
      {isRental && (
        <Section title="Rental Details">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Security deposit">
              <input type="number" step="0.01" value={form.security_deposit} onChange={(e) => upd("security_deposit", e.target.value)} className={ic} placeholder="0.00" />
            </Field>
            <Field label="Minimum rental period">
              <input value={form.min_rental_period} onChange={(e) => upd("min_rental_period", e.target.value)} className={ic} placeholder="e.g. 11 months" />
            </Field>
          </div>
          <Field label="Available from">
            <input type="date" value={form.available_from} onChange={(e) => upd("available_from", e.target.value)} className={ic} />
          </Field>
        </Section>
      )}
    </>
  );
}

// ── Step 5: Amenities ────────────────────────────────────────────────────────
function StepAmenities({ amenities, features, toggleFeature }) {
  const byCategory = useMemo(() => {
    const grouped = {};
    for (const a of amenities) (grouped[a.category || "other"] ||= []).push(a);
    return grouped;
  }, [amenities]);
  const sections = AMENITY_CATEGORIES.filter((c) => byCategory[c.key]?.length);

  return (
    <Section title="Amenities">
      <p className="-mt-1 text-xs text-navy-800/40">
        {features.length} selected · manage the full list under Properties → Amenities.
      </p>
      {amenities.length === 0 ? (
        <p className="text-sm text-navy-800/40">No amenities configured yet.</p>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.key}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-800/50">
                <span aria-hidden>{section.emoji}</span> {section.label}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {byCategory[section.key].map((a) => {
                  const Icon = getAmenityIcon(a.icon_key);
                  const checked = features.includes(a.name);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors ${checked ? "border-teal-500/30 bg-teal-500/5 text-navy-900" : "border-navy-900/8 text-navy-800/70"}`}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleFeature(a.name)} className="h-4 w-4 accent-teal-500" />
                      <Icon size={15} className={checked ? "text-teal-600" : "text-navy-800/40"} />
                      {a.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Step 6: Media ────────────────────────────────────────────────────────────
function StepMedia({ form, upd, images, setImages, addGalleryImages, uploadingKey, handleUpload, ic }) {
  const galleryRef = useRef();
  const { confirm: ask, dialog } = useDialog();
  const confirmRemove = (what, fn) => async () => {
    if (await ask({ title: `Remove ${what}?`, message: "It will be removed from this property when you save.", confirmLabel: "Remove" })) fn();
  };
  return (
    <>
      <Section title="Cover Image">
        <ImageUploadBox
          value={form.cover_image_url}
          uploading={uploadingKey === "cover"}
          onFile={(file) => handleUpload("cover", file, (url) => upd("cover_image_url", url))}
          onRemove={confirmRemove("the cover image", () => upd("cover_image_url", ""))}
        />
      </Section>
      <Section title="Photo Gallery">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-navy-900/10 bg-sand-50">
              {img.uploading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-teal-500" />
                </div>
              ) : img.url ? (
                <>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={confirmRemove("this photo", () => setImages((prev) => prev.filter((_, idx) => idx !== i)))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-navy-800/30">Failed</div>
              )}
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-900/15 text-navy-800/40 hover:border-teal-500/40 hover:text-teal-600 transition-colors">
            <Upload size={20} />
            <span className="text-xs font-medium">Add photos</span>
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) addGalleryImages(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
        <p className="text-xs text-navy-800/40">Upload multiple photos at once. JPG, PNG, WebP up to 15MB each.</p>
      </Section>
      <Section title="Video & Virtual Tour">
        <Field label="Video tour">
          <FileUploadRow value={form.video_url} uploading={uploadingKey === "video"} accept="video/*"
            placeholder="Upload a video file (MP4, WebM)"
            onFile={(file) => handleUpload("video", file, (url) => upd("video_url", url))}
            onRemove={confirmRemove("the video", () => upd("video_url", ""))} />
        </Field>
        <Field label="360° Virtual tour URL" hint="Paste an embed URL from Matterport, Kuula, etc.">
          <input value={form.virtual_tour_url} onChange={(e) => upd("virtual_tour_url", e.target.value)} className={ic} placeholder="https://my.matterport.com/show/?m=..." />
        </Field>
      </Section>
      <Section title="Documents">
        <p className="text-xs text-navy-800/45">Floor plans and the plot / site plan are in the next step, Floor Plans.</p>
        <Field label="Brochure / PDF">
          <FileUploadRow value={form.brochure_url} uploading={uploadingKey === "brochure"} accept=".pdf,image/*"
            placeholder="Upload brochure PDF"
            onFile={(file) => handleUpload("brochure", file, (url) => upd("brochure_url", url))}
            onRemove={confirmRemove("the brochure", () => upd("brochure_url", ""))} />
        </Field>
      </Section>
      {dialog}
    </>
  );
}

// ── Step 7: Floor Plans ──────────────────────────────────────────────────────
// One card per unit configuration (1 BHK, 2 BHK…) with its own areas, price
// and floor plan drawing; plus the plot / site plan for the whole property.
function StepFloorPlans({ form, upd, floorPlans, setFloorPlans, planTypes, subName, uploadingKey, handleUpload, ic }) {
  const [pickType, setPickType] = useState("");
  const [pickSize, setPickSize] = useState("");
  const { confirm: ask, dialog } = useDialog();
  const typeById = (id) => planTypes.find((t) => String(t.id) === String(id));
  // Sizes labelled like this property's type (e.g. "Apartment") come first.
  const sizesFor = (type) => {
    const sizes = type?.sizes || [];
    const match = (sz) => subName && String(sz.label || "").toLowerCase() === subName.toLowerCase();
    return [...sizes.filter(match), ...sizes.filter((sz) => !match(sz))];
  };
  const sizeText = (sz) => [sz.label, `${Number(sz.carpet_area_sqm)} m² carpet`, sz.built_up_area_sqm && `${Number(sz.built_up_area_sqm)} m² built-up`].filter(Boolean).join(" · ");

  // Values a master type + size fill into a plan (areas copied, so later
  // master edits don't change this property).
  function fromMaster(typeId, sizeId) {
    const type = typeById(typeId);
    if (!type) return { floor_plan_type_id: "", floor_plan_size_id: "" };
    const size = type.sizes.find((sz) => String(sz.id) === String(sizeId));
    const v = (x) => (x == null ? "" : String(x));
    return {
      floor_plan_type_id: type.id,
      floor_plan_size_id: size?.id || "",
      label: size?.label && type.sizes.length > 1 ? `${type.name} · ${size.label}` : type.name,
      bedrooms: v(type.bedrooms), bathrooms: v(type.bathrooms), balconies: v(type.balconies),
      ...(size ? { carpet_area_sqm: v(size.carpet_area_sqm), built_up_area_sqm: v(size.built_up_area_sqm), super_area_sqm: v(size.super_area_sqm) } : {}),
    };
  }

  function choosePickType(id) {
    setPickType(id);
    setPickSize(sizesFor(typeById(id))[0]?.id || "");
  }
  function addPicked() {
    add(fromMaster(pickType, pickSize));
    setPickType("");
    setPickSize("");
  }

  const add = (plan) => {
    setFloorPlans((list) => [...list, { ...emptyPlan, ...plan }]);
    // Keep the headline in step: the first plan fills an empty headline area.
    if (!floorPlans.length && !form.carpet_area_sqm && Number(plan.carpet_area_sqm) > 0) {
      for (const [k, val] of Object.entries(headlineFromPlan(plan))) upd(k, val);
    }
  };
  const change = (i, key, value) => setFloorPlans((list) => list.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  const remove = async (i) => {
    const plan = floorPlans[i];
    const ok = await ask({
      title: `Remove ${plan.label || "this floor plan"}?`,
      message: `Its areas${plan.image_url ? ", price and uploaded plan drawing" : " and price"} will be removed from this property when you save.`,
      confirmLabel: "Remove",
    });
    if (ok) setFloorPlans((list) => list.filter((_, idx) => idx !== i));
  };
  const duplicate = (i) => setFloorPlans((list) => [...list.slice(0, i + 1), { ...list[i], label: `${list[i].label} (copy)` }, ...list.slice(i + 1)]);
  const move = (i, dir) => setFloorPlans((list) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const isPdf = (url) => /\.pdf(\?|#|$)/i.test(url || "");

  return (
    <>
      <Section title="Floor plans by configuration">
        <p className="-mt-1 text-xs text-navy-800/50">
          Add each unit type on offer (1 BHK, 2 BHK, 3 BHK…) with its carpet area, price and floor plan drawing. Buyers switch between them on the property page.
        </p>
        <div className="grid gap-2 rounded-xl bg-teal-500/5 p-3 ring-1 ring-teal-500/15 sm:grid-cols-[1fr,1.4fr,auto,auto] sm:items-center">
          <select value={pickType} onChange={(e) => choosePickType(e.target.value)} className={ic} aria-label="Floor plan">
            <option value="">Choose floor plan…</option>
            {planTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={pickSize} onChange={(e) => setPickSize(e.target.value)} disabled={!pickType} className={`${ic} disabled:bg-sand-50 disabled:text-navy-800/40`} aria-label="Size">
            <option value="">{pickType ? "No standard size (enter areas)" : "Then choose its size…"}</option>
            {sizesFor(typeById(pickType)).map((sz) => <option key={sz.id} value={sz.id}>{sizeText(sz)}</option>)}
          </select>
          <button type="button" onClick={addPicked} disabled={!pickType} className="btn-primary justify-center py-2 disabled:opacity-40">
            <Plus size={15} /> Add
          </button>
          <button type="button" onClick={() => add({})} className="rounded-xl border border-dashed border-navy-900/20 px-3 py-2 text-sm font-semibold text-navy-800/60 hover:border-teal-500 hover:text-teal-700">
            Custom
          </button>
        </div>
        <p className="text-xs text-navy-800/45">
          Floor plans and sizes come from{" "}
          <a href="/admin/floor-plans" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-600 hover:underline">Floor Plans &amp; Sizes</a>
          {planTypes.length ? "" : " (none set up yet)"}. Picking one fills the rooms and areas; you can still adjust them below.
        </p>

        {floorPlans.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-navy-900/10 px-4 py-10 text-center text-sm text-navy-800/45">
            <LayoutPanelTop size={22} className="mx-auto mb-2 text-navy-800/25" />
            No floor plans yet. Choose a floor plan and size above.
          </div>
        ) : (
          <div className="space-y-3">
            {floorPlans.map((p, i) => {
              const key = `plan-${i}`;
              return (
                <div key={i} className="rounded-xl border border-navy-900/10 bg-sand-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-white">{i + 1}</span>
                    <input value={p.label} onChange={(e) => change(i, "label", e.target.value)} placeholder="e.g. 2 BHK, 3 BHK + Study" maxLength={60}
                      className={`${ic} font-semibold`} />
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-800/50 hover:bg-white disabled:opacity-30"><ArrowUp size={15} /></button>
                      <button type="button" title="Move down" onClick={() => move(i, 1)} disabled={i === floorPlans.length - 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-800/50 hover:bg-white disabled:opacity-30"><ArrowDown size={15} /></button>
                      <button type="button" title="Duplicate" onClick={() => duplicate(i)} className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-800/50 hover:bg-white"><Copy size={14} /></button>
                      <button type="button" title="Remove" onClick={() => remove(i)} className="flex h-8 w-8 items-center justify-center rounded-lg text-coral-600 hover:bg-coral-500/10"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <select value={p.floor_plan_type_id} onChange={(e) => setFloorPlans((list) => list.map((x, idx) => (idx === i ? { ...x, ...fromMaster(e.target.value, sizesFor(typeById(e.target.value))[0]?.id) } : x)))}
                      className={ic} aria-label="Floor plan from list">
                      <option value="">Custom (not from list)</option>
                      {planTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={p.floor_plan_size_id} disabled={!p.floor_plan_type_id}
                      onChange={(e) => setFloorPlans((list) => list.map((x, idx) => (idx === i ? { ...x, ...fromMaster(x.floor_plan_type_id, e.target.value) } : x)))}
                      className={`${ic} disabled:bg-sand-50 disabled:text-navy-800/40`} aria-label="Size from list">
                      <option value="">No standard size</option>
                      {sizesFor(typeById(p.floor_plan_type_id)).map((sz) => <option key={sz.id} value={sz.id}>{sizeText(sz)}</option>)}
                    </select>
                  </div>

                  <div className="mt-3 grid gap-4 md:grid-cols-[1fr,220px]">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Field label="Bedrooms"><input type="number" min="0" value={p.bedrooms} onChange={(e) => change(i, "bedrooms", e.target.value)} className={ic} /></Field>
                      <Field label="Bathrooms"><input type="number" min="0" value={p.bathrooms} onChange={(e) => change(i, "bathrooms", e.target.value)} className={ic} /></Field>
                      <Field label="Balconies"><input type="number" min="0" value={p.balconies} onChange={(e) => change(i, "balconies", e.target.value)} className={ic} /></Field>
                      <Field label="Carpet area (m²)"><input type="number" min="0" step="0.01" value={p.carpet_area_sqm} onChange={(e) => change(i, "carpet_area_sqm", e.target.value)} className={ic} /></Field>
                      <Field label="Built-up area (m²)"><input type="number" min="0" step="0.01" value={p.built_up_area_sqm} onChange={(e) => change(i, "built_up_area_sqm", e.target.value)} className={ic} /></Field>
                      <Field label="Super built-up (m²)"><input type="number" min="0" step="0.01" value={p.super_area_sqm} onChange={(e) => change(i, "super_area_sqm", e.target.value)} className={ic} /></Field>
                      <Field label="Price" hint="Leave blank for 'Price on request'"><input type="number" min="0" value={p.price} onChange={(e) => change(i, "price", e.target.value)} className={ic} /></Field>
                    </div>
                    <Field label="Floor plan drawing (naksha)">
                      {p.image_url ? (
                        <div className="relative overflow-hidden rounded-xl border border-navy-900/10 bg-white">
                          {isPdf(p.image_url) ? (
                            <a href={p.image_url} target="_blank" rel="noopener noreferrer" className="flex h-36 flex-col items-center justify-center gap-1 text-sm font-semibold text-teal-600">
                              <FileText size={26} /> PDF plan
                            </a>
                          ) : (
                            <img src={p.image_url} alt={`${p.label} floor plan`} className="h-36 w-full object-contain p-1" />
                          )}
                          <button type="button" onClick={async () => { if (await ask({ title: `Remove the ${p.label || ""} plan drawing?`, message: "It will be removed from this floor plan when you save.", confirmLabel: "Remove" })) change(i, "image_url", ""); }}
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500"><X size={12} /></button>
                        </div>
                      ) : (
                        <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-navy-900/15 bg-white text-navy-800/40 transition-colors hover:border-teal-500/40 hover:text-teal-600">
                          {uploadingKey === key ? <Loader2 size={20} className="animate-spin text-teal-500" /> : <Upload size={20} />}
                          <span className="text-xs font-medium">{uploadingKey === key ? "Uploading..." : "Upload plan"}</span>
                          <span className="text-[11px]">Image or PDF</span>
                          <input type="file" accept="image/*,.pdf" disabled={!!uploadingKey} className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(key, f, (url) => change(i, "image_url", url)); e.target.value = ""; }} />
                        </label>
                      )}
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Plot / site plan (naksha)">
        <p className="-mt-1 text-xs text-navy-800/50">The layout of the whole plot or project: boundaries, roads, open areas. Shown alongside the floor plans.</p>
        <FileUploadRow value={form.site_plan_url} uploading={uploadingKey === "site_plan"} accept="image/*,.pdf"
          placeholder="Upload plot / site plan (image or PDF)"
          onFile={(file) => handleUpload("site_plan", file, (url) => upd("site_plan_url", url))}
          onRemove={async () => { if (await ask({ title: "Remove the plot / site plan?", message: "It will be removed from this property when you save.", confirmLabel: "Remove" })) upd("site_plan_url", ""); }} />
        {form.site_plan_url && !isPdf(form.site_plan_url) && (
          <img src={form.site_plan_url} alt="Plot plan" className="max-h-56 w-full rounded-xl border border-navy-900/10 bg-white object-contain p-1" />
        )}
      </Section>

      <Section title="General floor plan (optional)">
        <p className="-mt-1 text-xs text-navy-800/50">A single overall plan. Shown only if no configurations are added above.</p>
        <FileUploadRow value={form.floor_plan_url} uploading={uploadingKey === "floor_plan"} accept="image/*,.pdf"
          placeholder="Upload floor plan (image or PDF)"
          onFile={(file) => handleUpload("floor_plan", file, (url) => upd("floor_plan_url", url))}
          onRemove={async () => { if (await ask({ title: "Remove the general floor plan?", message: "It will be removed from this property when you save.", confirmLabel: "Remove" })) upd("floor_plan_url", ""); }} />
      </Section>
      {dialog}
    </>
  );
}

// ── Step 8: Legal & Owner ────────────────────────────────────────────────────
function StepLegal({ form, upd, ic }) {
  return (
    <Section title="Ownership & Legal">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner name">
          <input value={form.owner_name} onChange={(e) => upd("owner_name", e.target.value)} className={ic} placeholder="Full name" />
        </Field>
        <Field label="Ownership type">
          <select value={form.ownership_type} onChange={(e) => upd("ownership_type", e.target.value)} className={`${ic} capitalize`}>
            <option value="">Select...</option>
            {OWNERSHIP_TYPES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
      </div>
      <Field label="RERA number" hint="Leave blank if not RERA registered.">
        <input value={form.rera_number} onChange={(e) => upd("rera_number", e.target.value)} className={ic} placeholder="e.g. P52100012345" />
      </Field>
    </Section>
  );
}

// ── Step 9: Intelligence (trust badges + identifiers + financials) ──────────
function StepIntelligence({ form, upd, ic }) {
  return (
    <>
      <Section title="Property Intelligence">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-navy-900/8 px-3 py-2.5 text-sm text-navy-800">
            <input type="checkbox" checked={form.verified} onChange={(e) => upd("verified", e.target.checked)} className="h-4 w-4 accent-teal-500" />
            Verified property
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-navy-900/8 px-3 py-2.5 text-sm text-navy-800">
            <input type="checkbox" checked={form.approved} onChange={(e) => upd("approved", e.target.checked)} className="h-4 w-4 accent-teal-500" />
            Bank approved
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-navy-900/8 px-3 py-2.5 text-sm text-navy-800">
            <input type="checkbox" checked={form.loan_available} onChange={(e) => upd("loan_available", e.target.checked)} className="h-4 w-4 accent-teal-500" />
            Loan available
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Property ID" hint="Shown on the listing page. Leave blank to just use the internal ID.">
            <input value={form.property_custom_id} onChange={(e) => upd("property_custom_id", e.target.value)} className={ic} placeholder="e.g. FH-2024-0001" />
          </Field>
          <Field label="Listing condition">
            <select value={form.listing_condition} onChange={(e) => upd("listing_condition", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {LISTING_CONDITIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Builder / developer name">
            <input value={form.builder_name} onChange={(e) => upd("builder_name", e.target.value)} className={ic} placeholder="e.g. Meridian Developers" />
          </Field>
          <Field label="Tower / block name">
            <input value={form.tower_block} onChange={(e) => upd("tower_block", e.target.value)} className={ic} placeholder="e.g. Tower B" />
          </Field>
          <Field label="Unit number">
            <input value={form.unit_number} onChange={(e) => upd("unit_number", e.target.value)} className={ic} placeholder="e.g. 402" />
          </Field>
          <Field label="Parking slot number">
            <input value={form.parking_slot_number} onChange={(e) => upd("parking_slot_number", e.target.value)} className={ic} placeholder="e.g. B2-14" />
          </Field>
          <Field label="Last renovated date">
            <input type="date" value={form.last_renovated_date} onChange={(e) => upd("last_renovated_date", e.target.value)} className={ic} />
          </Field>
          <Field label="Maintenance frequency">
            <select value={form.maintenance_frequency} onChange={(e) => upd("maintenance_frequency", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {MAINTENANCE_FREQUENCIES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Property tax status">
            <select value={form.property_tax_status} onChange={(e) => upd("property_tax_status", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {PROPERTY_TAX_STATUSES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Financial & Investment">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Expected rental yield (%)">
            <input type="number" step="0.01" value={form.rental_yield_percent} onChange={(e) => upd("rental_yield_percent", e.target.value)} className={ic} placeholder="e.g. 4.5" />
          </Field>
          <Field label="Estimated monthly rent">
            <input type="number" value={form.estimated_monthly_rent} onChange={(e) => upd("estimated_monthly_rent", e.target.value)} className={ic} placeholder="0.00" />
          </Field>
          <Field label="Capital appreciation potential">
            <select value={form.capital_appreciation} onChange={(e) => upd("capital_appreciation", e.target.value)} className={`${ic} capitalize`}>
              <option value="">Select...</option>
              {APPRECIATION_LEVELS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Brokerage">
            <input type="number" value={form.brokerage} onChange={(e) => upd("brokerage", e.target.value)} className={ic} placeholder="0.00" />
          </Field>
          <Field label="Registration cost estimate">
            <input type="number" value={form.registration_charges} onChange={(e) => upd("registration_charges", e.target.value)} className={ic} placeholder="0.00" />
          </Field>
          <Field label="Stamp duty estimate">
            <input type="number" value={form.stamp_duty} onChange={(e) => upd("stamp_duty", e.target.value)} className={ic} placeholder="0.00" />
          </Field>
          <Field label="Other charges">
            <input type="number" value={form.other_charges} onChange={(e) => upd("other_charges", e.target.value)} className={ic} placeholder="0.00" />
          </Field>
        </div>

        <p className="pt-1 text-xs font-medium text-navy-800/60">Scores (1–5, shown as a rating bar on the listing)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Investment score">
            <input type="number" min="1" max="5" value={form.investment_score} onChange={(e) => upd("investment_score", e.target.value)} className={ic} />
          </Field>
          <Field label="Rental demand score">
            <input type="number" min="1" max="5" value={form.rental_demand_score} onChange={(e) => upd("rental_demand_score", e.target.value)} className={ic} />
          </Field>
          <Field label="Location growth score">
            <input type="number" min="1" max="5" value={form.location_growth_score} onChange={(e) => upd("location_growth_score", e.target.value)} className={ic} />
          </Field>
          <Field label="Future development score">
            <input type="number" min="1" max="5" value={form.future_development_score} onChange={(e) => upd("future_development_score", e.target.value)} className={ic} />
          </Field>
        </div>
      </Section>
    </>
  );
}

// ── Step 10: Review ──────────────────────────────────────────────────────────
function StepReview({ form, features, images, floorPlans, selectedCity, selectedAgent, selectedCategory, selectedSub }) {
  const rows = [
    ["Listing type", form.listing_type],
    ["Property type", form.property_type],
    ["Status", form.status?.replace(/_/g, " ")],
    ["Price", form.price ? `${Number(form.price).toLocaleString()} (${form.price_period?.replace(/_/g, " ")})` : "—"],
    ["Negotiable", form.negotiable ? "Yes" : "No"],
    ["Beds / Baths / Balconies", `${form.bedrooms || 0} / ${form.bathrooms || 0} / ${form.balconies || 0}`],
    ["Carpet / Built-up / Plot", `${form.carpet_area_sqm || "—"} / ${form.built_up_area_sqm || "—"} / ${form.area_sqm || "—"} m²`],
    ["Floor", form.floor_number ? `${form.floor_number} of ${form.total_floors || "?"}` : "—"],
    ["Facing", form.facing?.replace(/_/g, " ") || "—"],
    ["Furnishing", form.furnishing?.replace(/_/g, " ") || "—"],
    ["Construction", form.construction_status?.replace(/_/g, " ") || "—"],
    ["Parking", form.parking ? `Yes (${form.parking_spaces || 1} space${form.parking_spaces > 1 ? "s" : ""})` : "No"],
    ["Location", [form.locality, selectedCity?.city, form.state].filter(Boolean).join(", ") || "—"],
    ["ZIP", form.zip_code || "—"],
    ["Maintenance", form.maintenance_charges ? `${Number(form.maintenance_charges).toLocaleString()}/mo` : "—"],
    ["Security deposit", form.security_deposit ? Number(form.security_deposit).toLocaleString() : "—"],
    ["Owner", form.owner_name || "—"],
    ["RERA", form.rera_number || "—"],
    ["Verified / Bank approved", `${form.verified ? "Yes" : "No"} / ${form.approved ? "Yes" : "No"}`],
    ["Listing condition", form.listing_condition || "—"],
    ["Builder", form.builder_name || "—"],
    ["Rental yield / Est. monthly rent", `${form.rental_yield_percent ? `${form.rental_yield_percent}%` : "—"} / ${form.estimated_monthly_rent ? Number(form.estimated_monthly_rent).toLocaleString() : "—"}`],
    ["Scores (Investment/Rental/Growth/Future)", `${form.investment_score || "—"}/${form.rental_demand_score || "—"}/${form.location_growth_score || "—"}/${form.future_development_score || "—"}`],
    ["Agent", selectedAgent ? `#${selectedAgent.id}${selectedAgent.agency_name ? ` — ${selectedAgent.agency_name}` : ""}` : "Unassigned"],
    ["Amenities", features.length ? `${features.length} selected` : "None"],
    ["Gallery photos", `${images.filter((i) => i.url).length}`],
    ["Video", form.video_url ? "Yes" : "No"],
    ["Virtual tour", form.virtual_tour_url ? "Yes" : "No"],
    ["Floor plans", floorPlans.filter((p) => p.label.trim()).map((p) => p.label).join(", ") || (form.floor_plan_url ? "1 (general)" : "None")],
    ["Plot / site plan", form.site_plan_url ? "Yes" : "No"],
    ["Brochure", form.brochure_url ? "Yes" : "No"],
  ];
  return (
    <Section title="Review & Publish">
      <p className="-mt-1 text-xs text-navy-800/40">Check everything below, then click Save property. Click any step above to edit.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-navy-900/8">
          {form.cover_image_url
            ? <img src={form.cover_image_url} alt="" className="h-44 w-full object-cover" />
            : <div className="flex h-44 items-center justify-center bg-sand-100 text-xs text-navy-800/30">No cover image</div>}
          <div className="p-4">
            <div className="font-display text-lg text-navy-900">{form.title || "Untitled property"}</div>
            {(selectedCategory || selectedSub) && (
              <div className="mt-0.5 text-xs capitalize text-navy-800/50">{[selectedCategory?.name, selectedSub?.name].filter(Boolean).join(" · ")}</div>
            )}
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 border-b border-navy-900/5 pb-1.5">
              <span className="shrink-0 text-navy-800/50">{label}</span>
              <span className="text-right font-medium capitalize text-navy-900">{value || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Shared UI helpers ────────────────────────────────────────────────────────
function ImageUploadBox({ value, uploading, onFile, onRemove }) {
  return (
    <div className="relative">
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-navy-900/10">
          <img src={value} alt="" className="h-48 w-full object-cover" />
          <button type="button" onClick={onRemove}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-900/15 text-navy-800/40 hover:border-teal-500/40 hover:text-teal-600 transition-colors">
          {uploading ? <Loader2 size={24} className="animate-spin text-teal-500" /> : <Upload size={24} />}
          <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload cover image"}</span>
          <span className="text-xs">JPG, PNG, WebP up to 15MB</span>
          <input type="file" accept="image/*" disabled={uploading} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </label>
      )}
    </div>
  );
}

function FileUploadRow({ value, uploading, accept, placeholder, onFile, onRemove }) {
  const name = value ? value.split("/").pop() : "";
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-navy-900/10 bg-sand-50 px-3 py-2 text-sm text-navy-800/70">
            <FileText size={14} className="shrink-0 text-teal-600" />
            <span className="truncate">{name}</span>
          </div>
          <button type="button" onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-navy-900/10 text-navy-800/40 hover:text-coral-600">
            <X size={15} />
          </button>
        </>
      ) : (
        <label className="flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-navy-900/15 px-3 text-sm text-navy-800/40 hover:border-teal-500/40 hover:text-teal-600 transition-colors">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading..." : placeholder}
          <input type="file" accept={accept} disabled={uploading} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </label>
      )}
    </div>
  );
}

function Stepper({ steps, current, onSelect }) {
  return (
    <div className="mt-6 flex items-center overflow-x-auto rounded-xl2 border border-navy-900/8 bg-white p-3">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <button type="button" onClick={() => onSelect(i)} className="flex shrink-0 flex-col items-center gap-1.5 px-1.5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${active ? "bg-teal-500 text-white" : done ? "bg-teal-500/15 text-teal-600" : "bg-sand-100 text-navy-800/40"}`}>
                {done ? <Check size={18} /> : <s.Icon size={18} />}
              </span>
              <span className={`whitespace-nowrap text-[11px] font-medium ${active ? "text-navy-900" : "text-navy-800/45"}`}>{s.label}</span>
            </button>
            {i < steps.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${done ? "bg-teal-500/40" : "bg-navy-900/8"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card-surface space-y-3 p-5">
      <h2 className="font-display text-base text-navy-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-navy-800/60">
        {label}{required && <span className="text-coral-600"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-navy-800/40">{hint}</p>}
    </div>
  );
}
