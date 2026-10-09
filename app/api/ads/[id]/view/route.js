import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// One impression, sent by the banner the first time it's on screen.
export async function POST(request, { params }) {
  try {
    await query("UPDATE ad_banners SET impressions = impressions + 1 WHERE id = ?", [Number(params.id)]);
  } catch {}
  return NextResponse.json({ ok: true });
}
