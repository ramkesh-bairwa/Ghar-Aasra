// Shared by the public "Add Property" submit route and the vendor panel's
// edit route, so a listing is validated and stored the same way no matter
// which screen it came from. Sellers get every listing field the admin
// form has, except the admin-only trust/curation flags (featured, verified,
// approved, premium, luxury, assigned agent, investment scores).

import { query } from "./db";
import { isCommercialEnabled, getSiteSetting } from "./queries";

// Statuses a vendor may set on their own listing.
export const VENDOR_STATUSES = ["published", "draft", "under_offer", "sold", "rented"];

export const ENUMS = {
  listing_type: ["sale", "rent", "commercial"],
  property_type: ["apartment", "villa", "house", "land", "commercial", "office"],
  price_period: ["one_time", "monthly", "yearly"],
  facing: ["east", "west", "north", "south", "north_east", "north_west", "south_east", "south_west"],
  furnishing: ["furnished", "semi_furnished", "unfurnished"],
  construction_status: ["ready_to_move", "under_construction", "new_launch"],
  ownership_type: ["freehold", "leasehold", "cooperative", "power_of_attorney"],
  listing_condition: ["new", "resale"],
  maintenance_frequency: ["monthly", "quarterly", "half_yearly", "yearly"],
  property_tax_status: ["paid", "pending", "included_in_maintenance"],
  capital_appreciation: ["low", "medium", "high"],
  // How `brokerage` reads: no brokerage, a fixed amount, or N months' rent.
  brokerage_type: ["none", "fixed", "months"],
};

// column -> [type, maxLength?]
const FIELDS = {
  title: ["string", 200], description: ["text"], bhk: ["string", 20], tags: ["string", 500],
  address: ["string", 255], locality: ["string", 160], state: ["string", 120], zip_code: ["string", 20],
  nearby_landmarks: ["text"], property_age: ["string", 60], min_rental_period: ["string", 60],
  owner_name: ["string", 160], rera_number: ["string", 100], builder_name: ["string", 160],
  tower_block: ["string", 80], unit_number: ["string", 40], parking_slot_number: ["string", 40],
  property_custom_id: ["string", 60],
  cover_image_url: ["url"], video_url: ["url"], virtual_tour_url: ["url"],
  floor_plan_url: ["url"], brochure_url: ["url"], site_plan_url: ["url"],
  price: ["number"], area_sqm: ["number"], carpet_area_sqm: ["number"], built_up_area_sqm: ["number"],
  latitude: ["number"], longitude: ["number"], maintenance_charges: ["number"], security_deposit: ["number"],
  brokerage: ["number"], registration_charges: ["number"], stamp_duty: ["number"], other_charges: ["number"],
  rental_yield_percent: ["number"], estimated_monthly_rent: ["number"],
  bedrooms: ["int"], bathrooms: ["int"], balconies: ["int"], floor_number: ["int"], total_floors: ["int"],
  parking_spaces: ["int"], location_id: ["int"], category_id: ["int"], subcategory_id: ["int"],
  possession_date: ["date"], available_from: ["date"], last_renovated_date: ["date"],
  parking: ["bool"], negotiable: ["bool"], loan_available: ["bool"],
  ...Object.fromEntries(Object.keys(ENUMS).map((k) => [k, ["enum"]])),
};

export const SELLER_FIELDS = Object.keys(FIELDS);

// Only http(s) links or files we uploaded — never javascript:/data: URLs,
// since these end up in href/src/iframe attributes on the public page.
function safeUrl(value) {
  const v = String(value).trim();
  return /^https?:\/\//i.test(v) || /^\/uploads\/[\w./-]+$/.test(v) ? v.slice(0, 500) : undefined;
}

function coerce(col, value) {
  const [type, max] = FIELDS[col];
  if (type === "bool") return value ? 1 : 0;
  if (value === undefined || value === null || value === "") return null;
  switch (type) {
    case "string": return String(value).trim().slice(0, max) || null;
    case "text": return String(value).trim() || null;
    case "url": return safeUrl(value);
    case "number": { const n = Number(value); return Number.isFinite(n) ? n : undefined; }
    case "int": { const n = Number(value); return Number.isInteger(n) ? n : undefined; }
    case "date": return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : undefined;
    case "enum": return ENUMS[col].includes(value) ? value : undefined;
    default: return undefined;
  }
}

