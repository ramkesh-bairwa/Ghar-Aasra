import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { validateAd } from "@/lib/ads";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// Full edit, or { is_active } alone for the on/off switch, or { reset_stats: true }.
export async function PUT(request, { params }) {
  if (!requireAdminForSection("ads")) return forbidden();
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  try {
    if (Object.keys(body).length === 1 && "is_active" in body) {
      await query("UPDATE ad_banners SET is_active = ? WHERE id = ?", [body.is_active ? 1 : 0, id]);
      return NextResponse.json({ ok: true });
    }
    if (body.reset_stats) {
      await query("UPDATE ad_banners SET impressions = 0, clicks = 0 WHERE id = ?", [id]);
      return NextResponse.json({ ok: true });
    }
    const result = validateAd(body);
    if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
    const cols = Object.keys(result.row);
    await query(`UPDATE ad_banners SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [...cols.map((c) => result.row[c]), id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Could not save the banner.", detail: err.message }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdminForSection("ads")) return forbidden();
  await query("DELETE FROM ad_banners WHERE id = ?", [Number(params.id)]);
  return NextResponse.json({ ok: true });
}
