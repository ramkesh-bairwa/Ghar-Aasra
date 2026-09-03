import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";

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

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  try {
    const rows = await query("SELECT * FROM properties ORDER BY created_at DESC");
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: "Could not reach MySQL.", detail: err.message }, { status: 503 });
  }
}

export async function POST(request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await request.json();
  const cols = ALLOWED.filter((c) => c in body && body[c] !== "" && body[c] !== null && body[c] !== undefined);
  if (!cols.length) return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  const values = cols.map((c) => normalize(c, body[c]));
  try {
    const result = await query(
      `INSERT INTO properties (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
      values
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: "Insert failed.", detail: err.message }, { status: 400 });
  }
}