// Friendly names for field-level error messages.
const LABELS = {
  title: "Title", description: "Description", bhk: "Configuration", tags: "Tags", address: "Street address",
  locality: "Locality", state: "State", zip_code: "PIN code", nearby_landmarks: "Nearby landmarks",
  property_age: "Property age", min_rental_period: "Minimum rental period", owner_name: "Owner name",
  rera_number: "RERA number", builder_name: "Builder name", tower_block: "Tower / block", unit_number: "Unit number",
  parking_slot_number: "Parking slot number", property_custom_id: "Property ID", cover_image_url: "Cover photo",
  video_url: "Video link", virtual_tour_url: "Virtual tour link", floor_plan_url: "Floor plan file",
  brochure_url: "Brochure file", site_plan_url: "Site plan file", price: "Price", area_sqm: "Plot area",
  carpet_area_sqm: "Carpet area", built_up_area_sqm: "Built-up area", latitude: "Map pin", longitude: "Map pin",
  maintenance_charges: "Maintenance charges", security_deposit: "Security deposit", brokerage: "Brokerage",
  registration_charges: "Registration charges", stamp_duty: "Stamp duty", other_charges: "Other charges",
  rental_yield_percent: "Rental yield", estimated_monthly_rent: "Estimated monthly rent", bedrooms: "Bedrooms",
  bathrooms: "Bathrooms", balconies: "Balconies", floor_number: "Floor", total_floors: "Total floors",
  parking_spaces: "Parking spaces", location_id: "City", category_id: "Category", subcategory_id: "Property type",
  possession_date: "Possession date", available_from: "Available from", last_renovated_date: "Last renovated date",
};

function typeError(col) {
  const [type] = FIELDS[col];
  const label = LABELS[col] || col.replace(/_/g, " ");
  if (type === "url") return `${label}: upload the file again or paste a full link starting with https://`;
  if (type === "number") return `${label} must be a number.`;
  if (type === "int") return `${label} must be a whole number.`;
  if (type === "date") return `${label}: pick a valid date.`;
  if (type === "enum") return `${label}: choose one of the options.`;
  return `Please check the ${label.toLowerCase()} field.`;
}

