import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForResource } from "@/lib/adminGuard";
import { addAutoCharge } from "@/lib/sellers";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];
// Confirming a visit is the admin's approval: from then on the listing's
// seller sees it as a lead. Back to "pending" withdraws it from the seller;
// cancelling keeps approved_at, so a seller who already had it sees it cancelled.
const APPROVED = ["confirmed", "completed", "no_show"];

export async function PUT(request, { params }) {
  if (!requireAdminForResource("bookings")) {
    return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  }
  const { status, admin_notes } = await request.json();

  const sets = [];
  const values = [];
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    sets.push("status = ?");
    values.push(status);
    if (APPROVED.includes(status)) sets.push("approved_at = COALESCE(approved_at, NOW())");
    if (status === "pending") sets.push("approved_at = NULL");
  }
  if (admin_notes !== undefined) {
    sets.push("admin_notes = ?");
    values.push(admin_notes ? String(admin_notes).slice(0, 500) : null);
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  values.push(Number(params.id));

  try {
    await query(`UPDATE bookings SET ${sets.join(", ")} WHERE id = ?`, values);
    // A completed visit on a seller's listing adds their per-visit commission.
    if (status === "completed") {
      const [booking] = await query("SELECT property_id FROM bookings WHERE id = ? LIMIT 1", [Number(params.id)]);
      if (booking?.property_id) await addAutoCharge({ type: "visit", sourceType: "booking", sourceId: Number(params.id), propertyId: booking.property_id });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed.", detail: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdminForResource("bookings")) {
    return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  }
  try {
    await query("DELETE FROM bookings WHERE id = ?", [Number(params.id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed.", detail: err.message }, { status: 400 });
  }
}
