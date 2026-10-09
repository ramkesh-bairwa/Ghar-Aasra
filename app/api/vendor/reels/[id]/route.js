import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

export async function DELETE(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  await query("DELETE FROM reels WHERE id = ? AND uploader_user_id = ?", [Number(params.id), user.id]);
  return NextResponse.json({ ok: true });
}
