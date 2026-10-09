import { NextResponse } from "next/server";
import { insertWithBookingCode } from "@/lib/bookingCode";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { getAllSiteSettings } from "@/lib/queries";

export async function GET() {
  const session = requireUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rows = await query(
    `SELECT b.id, b.booking_code, b.property_id, b.scheduled_at, b.visit_type, b.pickup_required, b.notes, b.status, b.created_at,
            p.latitude, p.longitude,
            p.slug AS property_slug, p.title AS property_title, p.cover_image_url, p.address
     FROM bookings b
     JOIN properties p ON p.id = b.property_id
     WHERE b.user_id = ?
     ORDER BY b.scheduled_at DESC`,
    [session.id]
  );

  return NextResponse.json({ bookings: rows });
}

const PHONE_RE = /^[+\d][\d\s-]{6,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a visit booking from the "Book a visit" scheduler on a property
// page. Signing in is optional: a guest books with just a name and phone
// number (stored in guest_*), so the scheduler never bounces a visitor to a
// login page mid-booking. Slot-taken checks (GET /api/bookings/availability)
// happen client-side before this is called, but re-validated here against a
// race since two people could pick the same slot at once.
export async function POST(request) {
  const session = requireUser();
  const { propertyId, scheduledAt, notes, name, phone, email, visitType, pickupRequired, pickupAddress } = await request.json();

  // Plain "YYYY-MM-DD HH:MM:SS" wall-clock string — matches the naive
  // (timezone-less) semantics of a MySQL DATETIME column exactly, so there's
  // no Date-object serialization/timezone round-trip to get wrong.
  if (!propertyId || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(scheduledAt || "")) {
    return NextResponse.json({ error: "A property and a scheduled time are required." }, { status: 400 });
  }
  if (new Date(scheduledAt.replace(" ", "T")).getTime() < Date.now()) {
    return NextResponse.json({ error: "Pick a valid upcoming date and time." }, { status: 400 });
  }
  if (!session) {
    if (!name?.trim()) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!PHONE_RE.test(phone?.trim() || "")) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  const settings = await getAllSiteSettings();
  const type = visitType === "video" && settings.visit_video_enabled === "true" ? "video" : "in_person";
  const pickup = type === "in_person" && settings.visit_pickup_enabled === "true" && !!pickupRequired;
  if (pickup && !pickupAddress?.trim()) {
    return NextResponse.json({ error: "Add a pickup address, or untick the pickup option." }, { status: 400 });
  }

  try {
    const [property] = await query("SELECT id FROM properties WHERE id = ? AND status != 'draft' LIMIT 1", [Number(propertyId)]);
    if (!property) return NextResponse.json({ error: "That property no longer exists." }, { status: 404 });

    const taken = await query(
      "SELECT id FROM bookings WHERE property_id = ? AND scheduled_at = ? AND status != 'cancelled' LIMIT 1",
      [Number(propertyId), scheduledAt]
    );
    if (taken.length) return NextResponse.json({ error: "That slot was just taken — pick another time." }, { status: 409 });

    const { result, code } = await insertWithBookingCode(
      "BK",
      `INSERT INTO bookings
         (booking_code, user_id, guest_name, guest_phone, guest_email, property_id, scheduled_at, visit_type, pickup_required, pickup_address, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        session?.id || null,
        session ? null : name.trim(),
        session ? phone?.trim() || null : phone.trim(),
        session ? null : email?.trim() || null,
        Number(propertyId),
        scheduledAt,
        type,
        pickup ? 1 : 0,
        pickup ? pickupAddress.trim().slice(0, 255) : null,
        notes ? String(notes).slice(0, 500) : null,
      ]
    );
    return NextResponse.json({ ok: true, id: result.insertId, bookingCode: code });
  } catch (err) {
    return NextResponse.json({ error: "Could not book that visit.", detail: err.message }, { status: 503 });
  }
}
