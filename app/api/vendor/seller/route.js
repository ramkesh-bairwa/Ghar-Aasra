import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { getSellerAccount, validateSellerProfile, saveSellerProfile, getCommissionRates, SELLER_BLOCK_MESSAGES } from "@/lib/sellers";

export const dynamic = "force-dynamic";

const PUBLIC_PROFILE = [
  "seller_type", "business_name", "contact_phone", "contact_email", "address", "city",
  "pan_number", "gst_number", "rera_number", "id_proof_url", "about",
];

// The signed-in user's seller account: approval status, their application
// details and the commission rates that apply to them.
export async function GET() {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  try {
    const account = await getSellerAccount(user.id);
    if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    const status = account.seller_status || "none";
    const rates = status === "approved" ? await getCommissionRates(user.id, account) : null;
    return NextResponse.json({
      status,
      message: status === "approved" ? null : SELLER_BLOCK_MESSAGES[status],
      rejectionReason: status === "rejected" ? account.seller_rejection_reason : null,
      createdByAdmin: !!account.seller_created_by_admin,
      approvedAt: account.seller_approved_at,
      profile: Object.fromEntries(PUBLIC_PROFILE.map((k) => [k, account[k] ?? ""])),
      user: { name: account.name, email: account.email, phone: account.phone },
      rates,
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not load your seller account.", detail: err.message }, { status: 503 });
  }
}

// Seller application (or an approved seller updating their details).
// New and rejected applicants go to "pending" for admin approval.
export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const account = await getSellerAccount(user.id);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (account.seller_status === "suspended") {
    return NextResponse.json({ error: SELLER_BLOCK_MESSAGES.suspended }, { status: 403 });
  }

  const approved = account.seller_status === "approved";
  const result = validateSellerProfile(
    { ...body, accept_terms: approved ? true : !!body.accept_terms },
    { requireKyc: true }
  );
  if (result.fieldErrors) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
  }

  try {
    await saveSellerProfile(user.id, approved ? result.row : { ...result.row, applied_at: new Date() });
    if (!approved) {
      await query(
        "UPDATE users SET seller_status = 'pending', seller_rejection_reason = NULL WHERE id = ?",
        [user.id]
      );
    }
    return NextResponse.json({ ok: true, status: approved ? "approved" : "pending" });
  } catch (err) {
    return NextResponse.json({ error: "Could not save your application. Please try again.", detail: err.message }, { status: 503 });
  }
}
