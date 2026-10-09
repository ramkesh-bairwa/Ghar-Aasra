import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

// Mirrors GET /api/bookings' shape (property_slug, property_title,
// cover_image_url, address) so My Bookings can render both sections with
// similar card markup, plus the fields specific to a schedule-visit lead
// (preferred_date/preferred_time instead of one scheduled_at, and its own
// new/contacted/scheduled/closed status vocabulary).
export async function GET() {
  const session = requireUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rows = await query(
    `SELECT v.id, v.booking_code, v.preferred_date, v.preferred_time, v.message, v.status, v.created_at,
            p.slug AS property_slug, p.title AS property_title, p.cover_image_url, p.address
     FROM visit_requests v
     LEFT JOIN properties p ON p.id = v.property_id
     WHERE v.user_id = ?
     ORDER BY v.preferred_date DESC, v.preferred_time DESC`,
    [session.id]
  );

  return NextResponse.json({ visitRequests: rows });
}
