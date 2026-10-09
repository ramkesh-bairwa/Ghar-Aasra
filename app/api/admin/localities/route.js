import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { discoverLocalities, slugifyLocality, validateLocality } from "@/lib/localities";

export const dynamic = "force-dynamic";
const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

const AREA = "COALESCE(NULLIF(p.built_up_area_sqm, 0), NULLIF(p.carpet_area_sqm, 0), NULLIF(p.area_sqm, 0))";

export async function GET() {
  if (!requireAdminForSection("localities")) return forbidden();
  try {
    const [rows, suggestions, locations] = await Promise.all([
      query(
        `SELECT loc.*, l.city,
           (SELECT COUNT(*) FROM properties p WHERE p.location_id = loc.location_id AND LOWER(TRIM(p.locality)) = LOWER(loc.name) AND p.status IN ('published','under_offer')) AS listings,
           (SELECT AVG(p.price / ${AREA}) FROM properties p WHERE p.location_id = loc.location_id AND LOWER(TRIM(p.locality)) = LOWER(loc.name)
              AND p.status IN ('published','under_offer') AND p.listing_type = 'sale' AND p.price > 0 AND ${AREA} IS NOT NULL) AS avg_sale_rate
         FROM localities loc JOIN locations l ON l.id = loc.location_id
         ORDER BY loc.sort_order, l.city, loc.name`
      ),
      discoverLocalities(),
      query("SELECT id, city FROM locations ORDER BY city"),
    ]);
    return NextResponse.json({ rows, suggestions, locations });
  } catch (err) {
    return NextResponse.json({ error: "Could not load localities.", detail: err.message }, { status: 503 });
  }
}

export async function POST(request) {
  if (!requireAdminForSection("localities")) return forbidden();
  const result = validateLocality(await request.json().catch(() => ({})));
  if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
  try {
    const [loc] = await query("SELECT city FROM locations WHERE id = ?", [result.row.location_id]);
    let slug = slugifyLocality(result.row.name, loc?.city);
    const taken = await query("SELECT id FROM localities WHERE slug = ?", [slug]);
    if (taken.length) slug = `${slug}-${Date.now().toString(36)}`;
    const row = { ...result.row, slug };
    const cols = Object.keys(row);
    const r = await query(`INSERT INTO localities (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, cols.map((c) => row[c]));
    return NextResponse.json({ ok: true, id: r.insertId, slug });
  } catch (err) {
    const dup = err.code === "ER_DUP_ENTRY";
    return NextResponse.json(
      { error: dup ? "This locality already exists in that city." : "Could not save.", fieldErrors: dup ? { name: "This locality already exists in that city." } : undefined },
      { status: 400 }
    );
  }
}
