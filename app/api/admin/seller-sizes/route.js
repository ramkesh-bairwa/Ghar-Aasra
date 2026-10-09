import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// Areas sellers entered themselves, grouped by seller on the admin page:
// custom floor plan sizes (not picked from Admin → Floor Plans & Sizes) and
// the headline carpet / built-up area of each seller listing.
export async function GET() {
  if (!requireAdminForSection("seller-sizes")) return forbidden();
  try {
    const [plans, listings, types] = await Promise.all([
      query(
        `SELECT fp.id, fp.label, fp.bedrooms, fp.bathrooms, fp.carpet_area_sqm, fp.built_up_area_sqm, fp.super_area_sqm,
           fp.floor_plan_type_id, fpt.name AS type_name, fp.created_at,
           p.id AS property_id, p.title AS property_title, p.slug AS property_slug, p.status AS property_status,
           u.id AS seller_id, u.name AS seller_name, u.email AS seller_email, sp.business_name
         FROM property_floor_plans fp
         JOIN properties p ON p.id = fp.property_id
         JOIN users u ON u.id = p.owner_user_id
         LEFT JOIN seller_profiles sp ON sp.user_id = u.id
         LEFT JOIN floor_plan_types fpt ON fpt.id = fp.floor_plan_type_id
         WHERE fp.floor_plan_size_id IS NULL
         ORDER BY u.name, p.title, fp.sort_order`
      ),
      query(
        `SELECT p.id AS property_id, p.title AS property_title, p.slug AS property_slug, p.status AS property_status,
           p.property_type, p.bhk, p.carpet_area_sqm, p.built_up_area_sqm, p.area_sqm, p.created_at,
           u.id AS seller_id, u.name AS seller_name, u.email AS seller_email, sp.business_name,
           (SELECT COUNT(*) FROM property_floor_plans fp WHERE fp.property_id = p.id) AS plan_count
         FROM properties p
         JOIN users u ON u.id = p.owner_user_id
         LEFT JOIN seller_profiles sp ON sp.user_id = u.id
         WHERE p.carpet_area_sqm IS NOT NULL OR p.built_up_area_sqm IS NOT NULL OR p.area_sqm IS NOT NULL
         ORDER BY u.name, p.created_at DESC`
      ),
      query("SELECT id, name FROM floor_plan_types ORDER BY sort_order, name"),
    ]);
    return NextResponse.json({ plans, listings, types });
  } catch (err) {
    return NextResponse.json({ error: "Could not load seller sizes.", detail: err.message }, { status: 503 });
  }
}

// Promote a seller's custom size into the master list under a floor plan type,
// so other sellers can pick it.
export async function POST(request) {
  if (!requireAdminForSection("seller-sizes")) return forbidden();
  const { planId, typeId, label } = await request.json().catch(() => ({}));
  const e = {};
  if (!(Number(typeId) > 0)) e.typeId = "Choose which floor plan type this size belongs to.";
  const [plan] = await query("SELECT * FROM property_floor_plans WHERE id = ? LIMIT 1", [Number(planId)]);
  if (!plan) e.planId = "That floor plan no longer exists.";
  else if (!(Number(plan.carpet_area_sqm) > 0)) e.planId = "This size has no carpet area, so it can't be added to the list.";
  if (Object.keys(e).length) return NextResponse.json({ error: Object.values(e)[0], fieldErrors: e }, { status: 400 });
  try {
    const result = await query(
      `INSERT INTO floor_plan_sizes (floor_plan_type_id, label, carpet_area_sqm, built_up_area_sqm, super_area_sqm, sort_order)
       VALUES (?, ?, ?, ?, ?, 999)`,
      [Number(typeId), String(label || "").trim().slice(0, 60) || null, plan.carpet_area_sqm, plan.built_up_area_sqm, plan.super_area_sqm]
    );
    // The seller's plan now matches a standard size.
    await query("UPDATE property_floor_plans SET floor_plan_type_id = ?, floor_plan_size_id = ? WHERE id = ?", [Number(typeId), result.insertId, plan.id]);
    return NextResponse.json({ ok: true, sizeId: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: "Could not add it to the master list.", detail: err.message }, { status: 503 });
  }
}
