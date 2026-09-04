"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, MapPin, BedDouble, Bath, Ruler, Tag, FileText, Sparkles,
  ImagePlus, UploadCloud, Trash2, Loader2, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

const LISTING_TYPES = [
  { value: "sale", label: "Sell" },
  { value: "rent", label: "Rent out" },
  { value: "commercial", label: "Commercial" },
];
const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "office", label: "Office" },
  { value: "commercial", label: "Commercial" },
];
const MAX_GALLERY = 6;

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-navy-800/70">
        {Icon && <Icon size={14} className="text-navy-800/40" />}
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-navy-900/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30";

export default function AddPropertyForm({ locations, amenities }) {
  const { currency_symbol } = useSiteSettings();
  const router = useRouter();
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [listingType, setListingType] = useState("sale");
  const [propertyType, setPropertyType] = useState("apartment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pricePeriod, setPricePeriod] = useState("monthly");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const [coverImage, setCoverImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  function toggleFeature(name) {
    setSelectedFeatures((prev) => (prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]));
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/properties/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    return data.url;
  }

  async function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setCoverImage(await uploadFile(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_GALLERY - gallery.length);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setGallery((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!coverImage) return setError("Add at least a cover photo before publishing.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/properties/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, listingType, propertyType,
          price: Number(price), pricePeriod: listingType === "rent" ? pricePeriod : "one_time",
          bedrooms: Number(bedrooms) || 0, bathrooms: Number(bathrooms) || 0,
          areaSqm: areaSqm ? Number(areaSqm) : null,
          address, locationId: locationId || null,
          coverImageUrl: coverImage, gallery, features: selectedFeatures,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not publish your listing.");
      setDone(data.slug);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card-surface mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
          <CheckCircle2 size={28} />
        </span>
        <h2 className="font-display text-xl text-navy-900">Your listing is live</h2>
        <p className="text-sm text-navy-800/60">Buyers and renters can find it right away. You can always edit the details later.</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => router.push(`/properties/${done}`)} className="btn-primary">
            View listing
            <ArrowRight size={15} />
          </button>
          <button onClick={() => router.push("/properties")} className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            Browse all properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
      <div className="card-surface p-6 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
          <Home size={18} className="text-teal-600" /> What are you listing?
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-sand-100 p-1">
          {LISTING_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setListingType(t.value)}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                listingType === t.value ? "bg-white text-navy-900 shadow-soft" : "text-navy-800/55"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Property title" icon={Tag}>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunlit two-bedroom near the park" className={inputClass} />
          </Field>
          <Field label="Property type" icon={Home}>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="card-surface p-6 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
          <Tag size={18} className="text-teal-600" /> Pricing & details
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label={`Price (${currency_symbol})`} icon={Tag}>
            <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
          </Field>
          {listingType === "rent" && (
            <Field label="Billed">
              <select value={pricePeriod} onChange={(e) => setPricePeriod(e.target.value)} className={inputClass}>
                <option value="monthly">Per month</option>
                <option value="yearly">Per year</option>
              </select>
            </Field>
          )}
          <Field label="Bedrooms" icon={BedDouble}>
            <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Bathrooms" icon={Bath}>
            <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Area (m²)" icon={Ruler}>
            <input type="number" min="0" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="card-surface p-6 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
          <MapPin size={18} className="text-teal-600" /> Location
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="City" icon={MapPin}>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClass}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.city}{l.country ? `, ${l.country}` : ""}</option>
              ))}
            </select>
          </Field>
          <Field label="Street address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 22 Golden Gate Way" className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="card-surface p-6 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
          <ImagePlus size={18} className="text-teal-600" /> Photos
        </h2>
        <p className="mt-1 text-xs text-navy-800/50">A great cover photo gets more views. Add up to {MAX_GALLERY} more for the gallery.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-navy-900/15 text-navy-800/40 hover:border-teal-500 hover:text-teal-600">
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                <span className="absolute inset-0 hidden items-center justify-center bg-navy-950/50 text-white group-hover:flex">
                  Replace
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-1 text-[11px] font-medium">
                <UploadCloud size={18} /> Cover photo
              </span>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </label>

          {gallery.map((url, i) => (
            <div key={url} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/70 text-white"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {gallery.length < MAX_GALLERY && (
            <label className="flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-900/15 text-[11px] font-medium text-navy-800/40 hover:border-teal-500 hover:text-teal-600">
              <ImagePlus size={18} />
              Add photo
              <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
            </label>
          )}
        </div>
        {uploading && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-navy-800/50">
            <Loader2 size={13} className="animate-spin" /> Uploading…
          </p>
        )}
      </div>

      {amenities?.length > 0 && (
        <div className="card-surface p-6 md:p-7">
          <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
            <Sparkles size={18} className="text-teal-600" /> Amenities
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.map((a) => {
              const active = selectedFeatures.includes(a.name);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleFeature(a.name)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active ? "border-teal-500 bg-teal-500 text-white" : "border-navy-900/10 text-navy-800/70 hover:border-teal-500/40"
                  }`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-surface p-6 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-xl text-navy-900">
          <FileText size={18} className="text-teal-600" /> Description
        </h2>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what makes this place worth a visit..."
          className={`${inputClass} mt-4`}
        />
      </div>

      {error && <p className="rounded-lg bg-coral-500/10 px-4 py-3 text-sm text-coral-600">{error}</p>}

      <button type="submit" disabled={submitting || uploading} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? "Publishing…" : "Publish listing"}
        {!submitting && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
