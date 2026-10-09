// Shared by the Admin → Floor Plans API routes: the master list of unit
// types (1 BHK, 2 BHK…) and the standard sizes under each.
import { NextResponse } from "next/server";
import { query } from "./db";
import { requireAdmin } from "./adminGuard";
import { canAccessSection } from "./adminPermissions";

// Editing needs the Floor Plans section; reading is also open to anyone who
// can edit properties, since the property form picks from this list.
export function guard({ write = false } = {}) {
  const admin = requireAdmin();
  const ok = admin && (canAccessSection(admin.admin_role, "floor-plans") || (!write && canAccessSection(admin.admin_role, "properties")));
  return ok ? null : NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
}

const num = (v) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
const int = (v) => (num(v) === null ? null : Math.max(0, Math.round(Number(v))));

export function cleanType(body) {
  const name = String(body?.name || "").trim().slice(0, 60);
  if (!name) return { error: "Give the floor plan a name, e.g. 2 BHK." };
  return { row: { name, bedrooms: int(body.bedrooms), bathrooms: int(body.bathrooms), balconies: int(body.balconies), sort_order: int(body.sort_order) ?? 0 } };
}

export function cleanSize(body) {
  const carpet = num(body?.carpet_area_sqm);
  if (!(carpet > 0)) return { error: "Enter the carpet area." };
  const builtUp = num(body.built_up_area_sqm);
  const superArea = num(body.super_area_sqm);
  if (builtUp !== null && builtUp < carpet) return { error: "Built-up area is usually larger than carpet area." };
  return {
    row: {
      label: String(body.label || "").trim().slice(0, 60) || null,
      carpet_area_sqm: carpet,
      built_up_area_sqm: builtUp,
      super_area_sqm: superArea,
    },
  };
}

// Every type with its sizes (smallest first), for the admin page and the property form.
export async function listTypes() {
  const [types, sizes] = await Promise.all([
    query("SELECT id, name, bedrooms, bathrooms, balconies, sort_order FROM floor_plan_types ORDER BY sort_order ASC, id ASC"),
    query("SELECT id, floor_plan_type_id, label, carpet_area_sqm, built_up_area_sqm, super_area_sqm FROM floor_plan_sizes ORDER BY carpet_area_sqm ASC, id ASC"),
  ]);
  const n = (v) => (v == null ? null : Number(v));
  return types.map((t) => ({
    ...t,
    sizes: sizes
      .filter((s) => s.floor_plan_type_id === t.id)
      .map((s) => ({ ...s, carpet_area_sqm: n(s.carpet_area_sqm), built_up_area_sqm: n(s.built_up_area_sqm), super_area_sqm: n(s.super_area_sqm) })),
  }));
}

export function dbError(err, fallback) {
  if (err?.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "A floor plan with that name already exists." }, { status: 409 });
  return NextResponse.json({ error: fallback, detail: err?.message }, { status: 400 });
}
