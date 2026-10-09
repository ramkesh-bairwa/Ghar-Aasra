import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

// Lets a signed-in buyer manage their own upcoming visit from My Visits:
// { action: "cancel" } or { action: "reschedule", scheduledAt }. A
// rescheduled visit goes back to "pending" (and off the seller's dashboard)
// so staff re-confirm the new time.
export async function PATCH(request, { params }) {
  const session = requireUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { action, scheduledAt } = await request.json();

  try {
    const [booking] = await query(
      "SELECT id, property_id, status FROM bookings WHERE id = ? AND user_id = ? LIMIT 1",
      [Number(params.id), session.id]
    );
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (!["pending", "confirmed"].includes(booking.status)) {
      return NextResponse.json({ error: "This visit can no longer be changed." }, { status: 400 });
    }

    if (action === "cancel") {
      await query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking.id]);
      return NextResponse.json({ ok: true });
    }

    if (action === "reschedule") {
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(scheduledAt || "")) {
        return NextResponse.json({ error: "Pick a new date and time." }, { status: 400 });
      }
      if (new Date(scheduledAt.replace(" ", "T")).getTime() < Date.now()) {
        return NextResponse.json({ error: "Pick a valid upcoming date and time." }, { status: 400 });
      }
      const taken = await query(
        "SELECT id FROM bookings WHERE property_id = ? AND scheduled_at = ? AND status != 'cancelled' AND id != ? LIMIT 1",
        [booking.property_id, scheduledAt, booking.id]
      );
      if (taken.length) return NextResponse.json({ error: "That slot is taken — pick another time." }, { status: 409 });

      await query("UPDATE bookings SET scheduled_at = ?, status = 'pending', approved_at = NULL WHERE id = ?", [scheduledAt, booking.id]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Could not update the visit.", detail: err.message }, { status: 503 });
  }
}
