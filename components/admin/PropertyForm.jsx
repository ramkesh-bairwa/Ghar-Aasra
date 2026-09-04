"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, MapPinned, Loader2, Save, Check,
  Info, DollarSign, MapPin, Sparkles, Image as ImageIcon,
  ClipboardCheck, ChevronRight, ChevronLeft, Upload, X, FileText, Shield, TrendingUp,
} from "lucide-react";
import { getAmenityIcon, AMENITY_CATEGORIES } from "@/lib/amenityIcons";

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

export default function PropertyForm({ propertyId }) {
  const router = useRouter();
  const isNew = !propertyId;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [features, setFeatures] = useState([]);
  const [images, setImages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [presets, setPresets] = useState([]);
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
      fetch("/api/admin/carpet_area_presets").then((r) => r.ok ? r.json() : { rows: [] }),
    ]).then(([loc, cat, sub, ag, am, cap]) => {
      setLocations(loc.rows || []);
      setCategories(cat.rows || []);
      setSubcategories(sub.rows || []);
      setAgents(ag.rows || []);
      setAmenities(am.rows || []);
      setPresets(cap.rows || []);
    });
  }, []);

  useEffect(() => {
    if (isNew) return;
    Promise.all([
      fetch(`/api/admin/properties/${propertyId}`).then((r) => r.json()),
      fetch(`/api/admin/properties/${propertyId}/features`).then((r) => r.json()),
      fetch(`/api/admin/properties/${propertyId}/images`).then((r) => r.json()),
    ]).then(([propData, featData, imgData]) => {
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
    }).finally(() => setLoading(false));
  }, [propertyId, isNew]);

  const filteredSubs = useMemo(
    () => subcategories.filter((s) => String(s.category_id) === String(form.category_id)),
    [subcategories, form.category_id]
  );
  const filteredPresets = useMemo(
    () => presets.filter((p) => String(p.subcategory_id) === String(form.subcategory_id)),
    [presets, form.subcategory_id]
  );

  const selectedCity = locations.find((l) => String(l.id) === String(form.location_id));
  const selectedAgent = agents.find((a) => String(a.id) === String(form.agent_id));
  const selectedCategory = categories.find((c) => String(c.id) === String(form.category_id));
  const selectedSub = subcategories.find((s) => String(s.id) === String(form.subcategory_id));

  function upd(name, value) { setForm((f) => ({ ...f, [name]: value })); }

  function applyPreset(id) {
    setPresetId(id);
    const p = presets.find((p) => String(p.id) === String(id));
    if (!p) return;
    setForm((f) => ({ ...f, carpet_area_sqm: p.carpet_area_sqm, built_up_area_sqm: p.built_up_area_sqm ?? f.built_up_area_sqm, bedrooms: p.bedrooms ?? f.bedrooms }));
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
        {step === 1 && <StepDetails form={form} upd={upd} filteredPresets={filteredPresets} presetId={presetId} applyPreset={applyPreset} setPresetId={setPresetId} ic={ic} />}
        {step === 2 && <StepLocation form={form} upd={upd} locations={locations} selectedCity={selectedCity} geocoding={geocoding} geocodeMsg={geocodeMsg} lookupCoordinates={lookupCoordinates} ic={ic} />}
        {step === 3 && <StepPricing form={form} upd={upd} ic={ic} />}
        {step === 4 && <StepAmenities amenities={amenities} features={features} toggleFeature={toggleFeature} />}
        {step === 5 && <StepMedia form={form} upd={upd} images={images} setImages={setImages} addGalleryImages={addGalleryImages} uploadingKey={uploadingKey} handleUpload={handleUpload} ic={ic} />}
        {step === 6 && <StepLegal form={form} upd={upd} ic={ic} />}
        {step === 7 && <StepIntelligence form={form} upd={upd} ic={ic} />}
        {step === 8 && <StepReview form={form} features={features} images={images} selectedCity={selectedCity} selectedAgent={selectedAgent} selectedCategory={selectedCategory} selectedSub={selectedSub} />}
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
function StepDetails({ form, upd, filteredPresets, presetId, applyPreset, setPresetId, ic }) {
  return (
    <>
      <Section title="Room Configuration">
        {filteredPresets.length > 0 && (
          <Field label="Quick preset (BHK)" hint="Auto-fills area and bedroom count below.">
            <select value={presetId} onChange={(e) => applyPreset(e.target.value)} className={ic}>
              <option value="">Custom — enter manually</option>
              {filteredPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.label} — {p.carpet_area_sqm} m²{p.bedrooms != null ? ` · ${p.bedrooms} bed` : ""}</option>
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
  return (
    <>
      <Section title="Cover Image">
        <ImageUploadBox
          value={form.cover_image_url}
          uploading={uploadingKey === "cover"}
          onFile={(file) => handleUpload("cover", file, (url) => upd("cover_image_url", url))}
          onRemove={() => upd("cover_image_url", "")}
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
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
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
            onRemove={() => upd("video_url", "")} />
        </Field>
        <Field label="360° Virtual tour URL" hint="Paste an embed URL from Matterport, Kuula, etc.">
          <input value={form.virtual_tour_url} onChange={(e) => upd("virtual_tour_url", e.target.value)} className={ic} placeholder="https://my.matterport.com/show/?m=..." />
        </Field>
      </Section>
      <Section title="Documents">
        <Field label="Floor plan">
          <FileUploadRow value={form.floor_plan_url} uploading={uploadingKey === "floor_plan"} accept="image/*,.pdf"
            placeholder="Upload floor plan (image or PDF)"
            onFile={(file) => handleUpload("floor_plan", file, (url) => upd("floor_plan_url", url))}
            onRemove={() => upd("floor_plan_url", "")} />
        </Field>
        <Field label="Brochure / PDF">
          <FileUploadRow value={form.brochure_url} uploading={uploadingKey === "brochure"} accept=".pdf,image/*"
            placeholder="Upload brochure PDF"
            onFile={(file) => handleUpload("brochure", file, (url) => upd("brochure_url", url))}
            onRemove={() => upd("brochure_url", "")} />
        </Field>
      </Section>
    </>
  );
}

// ── Step 7: Legal & Owner ────────────────────────────────────────────────────
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

// ── Step 8: Intelligence (trust badges + identifiers + financials) ──────────
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

// ── Step 8: Review ───────────────────────────────────────────────────────────
function StepReview({ form, features, images, selectedCity, selectedAgent, selectedCategory, selectedSub }) {
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
    ["Floor plan", form.floor_plan_url ? "Yes" : "No"],
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
