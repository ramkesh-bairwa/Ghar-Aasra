import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

export async function GET() {
  const session = requireUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rows = await query(
    `SELECT b.id, b.scheduled_at, b.notes, b.status, b.created_at,
            p.slug AS property_slug, p.title AS property_title, p.cover_image_url, p.address
     FROM bookings b
     JOIN properties p ON p.id = b.property_id
     WHERE b.user_id = ?
     ORDER BY b.scheduled_at DESC`,
    [session.id]
  );

  return NextResponse.json({ bookings: rows });
}

// Creates a visit booking from the "Book a visit" scheduler on a property
// page. Slot-taken checks (GET /api/bookings/availability) happen client-side
// before this is called, but re-validated here against a race since two
// people could pick the same slot at once.
export async function POST(request) {
  const session = requireUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { propertyId, scheduledAt, notes } = await request.json();
  // Plain "YYYY-MM-DD HH:MM:SS" wall-clock string — matches the naive
  // (timezone-less) semantics of a MySQL DATETIME column exactly, so there's
  // no Date-object serialization/timezone round-trip to get wrong.
  if (!propertyId || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(scheduledAt || "")) {
    return NextResponse.json({ error: "A property and a scheduled time are required." }, { status: 400 });
  }
  if (new Date(scheduledAt.replace(" ", "T")).getTime() < Date.now()) {
    return NextResponse.json({ error: "Pick a valid upcoming date and time." }, { status: 400 });
  }

  try {
    const [property] = await query("SELECT id FROM properties WHERE id = ? LIMIT 1", [Number(propertyId)]);
    if (!property) return NextResponse.json({ error: "That property no longer exists." }, { status: 404 });

    const taken = await query(
      "SELECT id FROM bookings WHERE property_id = ? AND scheduled_at = ? AND status != 'cancelled' LIMIT 1",
      [Number(propertyId), scheduledAt]
    );
    if (taken.length) return NextResponse.json({ error: "That slot was just taken — pick another time." }, { status: 409 });

    const result = await query(
      "INSERT INTO bookings (user_id, property_id, scheduled_at, notes, status) VALUES (?, ?, ?, ?, 'pending')",
      [session.id, Number(propertyId), scheduledAt, notes || null]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: "Could not book that visit.", detail: err.message }, { status: 503 });
  }
}
