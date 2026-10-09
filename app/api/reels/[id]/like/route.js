import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

// Toggles the signed-in user's like.
export async function POST(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Sign in to like reels." }, { status: 401 });
  const id = Number(params.id);
  const existing = await query("SELECT 1 FROM reel_likes WHERE reel_id = ? AND user_id = ? LIMIT 1", [id, user.id]);
  if (existing.length) {
    await query("DELETE FROM reel_likes WHERE reel_id = ? AND user_id = ?", [id, user.id]);
  } else {
    await query("INSERT IGNORE INTO reel_likes (reel_id, user_id) VALUES (?, ?)", [id, user.id]);
  }
  await query("UPDATE reels SET likes = (SELECT COUNT(*) FROM reel_likes WHERE reel_id = ?) WHERE id = ?", [id, id]);
  const [r] = await query("SELECT likes FROM reels WHERE id = ?", [id]);
  return NextResponse.json({ liked: !existing.length, likes: Number(r?.likes || 0) });
}
