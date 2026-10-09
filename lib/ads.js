// Ads & video banners managed under Admin → Ads & Banners. Shared by the
// public slots (AdSlot, popup, announcement bar) and the admin API.

import { query } from "./db";

import { AD_PLACEMENTS, AD_PLACEMENT_KEYS } from "./adPlacements";

export { AD_PLACEMENTS, AD_PLACEMENT_KEYS };

export const AD_COLUMNS =
  "id, title, placement, media_type, image_url, mobile_image_url, video_url, headline, subtext, cta_label, link_url, open_new_tab, target_listing_type, target_city";

// Only http(s) links or site-relative paths — never javascript: URLs.
export function safeAdLink(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  if (/^https?:\/\/\S+$/i.test(v) || /^\/(?!\/)\S*$/.test(v)) return v.slice(0, 500);
  return undefined;
}

export function safeMediaUrl(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  return /^https?:\/\/\S+$/i.test(v) || /^\/uploads\/[\w./-]+$/.test(v) ? v.slice(0, 500) : undefined;
}

// Live banners for a placement, filtered by the page's listing type / city.
export async function getActiveAds(placement, { listingType = null, city = null, limit = 6 } = {}) {
  if (!AD_PLACEMENT_KEYS.includes(placement)) return [];
  try {
    const { getAllSiteSettings } = await import("./queries");
    if ((await getAllSiteSettings()).ads_enabled === "false") return [];
    return await query(
      `SELECT ${AD_COLUMNS} FROM ad_banners
       WHERE placement = ? AND is_active = 1
         AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())
         AND (target_listing_type IS NULL OR target_listing_type = ?)
         AND (target_city IS NULL OR target_city = '' OR target_city = ?)
       ORDER BY sort_order ASC, id DESC
       LIMIT ${Number(limit) || 6}`,
      [placement, listingType || "", city || ""]
    );
  } catch {
    return [];
  }
}

// Validates the admin form → { fieldErrors } | { row }.
export function validateAd(body) {
  const e = {};
  const str = (k, max) => String(body[k] ?? "").trim().slice(0, max) || null;
  const placement = AD_PLACEMENT_KEYS.includes(body.placement) ? body.placement : null;
  const textOnly = AD_PLACEMENTS.find((p) => p.key === placement)?.textOnly;
  const media_type = textOnly ? "text" : ["image", "video", "text"].includes(body.media_type) ? body.media_type : "image";
  const row = {
    title: str("title", 160),
    placement,
    media_type,
    image_url: safeMediaUrl(body.image_url),
    mobile_image_url: safeMediaUrl(body.mobile_image_url),
    video_url: safeMediaUrl(body.video_url),
    headline: str("headline", 160),
    subtext: str("subtext", 300),
    cta_label: str("cta_label", 60),
    link_url: safeAdLink(body.link_url),
    open_new_tab: body.open_new_tab ? 1 : 0,
    target_listing_type: ["sale", "rent", "commercial"].includes(body.target_listing_type) ? body.target_listing_type : null,
    target_city: str("target_city", 120),
    sort_order: Number.isFinite(Number(body.sort_order)) ? Math.round(Number(body.sort_order)) : 0,
    is_active: body.is_active === false || body.is_active === 0 || body.is_active === "0" ? 0 : 1,
    starts_at: body.starts_at ? String(body.starts_at).replace("T", " ").slice(0, 19) : null,
    ends_at: body.ends_at ? String(body.ends_at).replace("T", " ").slice(0, 19) : null,
  };

  if (!row.title) e.title = "Give the banner a name so you can find it later (only admins see it).";
  if (!placement) e.placement = "Choose where the banner should appear.";
  for (const k of ["image_url", "mobile_image_url", "video_url"]) {
    if (row[k] === undefined) e[k] = "Upload the file again or paste a full https:// link.";
  }
  if (row.link_url === undefined) e.link_url = "Enter a full link (https://…) or a page on this site starting with /.";
  if (media_type === "image" && !row.image_url && !e.image_url) e.image_url = "Upload the banner image.";
  if (media_type === "video" && !row.video_url && !e.video_url) e.video_url = "Upload the banner video (MP4 works best).";
  if (media_type === "text" && !row.headline) e.headline = "Write the text to show.";
  if (row.cta_label && !row.link_url && !e.link_url) e.link_url = "A button needs a link. Add one, or remove the button text.";
  if (row.starts_at && row.ends_at && row.ends_at <= row.starts_at) e.ends_at = "The end date must be after the start date.";
  return Object.keys(e).length ? { fieldErrors: e } : { row };
}
