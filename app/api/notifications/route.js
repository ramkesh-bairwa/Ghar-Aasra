import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { refreshUserAlerts } from "@/lib/alerts";

// The customer bell: the signed-in user's own visit bookings, schedule
// requests, and enquiries (matched by their account email, since the
// enquiry form doesn't require signing in). Each item carries its current
// status, so the client can flag one as new again when the status changes.
export async function GET() {
  const session = requireUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    // Saved-search and price-drop alerts are generated on check-in (throttled to once a minute).
    await refreshUserAlerts(session.id);
    const [user] = await query("SELECT email FROM users WHERE id = ? LIMIT 1", [session.id]);
    const items = await query(
      `SELECT * FROM (
         SELECT 'booking' AS kind, b.id, b.created_at, b.status, b.scheduled_at AS detail, b.visit_type AS extra,
                p.title AS property_title, p.slug AS property_slug
         FROM bookings b JOIN properties p ON p.id = b.property_id
         WHERE b.user_id = ?
         UNION ALL
         SELECT 'visit_request', v.id, v.created_at, v.status, CONCAT(v.preferred_date, ' ', v.preferred_time), NULL,
                p.title, p.slug
         FROM visit_requests v LEFT JOIN properties p ON p.id = v.property_id
         WHERE v.user_id = ?
         UNION ALL
         SELECT i.source, i.id, i.created_at, i.status, NULL, NULL, p.title, p.slug
         FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id
         WHERE ? IS NOT NULL AND i.email = ?
         UNION ALL
         SELECT a.kind, a.id, a.created_at, 'new', NULL, a.new_price, p.title, p.slug
         FROM user_alerts a JOIN properties p ON p.id = a.property_id
         WHERE a.user_id = ?
       ) n
       ORDER BY created_at DESC LIMIT 20`,
      [session.id, session.id, user?.email || null, user?.email || null, session.id]
    );
    const [{ serverNow }] = await query("SELECT NOW() AS serverNow");
    return NextResponse.json({ items, serverNow });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
