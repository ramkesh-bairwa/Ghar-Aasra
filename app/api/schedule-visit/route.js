import { NextResponse } from "next/server";
import { requireUser } from "@/lib/userGuard";
import { insertWithBookingCode } from "@/lib/bookingCode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public lead-capture endpoint — login is optional. Distinct from
// POST /api/bookings (a signed-in buyer confirming a visit on one specific
// property): this is the lower-friction "get in touch to arrange a viewing"
// form, optionally tied to a property, surfaced to staff in the admin panel
// under Schedule Requests. When the submitter happens to be signed in, the
// request is also linked to their account (user_id) so GET
// /api/schedule-visit/mine can show it back to them under My Bookings.
export async function POST(request) {
  const { name, email, phone, propertyId, preferredDate, preferredTime, message } = await request.json();

  if (!name?.trim() || !EMAIL_RE.test(email || "")) {
    return NextResponse.json({ error: "A name and valid email are required." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate || "") || !/^\d{2}:\d{2}$/.test(preferredTime || "")) {
    return NextResponse.json({ error: "Pick a preferred date and time." }, { status: 400 });
  }

  const session = requireUser();

  try {
    const { result, code } = await insertWithBookingCode(
      "VR",
      `INSERT INTO visit_requests (booking_code, user_id, name, email, phone, property_id, preferred_date, preferred_time, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      [session?.id || null, name.trim(), email.trim(), phone || null, propertyId ? Number(propertyId) : null, preferredDate, preferredTime, message || null]
    );
    return NextResponse.json({ ok: true, id: result.insertId, bookingCode: code });
  } catch (err) {
    return NextResponse.json({ error: "Could not submit your request.", detail: err.message }, { status: 503 });
  }
}
