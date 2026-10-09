import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForResource } from "@/lib/adminGuard";
import { addAutoCharge } from "@/lib/sellers";

// Marking a seller's listing sold/rented adds their per-deal commission.
const DEAL_STATUSES = ["sold", "rented"];

const ALLOWED = [
  "title","slug","description","listing_type","property_type","category_id","subcategory_id",
  "price","price_period","rent_price","price_per_sqft","bedrooms","bathrooms","balconies","bhk",
  "area_sqm","carpet_area_sqm","built_up_area_sqm","floor_number","total_floors","property_age",
  "facing","furnishing","parking","parking_spaces","construction_status","possession_date",
  "ownership_type","negotiable","rera_number","address","locality","state","zip_code",
  "location_id","latitude","longitude","nearby_landmarks","cover_image_url","video_url",
  "virtual_tour_url","floor_plan_url","site_plan_url","brochure_url","agent_id","project_id",
  "status","available_status","featured","premium","luxury","verified","approved","tags",
  "property_custom_id","maintenance_charges","security_deposit","min_rental_period",
  "available_from","owner_name","brokerage","registration_charges","stamp_duty","other_charges",
  "listing_condition","builder_name","tower_block","unit_number","last_renovated_date",
  "maintenance_frequency","property_tax_status","loan_available","rental_yield_percent",
  "estimated_monthly_rent","capital_appreciation","investment_score","rental_demand_score",
  "location_growth_score","future_development_score","parking_slot_number",
];

const BOOL_COLS = new Set(["featured","premium","luxury","verified","approved","parking","negotiable","loan_available"]);

function normalize(col, val) {
  if (BOOL_COLS.has(col)) return val ? 1 : 0;
  if (val === "" || val === undefined) return null;
  return val;
}

export async function GET(request, { params }) {
  if (!requireAdminForResource("properties")) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  try {
    const rows = await query("SELECT * FROM properties WHERE id = ? LIMIT 1", [params.id]);
    if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ row: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: "DB error.", detail: err.message }, { status: 503 });
  }
}

export async function PUT(request, { params }) {
  if (!requireAdminForResource("properties")) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  const body = await request.json();

  // Special actions
  if (body._action === "publish") {
    const newStatus = body.status;
    await query("UPDATE properties SET status = ? WHERE id = ?", [newStatus, params.id]);
    if (DEAL_STATUSES.includes(newStatus)) await addAutoCharge({ type: "deal", sourceType: "property", sourceId: Number(params.id), propertyId: Number(params.id) });
    return NextResponse.json({ ok: true });
  }
  if (body._action === "approve") {
    await query("UPDATE properties SET approved = ? WHERE id = ?", [body.approved ? 1 : 0, params.id]);
    return NextResponse.json({ ok: true });
  }
  if (body._action === "duplicate") {
    const rows = await query("SELECT * FROM properties WHERE id = ? LIMIT 1", [params.id]);
    if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const orig = rows[0];
    const newSlug = `${orig.slug}-copy-${Date.now()}`;
    const cols = ALLOWED.filter((c) => c !== "id" && orig[c] !== undefined && orig[c] !== null);
    const vals = cols.map((c) => (c === "slug" ? newSlug : c === "status" ? "draft" : orig[c]));
    const result = await query(
      `INSERT INTO properties (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
      vals
    );
    // duplicate features & images
    const feats = await query("SELECT feature FROM property_features WHERE property_id = ?", [params.id]);
    if (feats.length) {
      await query(
        `INSERT INTO property_features (property_id, feature) VALUES ${feats.map(() => "(?,?)").join(",")}`,
        feats.flatMap((f) => [result.insertId, f.feature])
      );
    }
    const imgs = await query("SELECT image_url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order", [params.id]);
    if (imgs.length) {
      await query(
        `INSERT INTO property_images (property_id, image_url, sort_order) VALUES ${imgs.map(() => "(?,?,?)").join(",")}`,
        imgs.flatMap((i) => [result.insertId, i.image_url, i.sort_order])
      );
    }
    return NextResponse.json({ ok: true, id: result.insertId });
  }

  const cols = ALLOWED.filter((c) => c in body);
  if (!cols.length) return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  const values = [...cols.map((c) => normalize(c, body[c])), params.id];
  try {
    await query(`UPDATE properties SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, values);
    if (DEAL_STATUSES.includes(body.status)) await addAutoCharge({ type: "deal", sourceType: "property", sourceId: Number(params.id), propertyId: Number(params.id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed.", detail: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdminForResource("properties")) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  try {
    await query("DELETE FROM properties WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed.", detail: err.message }, { status: 400 });
  }
}
