import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, requireAdminForSection } from "@/lib/adminGuard";
import { CHARGE_TYPES, CHARGE_STATUSES, getCommissionRates, dealAmount } from "@/lib/sellers";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// All seller charges with filters, plus totals by status.
export async function GET(request) {
  if (!requireAdminForSection("commissions")) return forbidden();
  const sp = new URL(request.url).searchParams;
  const where = [];
  const values = [];
  if (CHARGE_STATUSES.includes(sp.get("status"))) { where.push("c.status = ?"); values.push(sp.get("status")); }
  if (CHARGE_TYPES.includes(sp.get("type"))) { where.push("c.charge_type = ?"); values.push(sp.get("type")); }
  if (Number(sp.get("seller")) > 0) { where.push("c.seller_user_id = ?"); values.push(Number(sp.get("seller"))); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  try {
    const rows = await query(
      `SELECT c.*, u.name AS seller_name, u.email AS seller_email, u.phone AS seller_phone, sp.business_name,
         p.title AS property_title, p.slug AS property_slug
       FROM seller_charges c
       JOIN users u ON u.id = c.seller_user_id
       LEFT JOIN seller_profiles sp ON sp.user_id = c.seller_user_id
       LEFT JOIN properties p ON p.id = c.property_id
       ${whereSql}
       ORDER BY FIELD(c.status, 'submitted', 'unpaid', 'paid', 'waived'), c.created_at DESC
       LIMIT 1000`,
      values
    );
    const totals = await query(
      `SELECT c.status, COUNT(*) AS n, COALESCE(SUM(c.amount), 0) AS total FROM seller_charges c ${whereSql} GROUP BY c.status`,
      values
    );
    const sellers = await query(
      `SELECT u.id, u.name, sp.business_name FROM users u LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE u.seller_status IN ('approved', 'suspended') ORDER BY u.name`
    );
    return NextResponse.json({
      rows,
      totals: Object.fromEntries(totals.map((t) => [t.status, { count: Number(t.n), total: Number(t.total) }])),
      sellers,
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not load commissions.", detail: err.message }, { status: 503 });
  }
}

// Admin adds a charge by hand. For a deal, leave the amount blank to work it
// out from the deal value and the seller's commission rate.
export async function POST(request) {
  if (!requireAdminForSection("commissions")) return forbidden();
  const admin = requireAdmin();
  const body = await request.json().catch(() => ({}));

  const sellerId = Number(body.seller_user_id);
  const propertyId = Number(body.property_id) || null;
  const type = CHARGE_TYPES.includes(body.charge_type) ? body.charge_type : null;
  const description = String(body.description || "").trim().slice(0, 255);
  const dealValue = body.deal_value === "" || body.deal_value == null ? null : Number(body.deal_value);
  let amount = body.amount === "" || body.amount == null ? null : Number(body.amount);

  const e = {};
  if (!(sellerId > 0)) e.seller_user_id = "Choose the seller.";
  if (!type) e.charge_type = "Choose what this charge is for.";
  if (dealValue !== null && !(Number.isFinite(dealValue) && dealValue >= 0)) e.deal_value = "Enter the deal value as a number.";
  if (amount !== null && !(Number.isFinite(amount) && amount > 0)) e.amount = "Enter an amount greater than 0.";
  if (!e.seller_user_id && propertyId) {
    const [p] = await query("SELECT id FROM properties WHERE id = ? AND owner_user_id = ? LIMIT 1", [propertyId, sellerId]);
    if (!p) e.property_id = "That listing doesn't belong to this seller.";
  }
  if (!Object.keys(e).length && amount === null) {
    if (type === "deal" && dealValue > 0) amount = dealAmount(await getCommissionRates(sellerId), dealValue);
    if (!(amount > 0)) e.amount = type === "deal" ? "Enter a deal value (or the amount directly). The seller's deal rate is 0." : "Enter the amount to charge.";
  }
  if (Object.keys(e).length) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: e }, { status: 400 });

  const fallback = { visit: "Site visit", lead: "Buyer lead", deal: "Deal closed", other: "Commission" }[type];
  try {
    const result = await query(
      `INSERT INTO seller_charges (seller_user_id, property_id, charge_type, description, deal_value, amount, created_by_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, propertyId, type, description || fallback, dealValue, Math.round(amount * 100) / 100, admin?.id || null]
    );
    return NextResponse.json({ ok: true, id: result.insertId, amount });
  } catch (err) {
    return NextResponse.json({ error: "Could not add the charge.", detail: err.message }, { status: 503 });
  }
}
