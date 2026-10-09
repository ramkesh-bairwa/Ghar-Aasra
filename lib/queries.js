// Every public page calls functions from this file instead of touching
// lib/db.js directly. All content comes from MySQL — the same tables the
// admin panel reads and writes — so adding/editing rows in /admin shows up
// on the site with zero page code changes. Demo content is loaded into
// those tables by `npm run db:seed` (database/seed-data.mjs).

import { query } from "./db";
import { SETTINGS_DEFAULTS } from "./siteSettingsSchema";

async function safeQuery(sql, params) {
  try {
    const rows = await query(sql, params);
    return rows;
  } catch (err) {
    console.error("[queries] MySQL query failed:", err.message);
    return null; // DB not reachable / not configured yet
  }
}

async function currencySymbol() {
  return (await getAllSiteSettings()).currency_symbol;
}

// "2026-08-24 00:00:00" -> "Aug 24, 2026"
function formatDate(value) {
  if (!value) return "";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
}

// "2027-06-30" -> "Q2 2027"
function formatQuarter(value) {
  if (!value) return "TBA";
  const [year, month] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month) return String(value);
  return `Q${Math.ceil(month / 3)} ${year}`;
}

function splitLines(text) {
  return String(text || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

// ---------- Properties ----------
// "Commercial" covers commercial listings plus office/shop property types;
// all of them are hidden from the public site when the admin switches
// Site Settings → Listings → "Show commercial properties" off.
const COMMERCIAL_SQL = "(p.listing_type = 'commercial' OR p.property_type IN ('commercial', 'office'))";
const COMMERCIAL_PROPERTY_TYPES = ["commercial", "office"];

export async function isCommercialEnabled() {
  return (await getAllSiteSettings()).commercial_enabled !== "false";
}

export function isCommercialProperty(property) {
  return property.listingType === "commercial" || COMMERCIAL_PROPERTY_TYPES.includes(property.propertyType);
}

const SORT_SQL = {
  newest: "p.created_at DESC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
  area_desc: "COALESCE(p.built_up_area_sqm, p.carpet_area_sqm, p.area_sqm) DESC",
  popular: "COALESCE(p.views_count, 0) DESC, p.created_at DESC",
};

// Admin "Unpublish" sets a listing to draft; drafts must never reach the
// public site (lists, detail page, counts, booking). Every other status —
// published, under_offer, sold, rented — is a live listing.
const PUBLIC_SQL = "p.status != 'draft'";

export async function listProperties(filters = {}) {
  const { listingType, propertyType, city, locality, minPrice, maxPrice, minBedrooms, minBathrooms, furnishing, feature, featured, limit, sort, sponsoredFirst } = filters;
  const where = [PUBLIC_SQL];
  const params = [];
  // Drafts, sold and rented listings (set by admins or vendors) stay off the public site.
  where.push("p.status IN ('published', 'under_offer')");
  if (!(await isCommercialEnabled())) where.push(`NOT ${COMMERCIAL_SQL}`);
  if (listingType) { where.push("p.listing_type = ?"); params.push(listingType); }
  if (propertyType) { where.push("p.property_type = ?"); params.push(propertyType.toLowerCase()); }
  if (city) { where.push("(l.city LIKE ? OR p.address LIKE ?)"); params.push(`%${city}%`, `%${city}%`); }
  if (locality) { where.push("(p.locality LIKE ? OR p.address LIKE ?)"); params.push(`%${locality}%`, `%${locality}%`); }
  if (minPrice) { where.push("p.price >= ?"); params.push(Number(minPrice)); }
  if (maxPrice) { where.push("p.price <= ?"); params.push(Number(maxPrice)); }
  if (minBedrooms) { where.push("p.bedrooms >= ?"); params.push(Number(minBedrooms)); }
  if (minBathrooms) { where.push("p.bathrooms >= ?"); params.push(Number(minBathrooms)); }
  if (furnishing) { where.push("p.furnishing = ?"); params.push(furnishing); }
  if (feature) { where.push("EXISTS (SELECT 1 FROM property_features pf WHERE pf.property_id = p.id AND pf.feature = ?)"); params.push(feature); }
  if (featured) { where.push("p.featured = 1"); }
  const sql = `
    SELECT p.*, l.city AS city, l.slug AS location_slug, c.name AS category_name, sc.name AS subcategory_name,
      (SELECT GROUP_CONCAT(pf.feature SEPARATOR '||') FROM property_features pf WHERE pf.property_id = p.id) AS feature_list,
      (SELECT GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order SEPARATOR '||') FROM property_images pi WHERE pi.property_id = p.id) AS gallery_list
    FROM properties p
    LEFT JOIN locations l ON p.location_id = l.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ${sponsoredFirst ? "(p.sponsored_until IS NOT NULL AND p.sponsored_until >= NOW()) DESC, " : ""}${SORT_SQL[sort] || SORT_SQL.newest}
    ${limit ? "LIMIT " + Number(limit) : ""}`;
  const rows = await safeQuery(sql, params);
  if (rows && rows.length) {
    const { currency_symbol } = await getAllSiteSettings();
    return rows.map((row) => mapDbProperty(row, currency_symbol));
  }

  return [];
}

// Unit configurations (1 BHK, 2 BHK…) with their areas, price and plan drawing.
async function getFloorPlans(propertyId) {
  const rows = await safeQuery(
    `SELECT id, label, bedrooms, bathrooms, balconies, carpet_area_sqm, built_up_area_sqm, super_area_sqm, price, image_url
     FROM property_floor_plans WHERE property_id = ? ORDER BY sort_order ASC, id ASC`,
    [propertyId]
  );
  const n = (v) => (v == null ? null : Number(v));
  return (rows || []).map((r) => ({
    id: r.id,
    label: r.label,
    bedrooms: n(r.bedrooms),
    bathrooms: n(r.bathrooms),
    balconies: n(r.balconies),
    carpetAreaSqm: n(r.carpet_area_sqm),
    builtUpAreaSqm: n(r.built_up_area_sqm),
    superAreaSqm: n(r.super_area_sqm),
    price: n(r.price),
    imageUrl: r.image_url || null,
  }));
}

export async function getPropertyBySlug(slug) {
  const rows = await safeQuery(
    `SELECT p.*, l.city AS city, l.slug AS location_slug, c.name AS category_name, sc.name AS subcategory_name,
       (SELECT GROUP_CONCAT(pf.feature SEPARATOR '||') FROM property_features pf WHERE pf.property_id = p.id) AS feature_list,
       (SELECT GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order SEPARATOR '||') FROM property_images pi WHERE pi.property_id = p.id) AS gallery_list
     FROM properties p
     LEFT JOIN locations l ON p.location_id = l.id
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
     WHERE p.slug = ? AND ${PUBLIC_SQL} LIMIT 1`,
    [slug]
  );
  if (rows && rows.length) {
    const { currency_symbol } = await getAllSiteSettings();
    if (!["published", "under_offer"].includes(rows[0].status)) return null;
    const property = mapDbProperty(rows[0], currency_symbol);
    if (isCommercialProperty(property) && !(await isCommercialEnabled())) return null;
    property.floorPlans = await getFloorPlans(rows[0].id);
    return property;
  }
  return null;
}

function mapDbProperty(row, currencySymbol) {
  return {
    id: row.id, slug: row.slug, title: row.title, listingType: row.listing_type,
    propertyType: row.property_type, price: formatPrice(row.price, row.price_period, currencySymbol),
    priceValue: Number(row.price), bedrooms: row.bedrooms, bathrooms: row.bathrooms,
    area: row.area_sqm ? `${row.area_sqm} m²` : "—",
    areaSqm: row.area_sqm != null ? Number(row.area_sqm) : null,
    carpetArea: row.carpet_area_sqm ? `${row.carpet_area_sqm} m²` : null,
    carpetAreaSqm: row.carpet_area_sqm != null ? Number(row.carpet_area_sqm) : null,
    builtUpArea: row.built_up_area_sqm ? `${row.built_up_area_sqm} m²` : null,
    builtUpAreaSqm: row.built_up_area_sqm != null ? Number(row.built_up_area_sqm) : null,
    balconies: row.balconies || 0,
    floorNumber: row.floor_number ?? null,
    totalFloors: row.total_floors ?? null,
    propertyAge: row.property_age || null,
    facing: row.facing || null,
    furnishing: row.furnishing || null,
    parking: !!row.parking,
    parkingSpaces: row.parking_spaces || 0,
    constructionStatus: row.construction_status || null,
    possessionDate: row.possession_date || null,
    // Property Intelligence
    verified: !!row.verified,
    approved: !!row.approved,
    reraNumber: row.rera_number || null,
    ownershipType: row.ownership_type || null,
    listingCondition: row.listing_condition || null,
    builderName: row.builder_name || null,
    towerBlock: row.tower_block || null,
    unitNumber: row.unit_number || null,
    parkingSlotNumber: row.parking_slot_number || null,
    propertyCustomId: row.property_custom_id || null,
    lastRenovatedDate: row.last_renovated_date || null,
    maintenanceCharges: row.maintenance_charges != null ? Number(row.maintenance_charges) : null,
    maintenanceFrequency: row.maintenance_frequency || null,
    propertyTaxStatus: row.property_tax_status || null,
    loanAvailable: !!row.loan_available,
    // Financial & Investment
    rentalYieldPercent: row.rental_yield_percent != null ? Number(row.rental_yield_percent) : null,
    estimatedMonthlyRent: row.estimated_monthly_rent != null ? Number(row.estimated_monthly_rent) : null,
    capitalAppreciation: row.capital_appreciation || null,
    brokerage: row.brokerage != null ? Number(row.brokerage) : null,
    brokerageType: row.brokerage_type || null, // 'none' | 'fixed' | 'months' (null = fixed)
    registrationCharges: row.registration_charges != null ? Number(row.registration_charges) : null,
    stampDuty: row.stamp_duty != null ? Number(row.stamp_duty) : null,
    otherCharges: row.other_charges != null ? Number(row.other_charges) : null,
    investmentScore: row.investment_score ?? null,
    rentalDemandScore: row.rental_demand_score ?? null,
    locationGrowthScore: row.location_growth_score ?? null,
    futureDevelopmentScore: row.future_development_score ?? null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    city: row.city, locationSlug: row.location_slug,
    categoryName: row.category_name || null, subcategoryName: row.subcategory_name || null,
    subcategoryId: row.subcategory_id ?? null,
    address: row.address, image: row.cover_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop",
    videoUrl: row.video_url || null, gallery: row.gallery_list ? row.gallery_list.split("||") : [],
    tag: row.listing_type === "rent" ? "Renting" : "Selling", featured: !!row.featured,
    sponsored: !!row.sponsored_until && new Date(String(row.sponsored_until).replace(" ", "T")) >= new Date(),
    agentId: row.agent_id,
    projectId: row.project_id ?? null,
    pricePeriod: row.price_period || "one_time",
    locationId: row.location_id ?? null,
    listedAt: row.created_at || null,
    viewsCount: Number(row.views_count || 0),
    description: row.description, features: row.feature_list ? row.feature_list.split("||") : [],
    // Media & documents
    virtualTourUrl: row.virtual_tour_url || null,
    floorPlanUrl: row.floor_plan_url || null,
    brochureUrl: row.brochure_url || null,
    sitePlanUrl: row.site_plan_url || null,
    // Rental / commercial terms
    negotiable: !!row.negotiable,
    securityDeposit: row.security_deposit != null ? Number(row.security_deposit) : null,
    minRentalPeriod: row.min_rental_period || null,
    availableFrom: row.available_from || null,
    // Address extras (owner_name is intentionally NOT exposed publicly)
    locality: row.locality || null,
    state: row.state || null,
    zipCode: row.zip_code || null,
    nearbyLandmarks: row.nearby_landmarks || null,
    bhk: row.bhk || null,
    tags: row.tags ? String(row.tags).split(",").map((t) => t.trim()).filter(Boolean) : [],
  };
}
function formatPrice(value, period, currencySymbol = "$") {
  const n = `${currencySymbol}${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return period === "monthly" ? `${n}/mo` : period === "yearly" ? `${n}/yr` : n;
}

// ---------- Agents ----------
export async function listAgents() {
  const rows = await safeQuery(
    `SELECT a.*, u.name, u.email, u.phone, u.avatar_url,
       (SELECT COUNT(*) FROM properties p WHERE p.agent_id = a.id AND ${PUBLIC_SQL}) AS properties_count
     FROM agents a JOIN users u ON a.user_id = u.id
     ORDER BY a.id ASC`
  );
  return (rows || []).map(mapDbAgent);
}
export async function getAgentBySlug(slug) {
  const list = await listAgents();
  return list.find((a) => a.slug === slug) || null;
}
function mapDbAgent(row) {
  return {
    id: row.id, slug: (row.name || "").toLowerCase().replace(/\s+/g, "-"), name: row.name,
    phone: row.phone, email: row.email, whatsapp: row.whatsapp, agencyName: row.agency_name,
    bio: row.bio, yearsExperience: row.years_experience, rating: row.rating, reviewCount: row.review_count,
    image: row.avatar_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=500&auto=format&fit=crop",
    propertiesCount: Number(row.properties_count || 0),
  };
}

// ---------- Developers ----------
export async function listDevelopers() {
  const rows = await safeQuery(
    `SELECT d.*, (SELECT COUNT(*) FROM projects pr WHERE pr.developer_id = d.id) AS projects_count
     FROM developers d ORDER BY d.id ASC`
  );
  return (rows || []).map(mapDbDeveloper);
}
export async function getDeveloperBySlug(slug) {
  const list = await listDevelopers();
  return list.find((d) => d.slug === slug) || null;
}
function mapDbDeveloper(row) {
  return {
    id: row.id, slug: (row.company_name || "").toLowerCase().replace(/\s+/g, "-"),
    companyName: row.company_name, logo: row.logo_url, foundedYear: row.founded_year,
    website: row.website, description: row.description, projectsCount: Number(row.projects_count || 0),
  };
}

// ---------- Projects ----------
export async function listProjects() {
  const rows = await safeQuery(`SELECT * FROM projects ORDER BY id ASC`);
  if (!rows) return [];
  const symbol = await currencySymbol();
  return rows.map((row) => mapDbProject(row, symbol));
}
export async function getProjectBySlug(slug) {
  const list = await listProjects();
  return list.find((p) => p.slug === slug) || null;
}
function mapDbProject(row, symbol) {
  const gallery = splitLines(row.gallery);
  return {
    id: row.id, slug: row.slug, name: row.name, developerId: row.developer_id, locationId: row.location_id,
    status: row.status, handover: formatQuarter(row.handover_date),
    startingPrice: row.starting_price != null ? formatPrice(row.starting_price, null, symbol) : "Price on request",
    totalUnits: row.total_units, image: row.cover_image_url,
    gallery: gallery.length ? gallery : [row.cover_image_url].filter(Boolean),
    description: row.description, amenities: splitLines(row.amenities),
  };
}

// ---------- Locations ----------
export async function listLocations() {
  const rows = await safeQuery(
    `SELECT l.*, (SELECT COUNT(*) FROM properties p WHERE p.location_id = l.id AND ${PUBLIC_SQL}) AS properties_count
     FROM locations l ORDER BY l.id ASC`
  );
  return (rows || []).map((r) => ({
    id: r.id, slug: r.slug, city: r.city, country: r.country,
    propertiesCount: Number(r.properties_count || 0), image: r.cover_image_url, description: r.description,
  }));
}
export async function getLocationBySlug(slug) {
  const list = await listLocations();
  return list.find((l) => l.slug === slug) || null;
}

// ---------- Blog ----------
export async function listBlogPosts() {
  const rows = await safeQuery(
    `SELECT b.*, u.name AS author_name FROM blog_posts b LEFT JOIN users u ON b.author_id = u.id
     WHERE b.status = 'published' ORDER BY b.published_at DESC`
  );
  return (rows || []).map(mapDbPost);
}
export async function getBlogPostBySlug(slug) {
  const list = await listBlogPosts();
  return list.find((p) => p.slug === slug) || null;
}
function mapDbPost(row) {
  return {
    id: row.id, slug: row.slug, title: row.title, category: row.category,
    date: formatDate(row.published_at), author: row.author_name || "Editorial team", image: row.cover_image_url,
    excerpt: row.excerpt, content: row.content,
  };
}

// ---------- FAQs ----------
export async function listFaqs() {
  return (await safeQuery(`SELECT * FROM faqs ORDER BY sort_order ASC, id ASC`)) || [];
}

// ---------- Static pages ----------
export async function getStaticPage(slug) {
  const rows = await safeQuery(`SELECT * FROM pages WHERE slug = ? LIMIT 1`, [slug]);
  if (rows && rows.length) return { title: rows[0].title, content: rows[0].content };
  return null;
}

// ---------- Homepage content ----------
export async function listTestimonials() {
  return (await safeQuery(`SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC`)) || [];
}

export async function listStats() {
  return (await safeQuery(`SELECT * FROM site_stats ORDER BY sort_order ASC, id ASC`)) || [];
}

// "Browse by property type" tiles, each with a live count of matching listings.
export async function listHomeCategories() {
  const rows = await safeQuery(
    `SELECT hc.*, (SELECT COUNT(*) FROM properties p WHERE p.property_type = hc.property_type AND ${PUBLIC_SQL}) AS listings_count
     FROM home_categories hc ORDER BY hc.sort_order ASC, hc.id ASC`
  );
  const commercialOn = await isCommercialEnabled();
  return (rows || []).filter((r) => commercialOn || !COMMERCIAL_PROPERTY_TYPES.includes(r.property_type)).map((r) => ({
    name: r.name, slug: r.property_type, icon: r.icon, count: Number(r.listings_count || 0),
  }));
}

// ---------- Site settings (key/value store) ----------
// Cached in-process for a few seconds so pages that render many components
// (each of which may read a setting) don't hammer the DB with one query
// per component — while still picking up admin edits almost immediately.
const globalForSettings = globalThis;
const SETTINGS_TTL_MS = 10_000;

export async function getAllSiteSettings() {
  const cached = globalForSettings.__siteSettingsCache;
  if (cached && Date.now() - cached.ts < SETTINGS_TTL_MS) return cached.data;

  const merged = { ...SETTINGS_DEFAULTS };
  const rows = await safeQuery(`SELECT setting_key, setting_value FROM site_settings`);
  if (rows) {
    for (const row of rows) {
      if (row.setting_value !== null && row.setting_value !== "") merged[row.setting_key] = row.setting_value;
    }
  }
  globalForSettings.__siteSettingsCache = { data: merged, ts: Date.now() };
  return merged;
}

export function invalidateSiteSettingsCache() {
  globalForSettings.__siteSettingsCache = null;
}

export async function getSiteSetting(key) {
  const all = await getAllSiteSettings();
  return all[key] ?? null;
}

// ---------- Amenities (managed master list, used to show icons for features) ----------

export async function getAmenities() {
  return (await safeQuery(`SELECT id, name, icon_key, category FROM amenities ORDER BY sort_order ASC`)) || [];
}

// Amenity names offered in the public search filter (toggled per amenity in /admin/amenities).
export async function listFilterAmenities() {
  const rows = await safeQuery(`SELECT name FROM amenities WHERE show_in_filters = 1 ORDER BY sort_order ASC, id ASC`);
  return (rows || []).map((r) => r.name);
}

// ---------- Carpet area presets (used on the property page's "explore
// other configurations" selector — same data the admin form's preset
// picker uses to prefill carpet/built-up area + bedrooms). ----------
export async function getCarpetAreaPresets(subcategoryId) {
  if (!subcategoryId) return [];
  const rows = await safeQuery(
    `SELECT id, label, carpet_area_sqm, built_up_area_sqm, bedrooms
     FROM carpet_area_presets WHERE subcategory_id = ? ORDER BY sort_order ASC`,
    [subcategoryId]
  );
  return rows || [];
}

// ---------- Price insight: this listing's price per m² against other
// listings on the site in the same location, listing type and price period.
// Returns null unless there are at least 3 comparables, so the comparison
// is never drawn from too thin a sample. ----------
export async function getPriceInsight(property) {
  const area = property.builtUpAreaSqm || property.carpetAreaSqm || property.areaSqm;
  if (!property.locationId || !area || !property.priceValue) return null;
  const rows = await safeQuery(
    `SELECT AVG(price / COALESCE(NULLIF(built_up_area_sqm, 0), NULLIF(carpet_area_sqm, 0), NULLIF(area_sqm, 0))) AS avg_rate,
            COUNT(*) AS n
     FROM properties
     WHERE location_id = ? AND listing_type = ? AND price_period = ? AND id != ? AND price > 0 AND status != 'draft'
       AND COALESCE(NULLIF(built_up_area_sqm, 0), NULLIF(carpet_area_sqm, 0), NULLIF(area_sqm, 0)) IS NOT NULL`,
    [property.locationId, property.listingType, property.pricePeriod, property.id]
  );
  const avgRate = Number(rows?.[0]?.avg_rate || 0);
  const comparables = Number(rows?.[0]?.n || 0);
  if (comparables < 3 || !avgRate) return null;
  const rate = property.priceValue / area;
  return { rate, avgRate, comparables, diffPercent: Math.round(((rate - avgRate) / avgRate) * 100) };
}

export async function incrementPropertyViews(slug) {
  await safeQuery("UPDATE properties SET views_count = COALESCE(views_count, 0) + 1 WHERE slug = ?", [slug]);
}

// ---------- Visit demand (real counts only — powers the "N people booked a
// visit recently" line on the property page; never padded or estimated) ----------
export async function getRecentVisitCount(propertyId, days = 30) {
  if (!propertyId) return 0;
  const rows = await safeQuery(
    `SELECT
       (SELECT COUNT(*) FROM bookings WHERE property_id = ? AND status != 'cancelled' AND created_at >= NOW() - INTERVAL ? DAY) +
       (SELECT COUNT(*) FROM visit_requests WHERE property_id = ? AND created_at >= NOW() - INTERVAL ? DAY) AS n`,
    [propertyId, days, propertyId, days]
  );
  return Number(rows?.[0]?.n || 0);
}
