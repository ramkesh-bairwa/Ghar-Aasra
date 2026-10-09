// Saved searches, price watches and the alerts they produce.
//
// There's no background job: alerts are generated when the user checks in
// (the notification bell polls every minute, and /alerts loads). For each
// saved search we look for listings published since it was last checked; for
// each price watch we compare the current price with the last one we alerted.

import { query } from "./db";
import { getAllSiteSettings } from "./queries";

export const SEARCH_FILTER_KEYS = ["listingType", "city", "locality", "propertyType", "minPrice", "maxPrice", "minBedrooms", "furnishing"];
const LISTING_TYPES = ["sale", "rent", "commercial"];
const PROPERTY_TYPES = ["apartment", "villa", "house", "land", "commercial", "office"];
const FURNISHING = ["furnished", "semi_furnished", "unfurnished"];

// Keeps only known filters with sane values.
export function cleanFilters(input = {}) {
  const out = {};
  const str = (v, max = 120) => String(v ?? "").trim().slice(0, max);
  const num = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v));
  if (LISTING_TYPES.includes(input.listingType)) out.listingType = input.listingType;
  if (PROPERTY_TYPES.includes(String(input.propertyType || "").toLowerCase())) out.propertyType = String(input.propertyType).toLowerCase();
  if (FURNISHING.includes(input.furnishing)) out.furnishing = input.furnishing;
  if (str(input.city)) out.city = str(input.city);
  if (str(input.locality)) out.locality = str(input.locality);
  if (num(input.minPrice) !== null) out.minPrice = num(input.minPrice);
  if (num(input.maxPrice) !== null) out.maxPrice = num(input.maxPrice);
  if (num(input.minBedrooms) !== null) out.minBedrooms = Math.round(num(input.minBedrooms));
  return out;
}

export function parseFilters(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

// SQL for "public listings matching these filters".
function matchWhere(f) {
  const where = ["p.status IN ('published', 'under_offer')"];
  const params = [];
  if (f.listingType) { where.push("p.listing_type = ?"); params.push(f.listingType); }
  if (f.propertyType) { where.push("p.property_type = ?"); params.push(f.propertyType); }
  if (f.furnishing) { where.push("p.furnishing = ?"); params.push(f.furnishing); }
  if (f.city) { where.push("(l.city LIKE ? OR p.address LIKE ?)"); params.push(`%${f.city}%`, `%${f.city}%`); }
  if (f.locality) { where.push("(p.locality LIKE ? OR p.address LIKE ?)"); params.push(`%${f.locality}%`, `%${f.locality}%`); }
  if (f.minPrice != null) { where.push("p.price >= ?"); params.push(f.minPrice); }
  if (f.maxPrice != null) { where.push("p.price <= ?"); params.push(f.maxPrice); }
  if (f.minBedrooms != null) { where.push("p.bedrooms >= ?"); params.push(f.minBedrooms); }
  return { where, params };
}

export async function countMatches(filters) {
  const { where, params } = matchWhere(filters);
  const [row] = await query(
    `SELECT COUNT(*) AS n FROM properties p LEFT JOIN locations l ON l.id = p.location_id WHERE ${where.join(" AND ")}`,
    params
  );
  return Number(row?.n || 0);
}

// Human summary, e.g. "2+ BHK apartment for rent in Jaipur, up to ₹25,000".
export function describeFilters(f, symbol = "₹") {
  const money = (n) => `${symbol}${Number(n).toLocaleString("en-IN")}`;
  const parts = [];
  parts.push(`${f.minBedrooms ? `${f.minBedrooms}+ BHK ` : ""}${f.propertyType || "property"}`);
  if (f.listingType) parts.push(f.listingType === "rent" ? "for rent" : f.listingType === "sale" ? "for sale" : "commercial");
  const where = [f.locality, f.city].filter(Boolean).join(", ");
  if (where) parts.push(`in ${where}`);
  let text = parts.join(" ");
  if (f.minPrice != null && f.maxPrice != null) text += `, ${money(f.minPrice)}–${money(f.maxPrice)}`;
  else if (f.maxPrice != null) text += `, up to ${money(f.maxPrice)}`;
  else if (f.minPrice != null) text += `, from ${money(f.minPrice)}`;
  if (f.furnishing) text += `, ${f.furnishing.replace(/_/g, "-")}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Throttle per user so the minute-by-minute bell poll stays cheap.
const lastRun = (globalThis.__alertsLastRun ||= new Map());

export async function refreshUserAlerts(userId, { force = false } = {}) {
  const now = Date.now();
  if (!force && now - (lastRun.get(userId) || 0) < 60_000) return;
  lastRun.set(userId, now);
  try {
    const settings = await getAllSiteSettings();
    if (settings.alerts_enabled === "false") return;

    // New listings for each saved search with alerts on.
    const searches = await query(
      "SELECT id, filters, COALESCE(last_checked_at, created_at) AS since FROM saved_searches WHERE user_id = ? AND alert_enabled = 1",
      [userId]
    );
    for (const s of searches) {
      const { where, params } = matchWhere(parseFilters(s.filters));
      const matches = await query(
        `SELECT p.id, p.price FROM properties p LEFT JOIN locations l ON l.id = p.location_id
         WHERE ${where.join(" AND ")} AND p.created_at > ? AND (p.owner_user_id IS NULL OR p.owner_user_id != ?)
         ORDER BY p.created_at DESC LIMIT 20`,
        [...params, s.since, userId]
      );
      if (matches.length) {
        await query(
          `INSERT IGNORE INTO user_alerts (user_id, kind, property_id, saved_search_id, new_price) VALUES ${matches.map(() => "(?, 'new_match', ?, ?, ?)").join(", ")}`,
          matches.flatMap((m) => [userId, m.id, s.id, m.price])
        );
      }
      await query("UPDATE saved_searches SET last_checked_at = NOW() WHERE id = ?", [s.id]);
    }

    // Price drops on watched listings.
    const drops = await query(
      `SELECT w.id, w.property_id, COALESCE(w.last_notified_price, w.price_at_watch) AS old_price, p.price AS new_price
       FROM price_watches w JOIN properties p ON p.id = w.property_id
       WHERE w.user_id = ? AND p.status IN ('published', 'under_offer') AND p.price > 0
         AND p.price < COALESCE(w.last_notified_price, w.price_at_watch)`,
      [userId]
    );
    for (const d of drops) {
      await query(
        "INSERT IGNORE INTO user_alerts (user_id, kind, property_id, old_price, new_price) VALUES (?, 'price_drop', ?, ?, ?)",
        [userId, d.property_id, d.old_price, d.new_price]
      );
      await query("UPDATE price_watches SET last_notified_price = ? WHERE id = ?", [d.new_price, d.id]);
    }
  } catch {
    // Tables not migrated yet, or a DB hiccup — alerts just wait for the next check.
  }
}
