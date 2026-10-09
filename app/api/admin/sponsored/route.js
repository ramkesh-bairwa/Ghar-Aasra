import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";
const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// Sponsored listings (shown first in search with a "Sponsored" badge).
// GET ?q= also searches live listings to add.
export async function GET(request) {
  if (!requireAdminForSection("ads")) return forbidden();
  const q = String(new URL(request.url).searchParams.get("q") || "").trim();
  try {
    const sponsored = await query(
      `SELECT p.id, p.title, p.slug, p.cover_image_url, p.price, p.listing_type, p.sponsored_until, l.city, u.name AS seller_name,
         (p.sponsored_until >= NOW()) AS is_live
       FROM properties p LEFT JOIN locations l ON l.id = p.location_id LEFT JOIN users u ON u.id = p.owner_user_id
       WHERE p.sponsored_until IS NOT NULL ORDER BY p.sponsored_until DESC`
    );
    const results = q
      ? await query(
          `SELECT p.id, p.title, p.slug, p.cover_image_url, p.price, p.listing_type, l.city
           FROM properties p LEFT JOIN locations l ON l.id = p.location_id
           WHERE p.status IN ('published', 'under_offer') AND (p.title LIKE ? OR p.slug LIKE ? OR p.id = ?)
           ORDER BY p.created_at DESC LIMIT 10`,
          [`%${q}%`, `%${q}%`, Number(q) || 0]
        )
      : [];
    return NextResponse.json({ sponsored, results });
  } catch (err) {
    return NextResponse.json({ error: "Could not load sponsored listings.", detail: err.message }, { status: 503 });
  }
}

// { propertyId, until: "YYYY-MM-DD" | null }
export async function PUT(request) {
  if (!requireAdminForSection("ads")) return forbidden();
  const { propertyId, until } = await request.json().catch(() => ({}));
  if (!(Number(propertyId) > 0)) return NextResponse.json({ error: "Choose a listing." }, { status: 400 });
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return NextResponse.json({ error: "Pick a valid end date.", fieldErrors: { until: "Pick a valid end date." } }, { status: 400 });
  }
  if (until && until < new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: "The end date is in the past.", fieldErrors: { until: "Pick today or a future date." } }, { status: 400 });
  }
  await query("UPDATE properties SET sponsored_until = ? WHERE id = ?", [until ? `${until} 23:59:59` : null, Number(propertyId)]);
  return NextResponse.json({ ok: true });
}
