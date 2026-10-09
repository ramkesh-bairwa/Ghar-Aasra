import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

// { alert_enabled } and/or { name }
export async function PATCH(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const sets = [];
  const values = [];
  if ("alert_enabled" in body) { sets.push("alert_enabled = ?"); values.push(body.alert_enabled ? 1 : 0); }
  if ("name" in body) {
    const name = String(body.name || "").trim().slice(0, 120);
    if (!name) return NextResponse.json({ error: "The name can't be empty." }, { status: 400 });
    sets.push("name = ?");
    values.push(name);
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  // Turning alerts back on shouldn't flood the user with everything listed meanwhile.
  if (body.alert_enabled) sets.push("last_checked_at = NOW()");
  await query(`UPDATE saved_searches SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, [...values, Number(params.id), user.id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  await query("DELETE FROM saved_searches WHERE id = ? AND user_id = ?", [Number(params.id), user.id]);
  return NextResponse.json({ ok: true });
}
