import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { validateLocality } from "@/lib/localities";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

export async function PUT(request, { params }) {
  if (!requireAdminForSection("localities")) return forbidden();
  const body = await request.json().catch(() => ({}));
  if (Object.keys(body).length === 1 && "is_published" in body) {
    await query("UPDATE localities SET is_published = ? WHERE id = ?", [body.is_published ? 1 : 0, Number(params.id)]);
    return NextResponse.json({ ok: true });
  }
  const result = validateLocality(body);
  if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
  try {
    const cols = Object.keys(result.row);
    await query(`UPDATE localities SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [...cols.map((c) => result.row[c]), Number(params.id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const dup = err.code === "ER_DUP_ENTRY";
    return NextResponse.json({ error: dup ? "This locality already exists in that city." : "Could not save.", fieldErrors: dup ? { name: "Already exists in that city." } : undefined }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdminForSection("localities")) return forbidden();
  await query("DELETE FROM localities WHERE id = ?", [Number(params.id)]);
  return NextResponse.json({ ok: true });
}
