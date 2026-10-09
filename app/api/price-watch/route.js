import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

export const dynamic = "force-dynamic";

// GET ?propertyId= → { watching } · GET (no id) → the user's watched listings
export async function GET(request) {
  const user = requireUser();
  const propertyId = Number(new URL(request.url).searchParams.get("propertyId"));
  if (!user) return NextResponse.json({ watching: false, watches: [] });
  if (propertyId) {
    const rows = await query("SELECT id FROM price_watches WHERE user_id = ? AND property_id = ? LIMIT 1", [user.id, propertyId]);
    return NextResponse.json({ watching: rows.length > 0 });
  }
  const watches = await query(
    `SELECT w.property_id, w.price_at_watch, w.created_at, p.title, p.slug, p.price, p.cover_image_url, p.status, l.city
     FROM price_watches w JOIN properties p ON p.id = w.property_id LEFT JOIN locations l ON l.id = p.location_id
     WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    [user.id]
  );
  return NextResponse.json({ watches });
}

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in to get price alerts." }, { status: 401 });
  const { propertyId } = await request.json().catch(() => ({}));
  const [p] = await query("SELECT id, price FROM properties WHERE id = ? AND status IN ('published', 'under_offer') LIMIT 1", [Number(propertyId)]);
  if (!p) return NextResponse.json({ error: "This listing isn't available." }, { status: 404 });
  await query(
    "INSERT INTO price_watches (user_id, property_id, price_at_watch) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price_at_watch = VALUES(price_at_watch), last_notified_price = NULL",
    [user.id, p.id, p.price]
  );
  return NextResponse.json({ ok: true, watching: true });
}

export async function DELETE(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { propertyId } = await request.json().catch(() => ({}));
  await query("DELETE FROM price_watches WHERE user_id = ? AND property_id = ?", [user.id, Number(propertyId)]);
  return NextResponse.json({ ok: true, watching: false });
}
