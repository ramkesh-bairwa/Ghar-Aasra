// A property's own floor plans (one row per configuration), shared by the
// admin property form and the seller listing wizard so both store them the
// same way — and keep the property's headline areas/rooms in sync with them. Areas are copied from the master list, so later edits to
// Admin → Floor Plans & Sizes don't change listings already made.
import { query } from "./db";

const COLUMNS = "floor_plan_type_id, floor_plan_size_id, label, bedrooms, bathrooms, balconies, carpet_area_sqm, built_up_area_sqm, super_area_sqm, price, image_url";

// Only http(s) links or files we uploaded, since image_url lands in <img>/<a>.
function safeUrl(value) {
  const v = String(value || "").trim();
  return /^https?:\/\//i.test(v) || /^\/uploads\/[\w./-]+$/.test(v) ? v.slice(0, 500) : null;
}
const num = (v) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
const int = (v) => (num(v) === null ? null : Math.max(0, Math.round(Number(v))));

export function cleanFloorPlans(list) {
  return (Array.isArray(list) ? list : [])
    .map((p) => ({
      floor_plan_type_id: int(p?.floor_plan_type_id) || null,
      floor_plan_size_id: int(p?.floor_plan_size_id) || null,
      label: String(p?.label || "").trim().slice(0, 60),
      bedrooms: int(p?.bedrooms),
      bathrooms: int(p?.bathrooms),
      balconies: int(p?.balconies),
      carpet_area_sqm: num(p?.carpet_area_sqm),
      built_up_area_sqm: num(p?.built_up_area_sqm),
      super_area_sqm: num(p?.super_area_sqm),
      price: num(p?.price),
      image_url: safeUrl(p?.image_url),
    }))
    .filter((p) => p.label)
    .slice(0, 30);
}

export async function getFloorPlanRows(propertyId) {
  return query(`SELECT ${COLUMNS} FROM property_floor_plans WHERE property_id = ? ORDER BY sort_order ASC, id ASC`, [propertyId]);
}

// Replace-all write; returns how many plans were stored.
export async function saveFloorPlans(propertyId, list) {
  const clean = cleanFloorPlans(list);
  await query("DELETE FROM property_floor_plans WHERE property_id = ?", [propertyId]);
  if (clean.length) {
    const values = clean.flatMap((p, i) => [
      propertyId, p.floor_plan_type_id, p.floor_plan_size_id, p.label, p.bedrooms, p.bathrooms, p.balconies,
      p.carpet_area_sqm, p.built_up_area_sqm, p.super_area_sqm, p.price, p.image_url, i,
    ]);
    await query(
      `INSERT INTO property_floor_plans (property_id, ${COLUMNS}, sort_order) VALUES ${clean.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
      values
    );
    await syncHeadlineFromPlans(propertyId, clean);
  }
  return clean.length;
}

// Keeps the property's own headline figures (used by listing cards, search
// filters, compare and the page header) in step with its floor plans: they
// "start from" the smallest configuration. Fields a plan leaves blank keep
// the property's current value.
export async function syncHeadlineFromPlans(propertyId, plans) {
  const sized = plans.filter((p) => p.carpet_area_sqm > 0);
  if (!sized.length) return;
  const smallest = sized.reduce((a, b) => (b.carpet_area_sqm < a.carpet_area_sqm ? b : a));
  await query(
    `UPDATE properties SET
       carpet_area_sqm = ?,
       built_up_area_sqm = COALESCE(?, built_up_area_sqm),
       bedrooms = COALESCE(?, bedrooms),
       bathrooms = COALESCE(?, bathrooms),
       balconies = COALESCE(?, balconies)
     WHERE id = ?`,
    [smallest.carpet_area_sqm, smallest.built_up_area_sqm, smallest.bedrooms, smallest.bathrooms, smallest.balconies, propertyId]
  );
}
