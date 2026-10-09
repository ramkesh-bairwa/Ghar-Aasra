import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { PAYMENT_METHODS } from "@/lib/sellers";

// Seller says "I've paid": records the payment reference on one or more
// unpaid charges and moves them to "submitted" for an admin to verify.
export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const method = String(body.method || "");
  const reference = String(body.reference || "").trim();
  const note = String(body.note || "").trim().slice(0, 500) || null;
  const proof = String(body.proof_url || "").trim();

  const e = {};
  if (!ids.length) e.ids = "Choose at least one charge to pay.";
  if (!PAYMENT_METHODS.includes(method)) e.method = "Choose how you paid.";
  if (!reference) e.reference = "Enter the transaction / UTR / cheque number so we can find your payment.";
  else if (reference.length < 4) e.reference = "That reference looks too short. Copy it exactly from your payment app or bank.";
  if (proof && !/^\/uploads\/[\w./-]+$/.test(proof)) e.proof_url = "Upload the payment screenshot again.";
  if (Object.keys(e).length) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: e }, { status: 400 });

  try {
    const result = await query(
      `UPDATE seller_charges
       SET status = 'submitted', payment_method = ?, payment_reference = ?, payment_note = ?, payment_proof_url = ?, submitted_at = NOW()
       WHERE seller_user_id = ? AND status = 'unpaid' AND id IN (${ids.map(() => "?").join(", ")})`,
      [method, reference.slice(0, 120), note, proof || null, user.id, ...ids]
    );
    if (!result.affectedRows) return NextResponse.json({ error: "These charges are already paid or under review." }, { status: 409 });
    return NextResponse.json({ ok: true, updated: result.affectedRows });
  } catch (err) {
    return NextResponse.json({ error: "Could not record your payment. Please try again.", detail: err.message }, { status: 503 });
  }
}
