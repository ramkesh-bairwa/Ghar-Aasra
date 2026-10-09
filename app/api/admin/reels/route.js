import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { validateReel } from "@/lib/reels";

export const dynamic = "force-dynamic";
const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

export async function GET(request) {
  if (!requireAdminForSection("reels")) return forbidden();
  const status = new URL(request.url).searchParams.get("status");
  const valid = ["pending", "approved", "rejected"].includes(status);
  try {
    const rows = await query(
      `SELECT r.*, p.title AS property_title, p.slug AS property_slug, u.name AS uploader_name
       FROM reels r LEFT JOIN properties p ON p.id = r.property_id LEFT JOIN users u ON u.id = r.uploader_user_id
       ${valid ? "WHERE r.status = ?" : ""}
       ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.featured DESC, r.sort_order, r.created_at DESC`,
      valid ? [status] : []
    );
    const [counts] = await query(
      "SELECT SUM(status = 'pending') AS pending, SUM(status = 'approved') AS approved, SUM(status = 'rejected') AS rejected, COALESCE(SUM(views), 0) AS views, COALESCE(SUM(likes), 0) AS likes FROM reels"
    );
    return NextResponse.json({ rows, counts: Object.fromEntries(Object.entries(counts || {}).map(([k, v]) => [k, Number(v || 0)])) });
  } catch (err) {
    return NextResponse.json({ error: "Could not load reels.", detail: err.message }, { status: 503 });
  }
}

// Admin uploads are published straight away.
export async function POST(request) {
  if (!requireAdminForSection("reels")) return forbidden();
  const body = await request.json().catch(() => ({}));
  const result = validateReel(body);
  if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
  const r = await query(
    "INSERT INTO reels (property_id, title, video_url, poster_url, status, featured, sort_order) VALUES (?, ?, ?, ?, 'approved', ?, ?)",
    [result.row.property_id, result.row.title, result.row.video_url, result.row.poster_url, body.featured ? 1 : 0, Number(body.sort_order) || 0]
  );
  return NextResponse.json({ ok: true, id: r.insertId });
}
