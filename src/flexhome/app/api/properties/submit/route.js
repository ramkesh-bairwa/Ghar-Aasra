import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

const LISTING_TYPES = new Set(["sale", "rent", "commercial"]);
const PROPERTY_TYPES = new Set(["apartment", "villa", "house", "land", "commercial", "office"]);

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "property";
}

async function uniqueSlug(base) {
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await query("SELECT id FROM properties WHERE slug = ? LIMIT 1", [slug]);
    if (!existing.length) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json();
  const {
    title, description, listingType, propertyType, price, pricePeriod,
    bedrooms, bathrooms, areaSqm, address, locationId,
    coverImageUrl, gallery, features,
  } = body;

  if (!title || !title.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!LISTING_TYPES.has(listingType)) return NextResponse.json({ error: "Choose a valid listing type." }, { status: 400 });
  if (!PROPERTY_TYPES.has(propertyType)) return NextResponse.json({ error: "Choose a valid property type." }, { status: 400 });
  if (!price || Number(price) <= 0) return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  if (!coverImageUrl) return NextResponse.json({ error: "Add at least a cover photo." }, { status: 400 });

  try {
    const slug = await uniqueSlug(slugify(title));
    const result = await query(
      `INSERT INTO properties
        (title, slug, description, listing_type, property_type, price, price_period,
         bedrooms, bathrooms, area_sqm, address, location_id, cover_image_url, status, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0)`,
      [
        title.trim(), slug, description || null, listingType, propertyType, Number(price),
        pricePeriod === "monthly" || pricePeriod === "yearly" ? pricePeriod : "one_time",
        Number(bedrooms) || 0, Number(bathrooms) || 0, areaSqm ? Number(areaSqm) : null,
        address || null, locationId ? Number(locationId) : null, coverImageUrl,
      ]
    );
    const propertyId = result.insertId;

    const galleryUrls = Array.isArray(gallery) ? gallery.filter(Boolean) : [];
    if (galleryUrls.length) {
      const values = galleryUrls.map((url, i) => [propertyId, url, i]);
      await query(
        `INSERT INTO property_images (property_id, image_url, sort_order) VALUES ${values.map(() => "(?, ?, ?)").join(", ")}`,
        values.flat()
      );
    }

    const featureList = Array.isArray(features) ? features.filter(Boolean) : [];
    if (featureList.length) {
      const values = featureList.map((f) => [propertyId, f]);
      await query(
        `INSERT INTO property_features (property_id, feature) VALUES ${values.map(() => "(?, ?)").join(", ")}`,
        values.flat()
      );
    }

    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    return NextResponse.json({ error: "Could not publish your listing.", detail: err.message }, { status: 503 });
  }
}
