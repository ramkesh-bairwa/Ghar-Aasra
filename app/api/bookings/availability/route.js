import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Public (no auth) — just tells the booking calendar which times are
// already taken for a given property/day so it can grey them out. No
// identity or contact info is exposed, only the booked timestamps.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const propertyId = Number(searchParams.get("propertyId"));
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!propertyId || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return NextResponse.json({ error: "propertyId and date are required." }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT scheduled_at FROM bookings
       WHERE property_id = ? AND status != 'cancelled' AND DATE(scheduled_at) = ?`,
      [propertyId, date]
    );
    // lib/db.js runs mysql2 with dateStrings:true, so scheduled_at already
    // arrives as a plain "YYYY-MM-DD HH:MM:SS" string — slicing it avoids
    // any Date-object timezone round-trip.
    const taken = rows.map((r) => String(r.scheduled_at).slice(11, 16));
    return NextResponse.json({ taken });
  } catch {
    return NextResponse.json({ taken: [] });
  }
}
