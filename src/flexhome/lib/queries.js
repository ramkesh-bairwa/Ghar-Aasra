// Every public page calls functions from this file instead of touching
// lib/db.js or lib/data.js directly. Each function tries MySQL first —
// the same tables the admin panel reads and writes — and falls back to
// the seed data in lib/data.js if the table is empty or the DB isn't
// configured yet. This is what makes "content comes from the admin
// panel" true: once you add/edit rows in /admin, these functions start
// returning that data automatically, with zero page code changes.

import { query } from "./db";
import * as seed from "./data";
import { SETTINGS_DEFAULTS } from "./siteSettingsSchema";

async function safeQuery(sql, params) {
  try {
    const rows = await query(sql, params);
    return rows;
  } catch {
    return null; // DB not reachable / not configured yet
  }
}

// ---------- Properties ----------
export async function listProperties(filters = {}) {
  const { listingType, propertyType, city, minPrice, maxPrice, minBedrooms, minBathrooms, furnishing, feature, featured, limit } = filters;
  const where = [];
  const params = [];
  if (listingType) { where.push("p.listing_type = ?"); params.push(listingType); }
  if (propertyType) { where.push("p.property_type = ?"); params.push(propertyType.toLowerCase()); }
  if (city) { where.push("(l.city LIKE ? OR p.address LIKE ?)"); params.push(`%${city}%`, `%${city}%`); }
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
    ORDER BY p.created_at DESC
    ${limit ? "LIMIT " + Number(limit) : ""}`;
  const rows = await safeQuery(sql, params);
  if (rows && rows.length) {
    const { currency_symbol } = await getAllSiteSettings();
    return rows.map((row) => mapDbProperty(row, currency_symbol));
  }

  // Fallback to seed data with equivalent filtering
  let list = seed.properties;
  if (listingType) list = list.filter((p) => p.listingType === listingType);
  if (propertyType) list = list.filter((p) => p.propertyType.toLowerCase() === propertyType.toLowerCase());
  if (city) {
    const needle = city.toLowerCase();
    list = list.filter((p) => p.city.toLowerCase().includes(needle) || (p.address || "").toLowerCase().includes(needle));
  }
  if (featured) list = list.filter((p) => p.featured);
  if (minPrice) list = list.filter((p) => p.priceValue >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.priceValue <= Number(maxPrice));
  if (minBedrooms) list = list.filter((p) => p.bedrooms >= Number(minBedrooms));
  if (minBathrooms) list = list.filter((p) => p.bathrooms >= Number(minBathrooms));
  if (furnishing) list = list.filter((p) => p.furnishing === furnishing);
  if (feature) list = list.filter((p) => (p.features || []).includes(feature));
  if (limit) list = list.slice(0, Number(limit));
  return list;
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
     WHERE p.slug = ? LIMIT 1`,
    [slug]
  );
  if (rows && rows.length) {
    const { currency_symbol } = await getAllSiteSettings();
    return mapDbProperty(rows[0], currency_symbol);
  }
  return seed.properties.find((p) => p.slug === slug) || null;
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
    agentId: row.agent_id,
    description: row.description, features: row.feature_list ? row.feature_list.split("||") : [],
  };
}
function formatPrice(value, period, currencySymbol = "$") {
  const n = `${currencySymbol}${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return period === "monthly" ? `${n}/mo` : period === "yearly" ? `${n}/yr` : n;
}

// ---------- Agents ----------
export async function listAgents() {
  const rows = await safeQuery(
    `SELECT a.*, u.name, u.email, u.phone, u.avatar_url FROM agents a JOIN users u ON a.user_id = u.id`
  );
  if (rows && rows.length) return rows.map(mapDbAgent);
  return seed.agents;
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
    propertiesCount: 0,
  };
}

// ---------- Developers ----------
export async function listDevelopers() {
  const rows = await safeQuery(`SELECT * FROM developers`);
  if (rows && rows.length) return rows.map(mapDbDeveloper);
  return seed.developers;
}
export async function getDeveloperBySlug(slug) {
  const list = await listDevelopers();
  return list.find((d) => d.slug === slug) || null;
}
function mapDbDeveloper(row) {
  return {
    id: row.id, slug: (row.company_name || "").toLowerCase().replace(/\s+/g, "-"),
    companyName: row.company_name, logo: row.logo_url, foundedYear: row.founded_year,
    website: row.website, description: row.description, projectsCount: 0,
  };
}

// ---------- Projects ----------
export async function listProjects() {
  const rows = await safeQuery(`SELECT * FROM projects`);
  if (rows && rows.length) return rows.map(mapDbProject);
  return seed.projects;
}
export async function getProjectBySlug(slug) {
  const list = await listProjects();
  return list.find((p) => p.slug === slug) || null;
}
function mapDbProject(row) {
  return {
    id: row.id, slug: row.slug, name: row.name, developerId: row.developer_id, locationId: row.location_id,
    status: row.status, handover: row.handover_date, startingPrice: row.starting_price,
    totalUnits: row.total_units, image: row.cover_image_url, gallery: [row.cover_image_url].filter(Boolean),
    description: row.description, amenities: [],
  };
}

// ---------- Locations ----------
export async function listLocations() {
  const rows = await safeQuery(`SELECT * FROM locations`);
  if (rows && rows.length) return rows.map((r) => ({
    id: r.id, slug: r.slug, city: r.city, country: r.country,
    propertiesCount: 0, image: r.cover_image_url, description: r.description,
  }));
  return seed.locations;
}
export async function getLocationBySlug(slug) {
  const list = await listLocations();
  return list.find((l) => l.slug === slug) || null;
}

// ---------- Blog ----------
export async function listBlogPosts() {
  const rows = await safeQuery(`SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`);
  if (rows && rows.length) return rows.map(mapDbPost);
  return seed.blogPosts;
}
export async function getBlogPostBySlug(slug) {
  const list = await listBlogPosts();
  return list.find((p) => p.slug === slug) || null;
}
function mapDbPost(row) {
  return {
    id: row.id, slug: row.slug, title: row.title, category: row.category,
    date: row.published_at, author: "Flex Home Editorial", image: row.cover_image_url,
    excerpt: row.excerpt, content: row.content,
  };
}

// ---------- FAQs ----------
export async function listFaqs() {
  const rows = await safeQuery(`SELECT * FROM faqs ORDER BY sort_order ASC`);
  if (rows && rows.length) return rows;
  return seed.faqs;
}

// ---------- Static pages ----------
export async function getStaticPage(slug) {
  const rows = await safeQuery(`SELECT * FROM pages WHERE slug = ? LIMIT 1`, [slug]);
  if (rows && rows.length) return { title: rows[0].title, content: rows[0].content };
  return seed.staticPages[slug] || null;
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
const FALLBACK_AMENITIES = [
  { id: 1, name: "Roof terrace", icon_key: "roof_terrace", category: "outdoor_lifestyle" },
  { id: 2, name: "Parking", icon_key: "parking", category: "parking_convenience" },
  { id: 3, name: "Swimming pool", icon_key: "swimming_pool", category: "outdoor_lifestyle" },
  { id: 4, name: "Pet friendly", icon_key: "pet_friendly", category: "outdoor_lifestyle" },
  { id: 5, name: "Home office", icon_key: "home_office", category: "interior_features" },
  { id: 6, name: "Concierge", icon_key: "concierge", category: "premium_advanced" },
  { id: 7, name: "Garden", icon_key: "garden", category: "outdoor_lifestyle" },
];

export async function getAmenities() {
  const rows = await safeQuery(`SELECT id, name, icon_key, category FROM amenities ORDER BY sort_order ASC`);
  if (rows && rows.length) return rows;
  return FALLBACK_AMENITIES;
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

// ---------- Everything else stays as-is from seed data for now ----------
export const { categories, stats, testimonials } = seed;
