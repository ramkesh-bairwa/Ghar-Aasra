import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { validateAd } from "@/lib/ads";

export const dynamic = "force-dynamic";
const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

export async function GET() {
  if (!requireAdminForSection("ads")) return forbidden();
  try {
    const rows = await query(
      `SELECT *, (is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())) AS is_live
       FROM ad_banners ORDER BY placement, sort_order, id DESC`
    );
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: "Could not load banners.", detail: err.message }, { status: 503 });
  }
}

export async function POST(request) {
  if (!requireAdminForSection("ads")) return forbidden();
  const result = validateAd(await request.json().catch(() => ({})));
  if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
  try {
    const cols = Object.keys(result.row);
    const r = await query(`INSERT INTO ad_banners (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, cols.map((c) => result.row[c]));
    return NextResponse.json({ ok: true, id: r.insertId });
  } catch (err) {
    return NextResponse.json({ error: "Could not save the banner.", detail: err.message }, { status: 503 });
  }
}
