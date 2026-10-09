import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";
import { canAccessSection } from "@/lib/adminPermissions";

// The admin bell: newest visit bookings, schedule requests, enquiries and
// callbacks from the last 30 days — only the kinds this admin's role may see.
// `serverNow` lets the client track "seen up to" in the DB's own clock, so
// unread detection never depends on the browser's timezone.
export async function GET() {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const role = admin.admin_role;

  const parts = [];
  if (canAccessSection(role, "bookings")) {
    parts.push(`
      SELECT 'booking' AS kind, b.id, b.created_at,
             COALESCE(u.name, b.guest_name) AS name, p.title AS property_title,
             b.scheduled_at AS detail, b.visit_type AS extra, b.status
      FROM bookings b JOIN properties p ON p.id = b.property_id LEFT JOIN users u ON u.id = b.user_id
      WHERE b.created_at >= NOW() - INTERVAL 30 DAY`);
  }
  if (canAccessSection(role, "schedule")) {
    parts.push(`
      SELECT 'visit_request' AS kind, v.id, v.created_at, v.name, p.title AS property_title,
             CONCAT(v.preferred_date, ' ', v.preferred_time) AS detail, NULL AS extra, v.status
      FROM visit_requests v LEFT JOIN properties p ON p.id = v.property_id
      WHERE v.created_at >= NOW() - INTERVAL 30 DAY`);
  }
  if (canAccessSection(role, "inquiries")) {
    parts.push(`
      SELECT i.source AS kind, i.id, i.created_at, i.name, p.title AS property_title,
             i.phone AS detail, NULL AS extra, i.status
      FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id
      WHERE i.created_at >= NOW() - INTERVAL 30 DAY`);
  }

  try {
    const [{ serverNow }] = await query("SELECT NOW() AS serverNow");
    if (!parts.length) return NextResponse.json({ items: [], serverNow });
    const items = await query(`${parts.join(" UNION ALL ")} ORDER BY created_at DESC LIMIT 25`);
    return NextResponse.json({ items, serverNow });
  } catch (err) {
    return NextResponse.json({ items: [], error: "Could not load notifications." }, { status: 503 });
  }
}
