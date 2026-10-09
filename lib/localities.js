// Locality guides + fair-price comparisons. Editorial content lives in the
// `localities` table (Admin → Localities); every number is computed live
// from public listings whose `locality` matches the guide's name in that city.

import { query } from "./db";
import { getAllSiteSettings } from "./queries";

const AREA_SQL = "COALESCE(NULLIF(p.built_up_area_sqm, 0), NULLIF(p.carpet_area_sqm, 0), NULLIF(p.area_sqm, 0))";
const PUBLIC_SQL = "p.status IN ('published', 'under_offer') AND p.price > 0";

export function slugifyLocality(name, city) {
  return `${name} ${city || ""}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

const lines = (text) => String(text || "").split("\n").map((s) => s.trim()).filter(Boolean);

function mapLocality(r) {
  return {
    id: r.id, name: r.name, slug: r.slug, city: r.city, locationId: r.location_id, locationSlug: r.location_slug,
    description: r.description, coverImage: r.cover_image_url, highlights: lines(r.highlights), nearby: lines(r.nearby),
    scores: { connectivity: r.connectivity_score, safety: r.safety_score, lifestyle: r.lifestyle_score },
    listings: Number(r.listings || 0), avgSaleRate: r.avg_sale_rate ? Number(r.avg_sale_rate) : null,
    avgRent: r.avg_rent ? Number(r.avg_rent) : null,
  };
}

const STATS_COLUMNS = `
  (SELECT COUNT(*) FROM properties p WHERE p.location_id = loc.location_id AND LOWER(TRIM(p.locality)) = LOWER(loc.name) AND ${PUBLIC_SQL}) AS listings,
  (SELECT AVG(p.price / ${AREA_SQL}) FROM properties p WHERE p.location_id = loc.location_id AND LOWER(TRIM(p.locality)) = LOWER(loc.name)
     AND ${PUBLIC_SQL} AND p.listing_type = 'sale' AND ${AREA_SQL} IS NOT NULL) AS avg_sale_rate,
  (SELECT AVG(p.price) FROM properties p WHERE p.location_id = loc.location_id AND LOWER(TRIM(p.locality)) = LOWER(loc.name)
     AND ${PUBLIC_SQL} AND p.listing_type = 'rent' AND p.price_period = 'monthly') AS avg_rent`;

export async function listPublicLocalities({ limit = 100 } = {}) {
  try {
    const rows = await query(
      `SELECT loc.*, l.city, l.slug AS location_slug, ${STATS_COLUMNS}
       FROM localities loc JOIN locations l ON l.id = loc.location_id
       WHERE loc.is_published = 1 ORDER BY loc.sort_order, l.city, loc.name LIMIT ${Number(limit) || 100}`
    );
    return rows.map(mapLocality);
  } catch {
    return [];
  }
}

export async function getLocalityBySlug(slug) {
  try {
    const [r] = await query(
      `SELECT loc.*, l.city, l.slug AS location_slug, ${STATS_COLUMNS}
       FROM localities loc JOIN locations l ON l.id = loc.location_id WHERE loc.slug = ? AND loc.is_published = 1 LIMIT 1`,
      [slug]
    );
    return r ? mapLocality(r) : null;
  } catch {
    return null;
  }
}

// Detailed numbers for a locality page: price ranges, rent, and a 12-month
// trend of average sale price per m² by the month listings were added.
export async function getLocalityStats(locationId, name) {
  const where = `p.location_id = ? AND LOWER(TRIM(p.locality)) = LOWER(?) AND ${PUBLIC_SQL}`;
  const [summary] = await query(
    `SELECT
       SUM(p.listing_type = 'sale') AS sale_count, SUM(p.listing_type = 'rent') AS rent_count,
       MIN(CASE WHEN p.listing_type = 'sale' THEN p.price END) AS min_sale, MAX(CASE WHEN p.listing_type = 'sale' THEN p.price END) AS max_sale,
       AVG(CASE WHEN p.listing_type = 'sale' THEN p.price / ${AREA_SQL} END) AS avg_sale_rate,
       AVG(CASE WHEN p.listing_type = 'rent' AND p.price_period = 'monthly' THEN p.price END) AS avg_rent,
       MIN(CASE WHEN p.listing_type = 'rent' AND p.price_period = 'monthly' THEN p.price END) AS min_rent,
       MAX(CASE WHEN p.listing_type = 'rent' AND p.price_period = 'monthly' THEN p.price END) AS max_rent
     FROM properties p WHERE ${where}`,
    [locationId, name]
  );
  const trend = await query(
    `SELECT DATE_FORMAT(p.created_at, '%Y-%m') AS month, AVG(p.price / ${AREA_SQL}) AS rate, COUNT(*) AS n
     FROM properties p WHERE ${where} AND p.listing_type = 'sale' AND ${AREA_SQL} IS NOT NULL
       AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month`,
    [locationId, name]
  );
  const [cityRow] = await query(
    `SELECT AVG(p.price / ${AREA_SQL}) AS rate FROM properties p WHERE p.location_id = ? AND ${PUBLIC_SQL} AND p.listing_type = 'sale' AND ${AREA_SQL} IS NOT NULL`,
    [locationId]
  );
  const n = (v) => (v == null ? null : Number(v));
  return {
    saleCount: Number(summary?.sale_count || 0), rentCount: Number(summary?.rent_count || 0),
    minSale: n(summary?.min_sale), maxSale: n(summary?.max_sale), avgSaleRate: n(summary?.avg_sale_rate),
    avgRent: n(summary?.avg_rent), minRent: n(summary?.min_rent), maxRent: n(summary?.max_rent),
    cityAvgSaleRate: n(cityRow?.rate),
    trend: trend.map((t) => ({ month: t.month, rate: Number(t.rate), n: Number(t.n) })),
  };
}

// Localities typed into listings that don't have a guide yet — offered to
// the admin as one-click suggestions.
export async function discoverLocalities() {
  return query(
    `SELECT p.location_id, l.city, TRIM(p.locality) AS name, COUNT(*) AS listings
     FROM properties p JOIN locations l ON l.id = p.location_id
     WHERE p.locality IS NOT NULL AND TRIM(p.locality) != ''
       AND NOT EXISTS (SELECT 1 FROM localities loc WHERE loc.location_id = p.location_id AND LOWER(loc.name) = LOWER(TRIM(p.locality)))
     GROUP BY p.location_id, l.city, TRIM(p.locality)
     ORDER BY listings DESC LIMIT 30`
  );
}

// ---------- Fair price meter ----------
// Compares this listing's price per m² with similar public listings: first
// in the same locality, falling back to the whole city. Returns null when
// switched off or there aren't enough comparables.
export async function getFairPrice(property) {
  try {
    const settings = await getAllSiteSettings();
    if (settings.fair_price_enabled === "false") return null;
    const minN = Math.max(2, Number(settings.fair_price_min_comparables) || 3);
    const area = property.builtUpAreaSqm || property.carpetAreaSqm || property.areaSqm;
    if (!property.locationId || !area || !property.priceValue) return null;

    const base = `p.location_id = ? AND p.listing_type = ? AND p.price_period = ? AND p.id != ? AND ${PUBLIC_SQL} AND ${AREA_SQL} IS NOT NULL`;
    const params = [property.locationId, property.listingType, property.pricePeriod, property.id];
    const scopes = [];
    if (property.locality) scopes.push({ scope: "locality", label: property.locality, sql: `${base} AND LOWER(TRIM(p.locality)) = LOWER(?)`, params: [...params, property.locality] });
    scopes.push({ scope: "city", label: property.city, sql: base, params });

    for (const s of scopes) {
      const [row] = await query(
        `SELECT AVG(p.price / ${AREA_SQL}) AS avg_rate, MIN(p.price / ${AREA_SQL}) AS min_rate, MAX(p.price / ${AREA_SQL}) AS max_rate, COUNT(*) AS n
         FROM properties p WHERE ${s.sql}`,
        s.params
      );
      const comparables = Number(row?.n || 0);
      const avgRate = Number(row?.avg_rate || 0);
      if (comparables < minN || !avgRate) continue;
      const rate = property.priceValue / area;
      const diffPercent = Math.round(((rate - avgRate) / avgRate) * 100);
      const verdict = diffPercent <= -10 ? "great" : diffPercent <= -3 ? "good" : diffPercent < 5 ? "fair" : diffPercent < 15 ? "above" : "premium";
      let localitySlug = null;
      if (s.scope === "locality") {
        const [loc] = await query("SELECT slug FROM localities WHERE location_id = ? AND LOWER(name) = LOWER(?) AND is_published = 1 LIMIT 1", [property.locationId, property.locality]);
        localitySlug = loc?.slug || null;
      }
      return {
        scope: s.scope, label: s.label, rate, avgRate, minRate: Number(row.min_rate), maxRate: Number(row.max_rate),
        comparables, diffPercent, verdict, localitySlug,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Admin form → { fieldErrors } | { row } for the localities table.
export function validateLocality(body) {
  const e = {};
  const score = (k) => {
    if (body[k] === "" || body[k] == null) return null;
    const n = Number(body[k]);
    if (!Number.isInteger(n) || n < 1 || n > 10) { e[k] = "Give a score from 1 to 10, or leave it blank."; return null; }
    return n;
  };
  const cover = String(body.cover_image_url || "").trim();
  const row = {
    location_id: Number(body.location_id) || null,
    name: String(body.name || "").trim().slice(0, 160),
    description: String(body.description || "").trim() || null,
    cover_image_url: cover ? (/^\/uploads\/[\w./-]+$/.test(cover) || /^https?:\/\/\S+$/i.test(cover) ? cover.slice(0, 500) : undefined) : null,
    highlights: String(body.highlights || "").trim() || null,
    nearby: String(body.nearby || "").trim() || null,
    connectivity_score: score("connectivity_score"),
    safety_score: score("safety_score"),
    lifestyle_score: score("lifestyle_score"),
    is_published: body.is_published === false || body.is_published === 0 ? 0 : 1,
    sort_order: Number(body.sort_order) || 0,
  };
  if (!row.location_id) e.location_id = "Choose the city.";
  if (!row.name) e.name = "Enter the locality name exactly as sellers type it, e.g. \"Vaishali Nagar\".";
  if (row.cover_image_url === undefined) e.cover_image_url = "Upload the cover image again.";
  return Object.keys(e).length ? { fieldErrors: e } : { row };
}

