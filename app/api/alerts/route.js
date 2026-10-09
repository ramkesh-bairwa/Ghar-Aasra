import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { refreshUserAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

// The user's alert feed (new matches + price drops), newest first.
export async function GET() {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  await refreshUserAlerts(user.id, { force: true });
  try {
    const alerts = await query(
      `SELECT a.id, a.kind, a.old_price, a.new_price, a.read_at, a.created_at, s.name AS search_name,
         p.title, p.slug, p.price, p.price_period, p.listing_type, p.cover_image_url, p.bedrooms, p.locality, l.city
       FROM user_alerts a
       JOIN properties p ON p.id = a.property_id
       LEFT JOIN locations l ON l.id = p.location_id
       LEFT JOIN saved_searches s ON s.id = a.saved_search_id
       WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 100`,
      [user.id]
    );
    return NextResponse.json({ alerts, unread: alerts.filter((a) => !a.read_at).length });
  } catch (err) {
    return NextResponse.json({ error: "Could not load alerts.", detail: err.message }, { status: 503 });
  }
}

// { action: "read_all" }
export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { action } = await request.json().catch(() => ({}));
  if (action === "read_all") await query("UPDATE user_alerts SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL", [user.id]);
  return NextResponse.json({ ok: true });
}