// Returns { error, fieldErrors } or { row, gallery, features, status } ready
// to write. fieldErrors maps each form field to a message the seller can act
// on; the wizard shows it under that field and jumps to its step.
export async function validateListing(body) {
  const row = {};
  const e = {};
  for (const col of SELLER_FIELDS) {
    if (!(col in body)) continue;
    const v = coerce(col, body[col]);
    if (v === undefined) e[col] = typeError(col);
    else row[col] = v;
  }

  const status = body.status === "draft" ? "draft" : "published";
  const live = status === "published";
  const nonNegative = ["price", "area_sqm", "carpet_area_sqm", "built_up_area_sqm", "maintenance_charges", "security_deposit",
    "brokerage", "registration_charges", "stamp_duty", "other_charges", "estimated_monthly_rent", "bedrooms", "bathrooms",
    "balconies", "total_floors", "parking_spaces"];
  for (const col of nonNegative) if (row[col] != null && row[col] < 0) e[col] = `${LABELS[col]} can't be negative.`;

  if (!row.title) e.title = "Give your property a title.";
  else if (row.title.length < 10) e.title = "Make the title at least 10 characters, e.g. \"2 BHK flat in Malviya Nagar\".";
  if (!row.listing_type) e.listing_type = "Choose whether you're selling or renting out.";
  if (!row.property_type) e.property_type = "Choose a property type.";

  // Categories and subcategories are managed by the admin only — a seller
  // can pick from them but never create or mismatch them.
  if (!row.subcategory_id) {
    e.subcategory_id = "Choose a property type from the list.";
  } else {
    const [sub] = await query("SELECT id, category_id FROM subcategories WHERE id = ? LIMIT 1", [row.subcategory_id]);
    if (!sub) e.subcategory_id = "That property type is no longer available. Please choose another one.";
    else if (row.category_id && Number(row.category_id) !== Number(sub.category_id)) e.subcategory_id = "The property type doesn't belong to the chosen category. Please pick it again.";
    else row.category_id = sub.category_id;
  }
  // City: an existing location id, or a typed / map-picked city name that is
  // matched to an existing city or (if allowed) added as a new one.
  const cityName = String(body.city_name || "").trim().slice(0, 120);
  let newCity = null;
  if (row.location_id) {
    const [loc] = await query("SELECT id FROM locations WHERE id = ? LIMIT 1", [row.location_id]);
    if (!loc) e.location_id = "That city is no longer available. Type the city again.";
  } else if (cityName) {
    const [loc] = await query("SELECT id FROM locations WHERE LOWER(city) = LOWER(?) ORDER BY id LIMIT 1", [cityName]);
    if (loc) row.location_id = loc.id;
    else if (cityName.length < 2 || !/[a-zA-Z\u0900-\u097F]/.test(cityName)) e.location_id = "Enter a valid city name.";
    else if ((await getSiteSetting("sellers_add_cities")) === "false") e.location_id = `We don't list properties in ${cityName} yet. Please choose one of our cities.`;
    else newCity = { city: cityName, region: String(body.state || "").trim().slice(0, 120) || null, country: String(body.country || "").trim().slice(0, 120) || "India" };
  }

  if (live) {
    if (!(row.price > 0)) e.price = row.listing_type === "rent" ? "Enter the monthly rent." : "Enter the asking price.";
    if (!row.cover_image_url) e.cover_image_url = "Add at least one photo before publishing. The first one becomes your cover.";
    if (!row.description || row.description.length < 30) e.description = "Write a description of at least 30 characters.";
    if (!row.location_id && !newCity && !e.location_id) e.location_id = "Enter the city.";
    if (!row.locality) e.locality = "Enter the locality or area.";
    if (!row.address) e.address = "Enter the street address.";
    if (row.property_type === "land") {
      if (!(row.area_sqm > 0)) e.area_sqm = "Enter the plot area.";
    } else if (!(row.carpet_area_sqm > 0) && !(Array.isArray(body.floorPlans) && body.floorPlans.length)) {
      e.carpet_area_sqm = "Enter the carpet area (usable floor area).";
    }
  }
  if (row.carpet_area_sqm > 0 && row.built_up_area_sqm > 0 && row.built_up_area_sqm < row.carpet_area_sqm) {
    e.built_up_area_sqm = "Built-up area includes walls, so it can't be smaller than the carpet area.";
  }
  if (row.floor_number != null && row.total_floors != null && row.floor_number > row.total_floors) {
    e.floor_number = "The floor can't be higher than the total floors in the building.";
  }
  if (row.rental_yield_percent != null && (row.rental_yield_percent < 0 || row.rental_yield_percent > 100)) {
    e.rental_yield_percent = "Rental yield should be a percentage between 0 and 100.";
  }
  if (row.zip_code && !/^[A-Za-z0-9 -]{3,12}$/.test(row.zip_code)) e.zip_code = "Enter a valid PIN / ZIP code.";
  if ((row.latitude == null) !== (row.longitude == null)) e.latitude = "The map pin looks incomplete. Drop it again or remove it.";
  if (row.latitude != null && (row.latitude < -90 || row.latitude > 90)) e.latitude = "The map pin is outside the map. Drop it again.";
  if (row.longitude != null && (row.longitude < -180 || row.longitude > 180)) e.latitude = "The map pin is outside the map. Drop it again.";

  if ((row.listing_type === "commercial" || ["commercial", "office"].includes(row.property_type)) && !(await isCommercialEnabled())) {
    e.listing_type = "Commercial listings aren't being accepted right now.";
  }
  if (row.listing_type !== "rent") row.price_period = "one_time";
  else if (!row.price_period || row.price_period === "one_time") row.price_period = "monthly";
  if (row.price == null) row.price = 0;
  if (row.brokerage_type === "none") row.brokerage = null;
  if (row.brokerage_type === "months" && !(row.brokerage > 0 && row.brokerage <= 12)) {
    e.brokerage = "Brokerage in months should be between 0.5 and 12.";
  }

  // Floor plans: each one needs a name, and custom sizes must make sense.
  (Array.isArray(body.floorPlans) ? body.floorPlans : []).forEach((p, i) => {
    const n = (v) => (v === "" || v == null ? null : Number(v));
    const name = String(p?.label || "").trim() || `Floor plan ${i + 1}`;
    if (!String(p?.label || "").trim()) e[`floorPlans.${i}.label`] = `Floor plan ${i + 1}: give it a name, e.g. "2 BHK".`;
    if (live && !(n(p?.carpet_area_sqm) > 0)) e[`floorPlans.${i}.carpet_area_sqm`] = `${name}: enter the carpet area.`;
    if (n(p?.built_up_area_sqm) !== null && n(p?.built_up_area_sqm) < n(p?.carpet_area_sqm)) {
      e[`floorPlans.${i}.built_up_area_sqm`] = `${name}: built-up area can't be smaller than the carpet area.`;
    }
    if (n(p?.super_area_sqm) !== null && n(p?.super_area_sqm) < (n(p?.built_up_area_sqm) ?? n(p?.carpet_area_sqm))) {
      e[`floorPlans.${i}.super_area_sqm`] = `${name}: super built-up area can't be smaller than the built-up area.`;
    }
  });

  const keys = Object.keys(e);
  if (keys.length) {
    return {
      error: keys.length === 1 ? e[keys[0]] : `Please fix ${keys.length} fields: ${Object.values(e).slice(0, 3).join(" ")}${keys.length > 3 ? " …" : ""}`,
      fieldErrors: e,
    };
  }

  if (newCity) row.location_id = await createLocation(newCity);

  // Unique photos only, and never the cover again.
  const gallery = [...new Set((Array.isArray(body.gallery) ? body.gallery : []).map(safeUrl).filter(Boolean))]
    .filter((u) => u !== row.cover_image_url)
    .slice(0, 20);
  const features = (Array.isArray(body.features) ? body.features : [])
    .map((f) => String(f).trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 150);
  return { row, gallery, features, status };
}

