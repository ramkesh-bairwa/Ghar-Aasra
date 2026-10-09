import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { getChargeSummary, getCommissionRates } from "@/lib/sellers";

export const dynamic = "force-dynamic";

// The seller's commission charges, totals by status, and their current rates.
export async function GET() {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  try {
    const [charges, summary, rates] = await Promise.all([
      query(
        `SELECT c.id, c.charge_type, c.description, c.deal_value, c.amount, c.status, c.payment_method,
           c.payment_reference, c.payment_note, c.submitted_at, c.paid_at, c.created_at,
           p.title AS property_title, p.slug AS property_slug
         FROM seller_charges c LEFT JOIN properties p ON p.id = c.property_id
         WHERE c.seller_user_id = ?
         ORDER BY FIELD(c.status, 'unpaid', 'submitted', 'paid', 'waived'), c.created_at DESC`,
        [user.id]
      ),
      getChargeSummary(user.id),
      getCommissionRates(user.id),
    ]);
    return NextResponse.json({ charges, summary, rates });
  } catch (err) {
    return NextResponse.json({ error: "Could not load your payments.", detail: err.message }, { status: 503 });
  }
}
