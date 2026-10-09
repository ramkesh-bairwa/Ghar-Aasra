import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { hashPassword } from "@/lib/auth";
import { validateSellerProfile, cleanCommissionOverrides, saveSellerProfile } from "@/lib/sellers";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "approved", "rejected", "suspended"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// Every seller account (anyone who applied or was added by an admin), with
// their listing count and what they owe.
export async function GET(request) {
  if (!requireAdminForSection("sellers")) return forbidden();
  const status = new URL(request.url).searchParams.get("status");
  const where = STATUSES.includes(status) ? "u.seller_status = ?" : "u.seller_status != 'none'";
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.seller_status, u.seller_created_by_admin, u.seller_approved_at,
         u.seller_rejection_reason, u.created_at, sp.seller_type, sp.business_name, sp.city, sp.contact_phone,
         sp.applied_at,
         (SELECT COUNT(*) FROM properties p WHERE p.owner_user_id = u.id) AS listings,
         (SELECT COALESCE(SUM(amount), 0) FROM seller_charges c WHERE c.seller_user_id = u.id AND c.status = 'unpaid') AS due,
         (SELECT COALESCE(SUM(amount), 0) FROM seller_charges c WHERE c.seller_user_id = u.id AND c.status = 'submitted') AS submitted
       FROM users u LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'buyer' AND ${where}
       ORDER BY FIELD(u.seller_status, 'pending', 'approved', 'suspended', 'rejected'), COALESCE(sp.applied_at, u.created_at) DESC`,
      STATUSES.includes(status) ? [status] : []
    );
    const [counts] = await query(
      `SELECT SUM(seller_status = 'pending') AS pending, SUM(seller_status = 'approved') AS approved,
         SUM(seller_status = 'rejected') AS rejected, SUM(seller_status = 'suspended') AS suspended
       FROM users WHERE role = 'buyer'`
    );
    return NextResponse.json({ rows, counts: Object.fromEntries(Object.entries(counts || {}).map(([k, v]) => [k, Number(v || 0)])) });
  } catch (err) {
    return NextResponse.json({ error: "Could not load sellers.", detail: err.message }, { status: 503 });
  }
}

// Admin adds a seller. Admin-created sellers are approved immediately. If an
// account with that email/phone already exists, it's turned into a seller.
export async function POST(request) {
  if (!requireAdminForSection("sellers")) return forbidden();
  const body = await request.json().catch(() => ({}));

  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160) || null;
  const phone = String(body.phone || "").trim().slice(0, 30) || null;
  const password = String(body.password || "");

  const e = {};
  if (!name) e.name = "Enter the seller's name.";
  if (!email && !phone) e.email = "Enter an email or a phone number so the seller can sign in.";
  if (email && !EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
  if (phone && !PHONE_RE.test(phone)) e.phone = "Enter a valid phone number.";

  const profile = validateSellerProfile(body, { requireKyc: false });
  const overrides = cleanCommissionOverrides(body);
  Object.assign(e, profile.fieldErrors, overrides.fieldErrors);

  let existing = null;
  if (!Object.keys(e).length) {
    const found = await query(
      `SELECT id, role FROM users WHERE ${[email && "email = ?", phone && "phone = ?"].filter(Boolean).join(" OR ")} LIMIT 1`,
      [email, phone].filter(Boolean)
    );
    existing = found[0] || null;
    if (existing && existing.role !== "buyer") e.email = "That email or phone belongs to a staff account. Use a different one.";
    // Email sign-in uses a password; phone-only sellers sign in with an OTP.
    if (!existing && email && password.length < 6) e.password = "Set a password of at least 6 characters. Share it with the seller so they can sign in.";
  }
  if (Object.keys(e).length) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: e }, { status: 400 });

  try {
    let userId = existing?.id;
    if (!userId) {
      const result = await query(
        `INSERT INTO users (name, email, phone, password_hash, role, seller_status, seller_created_by_admin, seller_approved_at)
         VALUES (?, ?, ?, ?, 'buyer', 'approved', 1, NOW())`,
        [name, email, phone, await hashPassword(password || Math.random().toString(36) + Date.now())]
      );
      userId = result.insertId;
    } else {
      await query(
        `UPDATE users SET seller_status = 'approved', seller_created_by_admin = 1, seller_approved_at = NOW(), seller_rejection_reason = NULL
         WHERE id = ?`,
        [userId]
      );
    }
    await saveSellerProfile(userId, { ...profile.row, ...overrides.row, admin_notes: String(body.admin_notes || "").trim().slice(0, 1000) || null });
    return NextResponse.json({ ok: true, id: userId, converted: !!existing });
  } catch (err) {
    const dup = err.code === "ER_DUP_ENTRY";
    return NextResponse.json(
      { error: dup ? "An account with that email already exists." : "Could not create the seller.", fieldErrors: dup ? { email: "An account with that email already exists." } : undefined, detail: err.message },
      { status: 400 }
    );
  }
}