// A city a seller picked on the map that we didn't list yet. It shows up
// under Admin → Locations like any other city.
async function createLocation({ city, region, country }) {
  const base = city.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\u0900-\u097F]+/g, "-").replace(/^-+|-+$/g, "") || "city";
  let slug = base;
  for (let n = 2; (await query("SELECT id FROM locations WHERE slug = ? LIMIT 1", [slug])).length; n++) slug = `${base}-${n}`;
  const r = await query("INSERT INTO locations (city, region, country, slug) VALUES (?, ?, ?, ?)", [city, region, country, slug]);
  return r.insertId;
}

// Replace-all write of a listing's gallery and amenities.
export async function saveGalleryAndFeatures(propertyId, gallery, features) {
  await query("DELETE FROM property_images WHERE property_id = ?", [propertyId]);
  if (gallery.length) {
    const values = gallery.map((url, i) => [propertyId, url, i]);
    await query(
      `INSERT INTO property_images (property_id, image_url, sort_order) VALUES ${values.map(() => "(?, ?, ?)").join(", ")}`,
      values.flat()
    );
  }
  await query("DELETE FROM property_features WHERE property_id = ?", [propertyId]);
  const unique = [...new Set(features)];
  if (unique.length) {
    const values = unique.map((f) => [propertyId, f]);
    await query(
      `INSERT INTO property_features (property_id, feature) VALUES ${values.map(() => "(?, ?)").join(", ")}`,
      values.flat()
    );
  }
}

// The listing if `userId` owns it, else null.
export async function getOwnedListing(id, userId) {
  const rows = await query("SELECT * FROM properties WHERE id = ? AND owner_user_id = ? LIMIT 1", [Number(id), userId]);
  return rows[0] || null;
}
