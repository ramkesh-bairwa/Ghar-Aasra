import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { PAYMENT_METHODS } from "@/lib/sellers";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// { action: "mark_paid" (method, reference, note) | "waive" | "reopen" | "update" (amount, description) }
export async function PUT(request, { params }) {
  if (!requireAdminForSection("commissions")) return forbidden();
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const [charge] = await query("SELECT id, status FROM seller_charges WHERE id = ? LIMIT 1", [id]);
  if (!charge) return NextResponse.json({ error: "Charge not found." }, { status: 404 });

  try {
    if (body.action === "mark_paid") {
      const method = PAYMENT_METHODS.includes(body.method) ? body.method : null;
      if (!method) return NextResponse.json({ error: "Choose how it was paid.", fieldErrors: { method: "Choose how it was paid." } }, { status: 400 });
      await query(
        `UPDATE seller_charges SET status = 'paid', paid_at = NOW(), payment_method = ?,
           payment_reference = COALESCE(NULLIF(?, ''), payment_reference), payment_note = COALESCE(NULLIF(?, ''), payment_note)
         WHERE id = ?`,
        [method, String(body.reference || "").trim().slice(0, 120), String(body.note || "").trim().slice(0, 500), id]
      );
    } else if (body.action === "waive") {
      await query("UPDATE seller_charges SET status = 'waived', paid_at = NULL WHERE id = ?", [id]);
    } else if (body.action === "reopen") {
      // Back to unpaid, e.g. when a submitted reference couldn't be verified.
      await query(
        `UPDATE seller_charges SET status = 'unpaid', paid_at = NULL, submitted_at = NULL,
           payment_note = COALESCE(NULLIF(?, ''), payment_note) WHERE id = ?`,
        [String(body.note || "").trim().slice(0, 500), id]
      );
    } else if (body.action === "update") {
      const amount = Number(body.amount);
      const e = {};
      if (!(Number.isFinite(amount) && amount > 0)) e.amount = "Enter an amount greater than 0.";
      const description = String(body.description || "").trim();
      if (!description) e.description = "Add a short description.";
      if (Object.keys(e).length) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: e }, { status: 400 });
      await query("UPDATE seller_charges SET amount = ?, description = ? WHERE id = ?", [Math.round(amount * 100) / 100, description.slice(0, 255), id]);
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Could not update the charge.", detail: err.message }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdminForSection("commissions")) return forbidden();
  try {
    await query("DELETE FROM seller_charges WHERE id = ? AND status != 'paid'", [Number(params.id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Could not delete the charge.", detail: err.message }, { status: 503 });
  }
}
