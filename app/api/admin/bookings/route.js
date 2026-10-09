import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForResource } from "@/lib/adminGuard";

// Every visit booked through a property page's scheduler — signed-in buyers
// (user_id) and guests (guest_*) alike, flattened into one customer_* shape.
export async function GET() {
  if (!requireAdminForResource("bookings")) {
    return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  }
  try {
    const rows = await query(
      `SELECT b.id, b.booking_code, b.property_id, b.scheduled_at, b.visit_type, b.pickup_required, b.pickup_address,
              b.notes, b.admin_notes, b.status, b.approved_at, b.created_at,
              p.owner_user_id IS NOT NULL AS has_seller, o.name AS seller_name,
              COALESCE(u.name, b.guest_name) AS customer_name,
              COALESCE(b.guest_phone, u.phone) AS customer_phone,
              COALESCE(u.email, b.guest_email) AS customer_email,
              b.user_id IS NULL AS is_guest,
              p.title AS property_title, p.slug AS property_slug, p.address AS property_address, p.cover_image_url AS property_image
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       LEFT JOIN users u ON u.id = b.user_id
       LEFT JOIN users o ON o.id = p.owner_user_id
       ORDER BY b.scheduled_at DESC`
    );
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: "Could not reach MySQL.", detail: err.message }, { status: 503 });
  }
}
