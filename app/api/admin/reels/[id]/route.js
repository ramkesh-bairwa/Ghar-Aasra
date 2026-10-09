import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { validateReel } from "@/lib/reels";

const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

// { action: "approve" | "reject" (reason) | "feature" (featured) | "update" (title, property_id, video_url, poster_url, sort_order) }
export async function PUT(request, { params }) {
  if (!requireAdminForSection("reels")) return forbidden();
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  switch (body.action) {
    case "approve":
      await query("UPDATE reels SET status = 'approved', rejection_reason = NULL WHERE id = ?", [id]);
      break;
    case "reject": {
      const reason = String(body.reason || "").trim();
      if (reason.length < 5) return NextResponse.json({ error: "Tell the seller why.", fieldErrors: { reason: "Write a short reason (the seller sees it)." } }, { status: 400 });
      await query("UPDATE reels SET status = 'rejected', rejection_reason = ?, featured = 0 WHERE id = ?", [reason.slice(0, 300), id]);
      break;
    }
    case "feature":
      await query("UPDATE reels SET featured = ? WHERE id = ?", [body.featured ? 1 : 0, id]);
      break;
    case "update": {
      const result = validateReel(body);
      if (result.fieldErrors) return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors }, { status: 400 });
      await query(
        "UPDATE reels SET title = ?, property_id = ?, video_url = ?, poster_url = ?, sort_order = ? WHERE id = ?",
        [result.row.title, result.row.property_id, result.row.video_url, result.row.poster_url, Number(body.sort_order) || 0, id]
      );
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!requireAdminForSection("reels")) return forbidden();
  await query("DELETE FROM reels WHERE id = ?", [Number(params.id)]);
  return NextResponse.json({ ok: true });
}
