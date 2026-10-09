import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request, { params }) {
  try {
    await query("UPDATE reels SET views = views + 1 WHERE id = ? AND status = 'approved'", [Number(params.id)]);
  } catch {}
  return NextResponse.json({ ok: true });
}
