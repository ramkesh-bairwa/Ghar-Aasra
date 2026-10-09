"use client";

import { useState } from "react";
import { Plus, Trash2, LayoutPanelTop, PencilRuler, BadgeCheck } from "lucide-react";
import { Field, SuffixInput, FileUpload, inputClass } from "@/components/vendor/listing/WizardUI";

const blank = {
  floor_plan_type_id: "", floor_plan_size_id: "", label: "", bedrooms: "", bathrooms: "", balconies: "",
  carpet_area_sqm: "", built_up_area_sqm: "", super_area_sqm: "", price: "", image_url: "",
};
const v = (x) => (x == null ? "" : String(x));

// Seller wizard's floor plans: pick a unit type and size from the admin's
// master list (Admin → Floor Plans & Sizes) so the rooms and areas fill in,
// or enter your own size. Editing a standard size's areas turns it into a
// custom size, which admins review under Seller-added sizes.
// `ask` is useDialog().confirm; `errors` is keyed "floorPlans.<i>.<field>".
export default function FloorPlansEditor({ plans, setPlans, types, subName, symbol, isRent, ask, errors = {} }) {
  const [pickType, setPickType] = useState("");
  const [pickSize, setPickSize] = useState("");

  const typeById = (id) => types.find((t) => String(t.id) === String(id));
  // Sizes labelled like this property's type (e.g. "Apartment") come first.
  const sizesFor = (type) => {
    const sizes = type?.sizes || [];
    const match = (sz) => subName && String(sz.label || "").toLowerCase() === subName.toLowerCase();
    return [...sizes.filter(match), ...sizes.filter((sz) => !match(sz))];
  };
  const sizeText = (sz) => [sz.label, `${sz.carpet_area_sqm} m² carpet`, sz.built_up_area_sqm && `${sz.built_up_area_sqm} m² built-up`].filter(Boolean).join(" · ");

  function fromMaster(typeId, sizeId) {
    const type = typeById(typeId);
    if (!type) return { floor_plan_type_id: "", floor_plan_size_id: "" };
    const size = type.sizes.find((sz) => String(sz.id) === String(sizeId));
    return {
      floor_plan_type_id: type.id,
      floor_plan_size_id: size?.id || "",
      label: size?.label && type.sizes.length > 1 ? `${type.name} · ${size.label}` : type.name,
      bedrooms: v(type.bedrooms), bathrooms: v(type.bathrooms), balconies: v(type.balconies),
      ...(size ? { carpet_area_sqm: v(size.carpet_area_sqm), built_up_area_sqm: v(size.built_up_area_sqm), super_area_sqm: v(size.super_area_sqm) } : {}),
    };
  }

  const change = (i, patch) => setPlans((list) => list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  // Typing your own area means it's no longer the standard size.
  const changeArea = (i, patch) => change(i, { ...patch, floor_plan_size_id: "" });
  const err = (i, field) => errors[`floorPlans.${i}.${field}`];
  function add(plan) {
    setPlans((list) => [...list, { ...blank, ...plan }]);
    setPickType("");
    setPickSize("");
  }
  async function remove(i) {
    const plan = plans[i];
    const ok = await ask({
      title: `Remove ${plan.label || "this floor plan"}?`,
      message: `Its areas${plan.image_url ? ", price and plan drawing" : " and price"} will be removed from your listing when you save.`,
      confirmLabel: "Remove",
    });
    if (ok) setPlans((list) => list.filter((_, idx) => idx !== i));
  }
  const confirmFileRemove = () => ask({ title: "Remove this plan drawing?", message: "You can upload a new one any time.", confirmLabel: "Remove" });

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-2xl bg-teal-500/5 p-3 ring-1 ring-teal-500/15 sm:grid-cols-[1fr,1.5fr,auto]">
        <select
          value={pickType}
          onChange={(e) => { setPickType(e.target.value); setPickSize(sizesFor(typeById(e.target.value))[0]?.id || ""); }}
          className={inputClass}
          aria-label="Floor plan"
        >
          <option value="">Choose floor plan…</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={pickSize} onChange={(e) => setPickSize(e.target.value)} disabled={!pickType} className={`${inputClass} disabled:opacity-50`} aria-label="Size">
          <option value="">{pickType ? "✏️ My own size — I'll enter the areas" : "Then choose its size…"}</option>
          {sizesFor(typeById(pickType)).map((sz) => <option key={sz.id} value={sz.id}>{sizeText(sz)}</option>)}
        </select>
        <button type="button" onClick={() => add(fromMaster(pickType, pickSize))} disabled={!pickType} className="btn-primary justify-center disabled:opacity-40">
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <button type="button" onClick={() => add({})} className="inline-flex items-center gap-1.5 font-semibold text-teal-600 hover:text-teal-700">
          <PencilRuler size={15} /> Add my own layout & size
        </button>
        <span className="text-xs text-navy-800/45">Not in the list? Enter your own carpet and built-up area. Our team reviews custom sizes.</span>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-navy-900/10 px-4 py-8 text-center text-sm text-navy-800/50">
          <LayoutPanelTop size={22} className="mx-auto mb-2 text-navy-800/25" />
          No floor plans yet. Selling several unit types? Add each one, e.g. 2 BHK and 3 BHK.
        </div>
      ) : (
        plans.map((p, i) => (
          <div key={i} className="rounded-2xl bg-sand-50 p-4 ring-1 ring-navy-900/10">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-white">{i + 1}</span>
              <input value={p.label} onChange={(e) => change(i, { label: e.target.value })} maxLength={60} placeholder="Name, e.g. 2 BHK" className={`${inputClass} font-semibold ${err(i, "label") ? "!ring-2 !ring-coral-500/70" : ""}`} aria-label="Floor plan name" />
              {p.floor_plan_size_id ? (
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-600 sm:inline-flex" title="Picked from the standard sizes list">
                  <BadgeCheck size={12} /> Standard size
                </span>
              ) : (
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:inline-flex" title="You entered this size yourself">
                  <PencilRuler size={12} /> Custom size
                </span>
              )}
              <button type="button" onClick={() => remove(i)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-coral-600 hover:bg-coral-500/10" aria-label="Remove floor plan">
                <Trash2 size={16} />
              </button>
            </div>

            {err(i, "label") && <p data-field-error="" className="mt-1.5 text-xs font-medium text-coral-600">{err(i, "label")}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select value={p.floor_plan_type_id} onChange={(e) => change(i, fromMaster(e.target.value, sizesFor(typeById(e.target.value))[0]?.id))} className={inputClass} aria-label="Floor plan from list">
                <option value="">Custom layout</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={p.floor_plan_size_id} disabled={!p.floor_plan_type_id} onChange={(e) => change(i, fromMaster(p.floor_plan_type_id, e.target.value))} className={`${inputClass} disabled:opacity-50`} aria-label="Size from list">
                <option value="">✏️ My own size</option>
                {sizesFor(typeById(p.floor_plan_type_id)).map((sz) => <option key={sz.id} value={sz.id}>{sizeText(sz)}</option>)}
              </select>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr,200px]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Carpet area" required hint="Usable floor area" error={err(i, "carpet_area_sqm")}><SuffixInput suffix="m²" type="number" min="0" value={p.carpet_area_sqm} onChange={(e) => changeArea(i, { carpet_area_sqm: e.target.value })} /></Field>
                <Field label="Built-up area" hint="Carpet + walls" error={err(i, "built_up_area_sqm")}><SuffixInput suffix="m²" type="number" min="0" value={p.built_up_area_sqm} onChange={(e) => changeArea(i, { built_up_area_sqm: e.target.value })} /></Field>
                <Field label="Super built-up" hint="Built-up + common areas" error={err(i, "super_area_sqm")}><SuffixInput suffix="m²" type="number" min="0" value={p.super_area_sqm} onChange={(e) => changeArea(i, { super_area_sqm: e.target.value })} /></Field>
                <Field label="Bedrooms"><SuffixInput type="number" min="0" value={p.bedrooms} onChange={(e) => change(i, { bedrooms: e.target.value })} /></Field>
                <Field label="Bathrooms"><SuffixInput type="number" min="0" value={p.bathrooms} onChange={(e) => change(i, { bathrooms: e.target.value })} /></Field>
                <Field label="Balconies"><SuffixInput type="number" min="0" value={p.balconies} onChange={(e) => change(i, { balconies: e.target.value })} /></Field>
                <Field label={isRent ? "Rent for this unit" : "Price for this unit"} hint="Optional" className="col-span-2 sm:col-span-3 sm:max-w-xs">
                  <SuffixInput prefix={symbol} type="number" min="0" value={p.price} onChange={(e) => change(i, { price: e.target.value })} />
                </Field>
              </div>
              <Field label="Plan drawing (naksha)">
                <FileUpload
                  value={p.image_url}
                  onChange={(url) => change(i, { image_url: url })}
                  beforeRemove={confirmFileRemove}
                  accept="image/*,application/pdf"
                  label="Plan"
                  hint="Image or PDF"
                  icon={LayoutPanelTop}
                />
              </Field>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
