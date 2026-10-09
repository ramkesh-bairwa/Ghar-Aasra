import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import {
  getSellerAccount, getCommissionRates, getChargeSummary, validateSellerProfile, cleanCommissionOverrides, saveSellerProfile,
} from "@/lib/sellers";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// One seller: profile, KYC, commission rates, listings and charges summary.
export async function GET(request, { params }) {
  if (!requireAdminForSection("sellers")) return forbidden();
  const id = Number(params.id);
  try {
    const account = await getSellerAccount(id);
    if (!account || account.seller_status === "none") return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    const [rates, summary, listings] = await Promise.all([
      getCommissionRates(id, account),
      getChargeSummary(id),
      query(
        `SELECT id, title, slug, status, listing_type, price, carpet_area_sqm, built_up_area_sqm, created_at
         FROM properties WHERE owner_user_id = ? ORDER BY created_at DESC`,
        [id]
      ),
    ]);
    return NextResponse.json({ account, rates, summary, listings });
  } catch (err) {
    return NextResponse.json({ error: "Could not load this seller.", detail: err.message }, { status: 503 });
  }
}

// { action: "approve" | "reject" (reason) | "suspend" | "reactivate" | "update" (profile + commission fields) }
export async function PUT(request, { params }) {
  if (!requireAdminForSection("sellers")) return forbidden();
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const account = await getSellerAccount(id);
  if (!account || account.seller_status === "none") return NextResponse.json({ error: "Seller not found." }, { status: 404 });

  try {
    switch (body.action) {
      case "approve":
      case "reactivate":
        await query(
          "UPDATE users SET seller_status = 'approved', seller_approved_at = COALESCE(seller_approved_at, NOW()), seller_rejection_reason = NULL WHERE id = ?",
          [id]
        );
        break;
      case "reject": {
        const reason = String(body.reason || "").trim();
        if (reason.length < 5) {
          return NextResponse.json({ error: "Tell the seller why, so they can fix it.", fieldErrors: { reason: "Write a short reason (at least 5 characters). The seller sees this." } }, { status: 400 });
        }
        await query("UPDATE users SET seller_status = 'rejected', seller_rejection_reason = ? WHERE id = ?", [reason.slice(0, 500), id]);
        break;
      }
      case "suspend":
        // Their live listings are hidden by moving them to draft.
        await query("UPDATE users SET seller_status = 'suspended' WHERE id = ?", [id]);
        if (body.hideListings) await query("UPDATE properties SET status = 'draft' WHERE owner_user_id = ? AND status = 'published'", [id]);
        break;
      case "update": {
        const profile = validateSellerProfile(body, { requireKyc: false });
        const overrides = cleanCommissionOverrides(body);
        const e = { ...profile.fieldErrors, ...overrides.fieldErrors };
        if (Object.keys(e).length) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: e }, { status: 400 });
        await saveSellerProfile(id, { ...profile.row, ...overrides.row, admin_notes: String(body.admin_notes || "").trim().slice(0, 1000) || null });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Could not update this seller.", detail: err.message }, { status: 503 });
  }
}
