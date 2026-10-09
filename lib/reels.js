// Property reels: short vertical video tours. Approved reels show on /reels
// and the homepage strip; seller uploads wait for admin review unless
// "Publish seller reels without review" is on.

import { query } from "./db";

const safeUpload = (v) => {
  const s = String(v || "").trim();
  if (!s) return null;
  return /^\/uploads\/[\w./-]+$/.test(s) || /^https?:\/\/\S+$/i.test(s) ? s.slice(0, 500) : undefined;
};

export function validateReel(body) {
  const e = {};
  const row = {
    title: String(body.title || "").trim().slice(0, 160),
    video_url: safeUpload(body.video_url),
    poster_url: safeUpload(body.poster_url),
    property_id: Number(body.property_id) > 0 ? Number(body.property_id) : null,
  };
  if (!row.title) e.title = "Add a short title, e.g. \"Sunny 3 BHK walkthrough\".";
  else if (row.title.length < 5) e.title = "Make the title a little longer.";
  if (!row.video_url) e.video_url = row.video_url === undefined ? "Upload the video again." : "Upload a video (MP4, vertical works best, up to 100 MB).";
  if (row.poster_url === undefined) e.poster_url = "Upload the cover image again.";
  return Object.keys(e).length ? { fieldErrors: e } : { row };
}

export async function listPublicReels({ limit = 30, userId = null, startId = null } = {}) {
  try {
    const rows = await query(
      `SELECT r.id, r.title, r.video_url, r.poster_url, r.views, r.likes, r.featured,
         p.id AS property_id, p.slug AS property_slug, p.title AS property_title, p.price, p.price_period, p.listing_type,
         p.bedrooms, p.locality, l.city,
         ${userId ? "(SELECT COUNT(*) FROM reel_likes rl WHERE rl.reel_id = r.id AND rl.user_id = ?)" : "0"} AS liked
       FROM reels r
       LEFT JOIN properties p ON p.id = r.property_id
       LEFT JOIN locations l ON l.id = p.location_id
       WHERE r.status = 'approved' AND (r.property_id IS NULL OR p.status IN ('published', 'under_offer'))
       ORDER BY ${startId ? "r.id = ? DESC, " : ""}r.featured DESC, r.sort_order ASC, r.created_at DESC
       LIMIT ${Number(limit) || 30}`,
      [...(userId ? [userId] : []), ...(startId ? [Number(startId)] : [])]
    );
    return rows.map((r) => ({ ...r, liked: Number(r.liked) > 0 }));
  } catch {
    return [];
  }
}
