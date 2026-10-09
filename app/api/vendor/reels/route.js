import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { getAllSiteSettings } from "@/lib/queries";
import { checkApprovedSeller } from "@/lib/sellers";
import { validateReel } from "@/lib/reels";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const reels = await query(
    `SELECT r.id, r.title, r.video_url, r.poster_url, r.status, r.rejection_reason, r.views, r.likes, r.created_at, p.title AS property_title
     FROM reels r LEFT JOIN properties p ON p.id = r.property_id WHERE r.uploader_user_id = ? ORDER BY r.created_at DESC`,
    [user.id]
  );
  const settings = await getAllSiteSettings();
  return NextResponse.json({ reels, uploadsEnabled: settings.reels_enabled !== "false" && settings.reels_seller_upload !== "false", autoApprove: settings.reels_auto_approve === "true" });
}

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const seller = await checkApprovedSeller(user.id);
  if (!seller.account) return NextResponse.json({ error: seller.message }, { status: 403 });
  const settings = await getAllSiteSettings();
  if (settings.reels_enabled === "false" || settings.reels_seller_upload === "false") {
    return NextResponse.json({ error: "Reel uploads are switched off right now." }, { status: 403 });
  }

  const result = validateReel(await request.json().catch(() => ({})));
  if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
  if (!result.row.property_id) {
    return NextResponse.json({ error: "Choose which listing this reel is for.", fieldErrors: { property_id: "Choose which listing this reel is for." } }, { status: 400 });
  }
  const [own] = await query("SELECT id FROM properties WHERE id = ? AND owner_user_id = ? LIMIT 1", [result.row.property_id, user.id]);
  if (!own) return NextResponse.json({ error: "That listing isn't yours.", fieldErrors: { property_id: "Choose one of your own listings." } }, { status: 400 });

  const status = settings.reels_auto_approve === "true" ? "approved" : "pending";
  const r = await query(
    "INSERT INTO reels (property_id, uploader_user_id, title, video_url, poster_url, status) VALUES (?, ?, ?, ?, ?, ?)",
    [result.row.property_id, user.id, result.row.title, result.row.video_url, result.row.poster_url, status]
  );
  return NextResponse.json({ ok: true, id: r.insertId, status });
}
